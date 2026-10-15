#!/usr/bin/env python3
"""Drive API -> public, versioned JPEG covers + static catalog. No PDF persistence.
Secrets are consumed only from the scheduled runner's environment, never logged.
"""
from __future__ import annotations
import argparse, copy, hashlib, io, json, os, re, sys, tempfile, time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse
import requests
from PIL import Image, ImageStat
import pypdfium2 as pdfium

ID = re.compile(r"^[A-Za-z0-9_-]{15,100}$")
SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
FIELDS = 'nextPageToken,incompleteSearch,files(id,name,mimeType,parents,size,modifiedTime,md5Checksum,thumbnailLink)'
class SyncError(Exception): pass
class Deferred(SyncError): pass

def utcnow(): return datetime.now(timezone.utc)
def stamp(dt): return dt.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
def parse_time(text):
    try: return datetime.fromisoformat(str(text).replace('Z','+00:00'))
    except (ValueError,TypeError): return datetime(1970,1,1,tzinfo=timezone.utc)
def atomic_json(path, data):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix('.tmp'); tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');tmp.replace(path)
def fingerprint(item):
    return hashlib.sha256(json.dumps([item['id'],item.get('md5Checksum',''),item.get('modifiedTime',''),str(item.get('size',''))],separators=(',',':')).encode()).hexdigest()[:16]
def public_asset(root, relative):
    return root / 'library-data' / 'covers' / relative

def clean_jpeg(data, width=600, max_bytes=250000):
    with Image.open(io.BytesIO(data)) as source:
        if source.width*source.height > 32_000_000: raise SyncError('Gambar sampul terlalu besar.')
        source.load();image=source.convert('RGB')
    image.thumbnail((width,1000),Image.Resampling.LANCZOS)
    for quality in (85,75,65,55):
        buf=io.BytesIO();image.save(buf,'JPEG',quality=quality,optimize=True)
        if len(buf.getvalue())<=max_bytes: return buf.getvalue(), image.width, image.height
    raise SyncError('Ukuran sampul belum dapat diperkecil.')

def pdf_cover(path, config):
    try:
        with pdfium.PdfDocument(path) as doc:
            if not len(doc): raise SyncError('PDF tidak memiliki halaman.')
            chosen=None
            for index in range(min(3,len(doc))):
                page=doc[index]
                try:
                    width,height=page.get_size()
                    if width<=0 or height<=0: continue
                    scale=min(config['coverWidth']/width,1000/height,3)
                    bitmap=page.render(scale=scale)
                    try:
                        im=bitmap.to_pil().convert('RGB')
                        buf=io.BytesIO();im.save(buf,'PNG');chosen=buf.getvalue()
                        if ImageStat.Stat(im.convert('L')).stddev[0]>3: break
                    finally: bitmap.close()
                finally: page.close()
            if chosen is None: raise SyncError('Halaman awal tidak dapat dirender.')
            return clean_jpeg(chosen,config['coverWidth'],config['maxCoverBytes'])
    except SyncError: raise
    except Exception as exc:
        if getattr(exc,'err_code',None)==4:raise SyncError('PDF berpassword; sampul tidak dapat dibuat.') from None
        raise SyncError('PDF rusak atau halaman awal tidak dapat diproses.') from None

class DriveClient:
    """Least privilege: one service account, Drive read-only scope, folder Viewer."""
    def __init__(self, credentials):
        self.credentials=credentials;self.session=requests.Session();self.public_session=requests.Session()
    @classmethod
    def from_env(cls):
        raw=os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON','')
        if not raw: raise SyncError('Secret GOOGLE_SERVICE_ACCOUNT_JSON belum diisi.')
        try:
            from google.oauth2 import service_account
            info=json.loads(raw)
            if info.get('type')!='service_account': raise ValueError()
            creds=service_account.Credentials.from_service_account_info(info,scopes=[SCOPE])
        except Exception: raise SyncError('Secret akun layanan Google tidak valid; periksa JSON di GitHub Secrets.') from None
        return cls(creds)
    def _headers(self):
        if not self.credentials.valid:
            from google.auth.transport.requests import Request
            try: self.credentials.refresh(Request(session=self.session))
            except Exception: raise SyncError('Autentikasi Google gagal. Periksa key dan akses Viewer folder.') from None
        return {'Authorization':'Bearer '+self.credentials.token}
    def _get(self, url, *, params=None, stream=False):
        for attempt in range(3):
            try:
                response=self.session.get(url,params=params,headers=self._headers(),stream=stream,timeout=(10,60))
            except requests.RequestException:
                if attempt<2: time.sleep(2**attempt);continue
                raise SyncError('Koneksi Google Drive API gagal.') from None
            if response.status_code in (429,500,502,503,504):
                response.close()
                if attempt<2: time.sleep(2**attempt);continue
                raise SyncError('Google Drive API sibuk; proses akan dicoba pada jadwal berikutnya.')
            if response.status_code!=200:
                code=response.status_code;response.close()
                if code in (401,403): raise SyncError('Akses Drive ditolak. Aktifkan Drive API dan beri akun layanan akses Viewer folder.')
                raise SyncError('Google Drive API gagal ('+str(code)+').')
            return response
        raise SyncError('Google Drive API belum tersedia.')
    def list_files(self, folder_id):
        with self._get('https://www.googleapis.com/drive/v3/files/'+folder_id,params={'fields':'id,mimeType'}) as r:
            folder=r.json()
        if folder.get('id')!=folder_id or folder.get('mimeType')!='application/vnd.google-apps.folder': raise SyncError('Folder sumber tidak valid.')
        rows=[];token=None;tokens=set()
        while True:
            params={'q':"'"+folder_id+"' in parents and trashed = false and mimeType = 'application/pdf'",'fields':FIELDS,'pageSize':1000,'spaces':'drive'}
            if token: params['pageToken']=token
            with self._get('https://www.googleapis.com/drive/v3/files',params=params) as r: page=r.json()
            if not isinstance(page,dict) or not isinstance(page.get('files',[]),list) or page.get('incompleteSearch'): raise SyncError('Daftar Drive belum lengkap; katalog lama dipertahankan.')
            rows.extend(page.get('files',[]));token=page.get('nextPageToken')
            if not token: break
            if token in tokens: raise SyncError('Pagination Drive berulang; katalog lama dipertahankan.')
            tokens.add(token)
        seen=set();out=[]
        for item in rows:
            if not isinstance(item,dict) or not ID.fullmatch(str(item.get('id',''))) or item.get('mimeType')!='application/pdf' or folder_id not in item.get('parents',[]) or not str(item.get('name','')).strip():
                raise SyncError('Metadata Drive tidak valid; katalog lama dipertahankan.')
            if item['id'] not in seen:seen.add(item['id']);out.append(item)
        return sorted(out,key=lambda x:x['name'].casefold())
    def is_public(self, file_id):
        # Never publish a private child's name/cover just because the service account can see it.
        url='https://drive.usercontent.google.com/download'
        try:
            with requests.get(url,params={'id':file_id,'export':'download'},headers={'Range':'bytes=0-31'},stream=True,timeout=(10,25)) as r:
                if r.status_code in (403,404):return False
                if r.status_code not in (200,206):raise SyncError('Akses publik belum dapat diperiksa; katalog lama dipertahankan.')
                prefix=next(r.iter_content(chunk_size=1024),b'')
                return b'%PDF-' in prefix[:1024]
        except requests.RequestException: raise SyncError('Pemeriksaan akses publik gagal; katalog lama dipertahankan.') from None
    def thumbnail(self, url):
        host=(urlparse(url).hostname or '').lower()
        if not host.endswith('.googleusercontent.com') or urlparse(url).scheme!='https':raise SyncError('Thumbnail sumber tidak valid.')
        try:
            url=re.sub(r'=(?:s|w)\d+(?:-[a-z]+)?$', '=w600-rj', url)
            with self.public_session.get(url,stream=True,timeout=(10,25)) as r:
                if r.status_code!=200:raise SyncError('Thumbnail belum tersedia.')
                parts=[];total=0
                for part in r.iter_content(65536):
                    total+=len(part)
                    if total>8*1024*1024:raise SyncError('Thumbnail terlalu besar.')
                    parts.append(part)
                return b''.join(parts)
        except requests.RequestException:raise SyncError('Thumbnail belum tersedia.') from None
    def download(self, file_id, target, limit):
        total=0
        with self._get('https://www.googleapis.com/drive/v3/files/'+file_id,params={'alt':'media'},stream=True) as r:
            if int(r.headers.get('content-length','0') or 0)>limit:raise SyncError('PDF melebihi batas pemrosesan sampul.')
            with target.open('wb') as f:
                for part in r.iter_content(1024*1024):
                    total+=len(part)
                    if total>limit: raise SyncError('PDF melebihi batas pemrosesan sampul.')
                    f.write(part)
        with target.open('rb') as f:
            if b'%PDF-' not in f.read(1024):raise SyncError('Berkas unduhan bukan PDF yang dapat diproses.')
        return total


def make_cover(client,item,root,config,budget):
    thumb=item.get('thumbnailLink')
    if thumb:
        try:return (*clean_jpeg(client.thumbnail(thumb),config['coverWidth'],config['maxCoverBytes']),'drive-thumbnail')
        except Exception:pass
    size=int(item.get('size') or 0)
    if size>config['maxPdfBytes']:raise SyncError('PDF melebihi batas pemrosesan sampul otomatis.')
    if budget['bytes']+size>config['maxDownloadBytesPerRun']:raise Deferred('Menunggu jatah pemrosesan berikutnya.')
    with tempfile.TemporaryDirectory(prefix='hope-pdf-') as tmp:
        p=Path(tmp)/'source.pdf'
        try:
            client.download(item['id'],p,min(config['maxPdfBytes'],config['maxDownloadBytesPerRun']-budget['bytes']))
        finally:
            if p.exists():budget['bytes']+=p.stat().st_size
        jpeg,width,height=pdf_cover(p,config)
    return jpeg,width,height,'pdf-first-pages'

def current_cover_valid(root,cover):
    if not isinstance(cover,dict):return False
    rel=cover.get('path','')
    if not re.fullmatch(r'library-data/covers/[A-Za-z0-9_-]{15,100}-[a-f0-9]{16}\.jpg',rel):return False
    p=root/rel
    return p.is_file() and 0<p.stat().st_size<=1024*1024

def sync_catalog(client,root,config,now=None,force=False):
    now=now or utcnow();start=time.monotonic();target=root/'library-data/catalog.json'
    try:previous=json.loads(target.read_text(encoding='utf-8'))
    except (OSError,ValueError):previous={}
    old={b['id']:b for b in previous.get('books',[]) if isinstance(b,dict) and ID.fullmatch(str(b.get('id','')))}
    # All pages and public checks must succeed BEFORE deleting anything from the published list.
    items=client.list_files(config['folderId'])
    with ThreadPoolExecutor(max_workers=4) as pool:
        access=list(pool.map(lambda item:client.is_public(item['id']),items))
    public=[item for item,ok in zip(items,access) if ok]
    rows=[];jobs=0;budget={'bytes':0}
    for item in public:
        item=copy.deepcopy(item);fid=item['id'];rev=fingerprint(item);prior=old.get(fid,{})
        row={'id':fid,'name':item['name'],'mimeType':'application/pdf','sourceRevision':rev,'modifiedTime':item.get('modifiedTime'),'size':int(item.get('size') or 0)}
        same=prior.get('sourceRevision')==rev;old_cover=prior.get('cover')
        if current_cover_valid(root,old_cover):row['cover']=copy.deepcopy(old_cover)
        complete=same and prior.get('status')=='ready' and row.get('cover')
        if complete and not force:
            row.update({k:prior[k] for k in ('status','coverMethod','attempts') if k in prior});rows.append(row);continue
        attempts=int(prior.get('attempts',0)) if same else 0
        if same and not force and parse_time(prior.get('retryAt'))>now:
            row.update({k:prior[k] for k in ('status','attempts','retryAt','error') if k in prior});rows.append(row);continue
        if jobs>=config['maxJobsPerRun'] or time.monotonic()-start>config['maxRunSeconds']:
            row.update(status='pending',attempts=attempts);rows.append(row);continue
        jobs+=1
        try:
            jpeg,width,height,method=make_cover(client,item,root,config,budget)
            cover_hash=hashlib.sha256(jpeg).hexdigest()[:16]
            filename=fid+'-'+cover_hash+'.jpg';p=public_asset(root,filename);p.parent.mkdir(parents=True,exist_ok=True)
            if not p.exists() or p.read_bytes()!=jpeg:
                temp=p.with_suffix('.tmp');temp.write_bytes(jpeg);temp.replace(p)
            row.update(status='ready',coverMethod=method,attempts=0,cover={'path':p.relative_to(root).as_posix(),'width':width,'height':height,'type':'image/jpeg','bytes':len(jpeg)})
        except Deferred:
            row.update(status='pending',attempts=attempts)
        except SyncError as exc:
            attempts+=1
            row.update(status='failed',attempts=attempts,error=str(exc),retryAt=stamp(now+timedelta(minutes=min(1440,30*2**min(attempts-1,6)))))
        except Exception:
            attempts+=1;row.update(status='failed',attempts=attempts,error='Sampul belum dapat diproses; akan dicoba ulang.',retryAt=stamp(now+timedelta(hours=1)))
        rows.append(row)
    for row in rows:
        row['revision']=hashlib.sha256(json.dumps([row['sourceRevision'],row['name'],row['status'],row.get('cover',{}).get('path')],separators=(',',':')).encode()).hexdigest()[:16]
    payload={'schemaVersion':2,'folderId':config['folderId'],'source':'google-drive-api','sharePreview':True,'sync':{'status':'ok','cadenceMinutes':30},'books':rows}
    comparison=lambda p:{k:v for k,v in p.items() if k not in ('checkedAt','updatedAt')}
    changed=comparison(payload)!=comparison(previous) or parse_time(previous.get('checkedAt')).date()!=now.date()
    if changed:
        payload['checkedAt']=stamp(now);payload['updatedAt']=stamp(now)
        atomic_json(target,payload)
    else:payload=previous
    # Keep up to two revisions per book; remove covers for removed/private books immediately.
    active={b['id'] for b in rows};protected={b.get('cover',{}).get('path') for b in rows}
    groups={}
    for p in (root/'library-data/covers').glob('*.jpg'):
        m=re.fullmatch(r'([A-Za-z0-9_-]{15,100})-([a-f0-9]{16})\.jpg',p.name)
        if not m:continue
        if m[1] not in active:p.unlink();continue
        groups.setdefault(m[1],[]).append(p)
    for paths in groups.values():
        ordered=sorted(paths,key=lambda p:(p.relative_to(root).as_posix() in protected,p.stat().st_mtime),reverse=True)
        for p in ordered[2:]:p.unlink()
    summary={'skippedNotPublic':len(items)-len(public),'books':len(rows),'ready':sum(b['status']=='ready' for b in rows),'pending':sum(b['status']=='pending' for b in rows),'failed':sum(b['status']=='failed' for b in rows),'bytesDownloaded':budget['bytes'],'changed':changed}
    return payload,summary

def record_failure(root,message,now=None):
    target=root/'library-data/catalog.json'
    try:data=json.loads(target.read_text(encoding='utf-8'))
    except (OSError,ValueError):return
    # Public message is fixed, not provider exceptions or credential values.
    data['sync']={'status':'error','cadenceMinutes':30,'message':'Pembaruan terjadwal gagal. Koleksi terakhir tetap tersedia.','attemptedAt':stamp(now or utcnow())}
    atomic_json(target,data)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--force',action='store_true');args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]
    try:
        config=json.loads((root/'automation/library-config.json').read_text())
        if not ID.fullmatch(config['folderId']):raise SyncError('ID folder konfigurasi tidak valid.')
        client=DriveClient.from_env()
        _,summary=sync_catalog(client,root,config,force=args.force)
        print(json.dumps(summary,ensure_ascii=False))
        if os.environ.get('GITHUB_STEP_SUMMARY'):
            with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as f:f.write('## Sinkronisasi Perpustakaan HOPE\n\n'+str(summary['books'])+' buku; '+str(summary['ready'])+' siap; '+str(summary['pending'])+' antre; '+str(summary['failed'])+' perlu dicoba ulang.\n')
    except SyncError as exc:
        record_failure(root,str(exc));print('Sinkronisasi gagal: '+str(exc),file=sys.stderr);return 1
    except Exception:
        record_failure(root,'error');print('Sinkronisasi gagal. Periksa konfigurasi dan akses Google Drive.',file=sys.stderr);return 1
    return 0
if __name__=='__main__':sys.exit(main())
