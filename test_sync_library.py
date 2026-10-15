import base64,copy,io,json,sys,tempfile,unittest
from datetime import datetime,timezone,timedelta
from pathlib import Path
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from sync_library import SyncError,DriveClient,sync_catalog,record_failure,clean_jpeg,pdf_cover
FOLDER='1FsGEVM_KRcCyu43tEDwQPn1CrNugDKdA';NOW=datetime(2026,10,15,12,tzinfo=timezone.utc)
CONFIG={'folderId':FOLDER,'maxPdfBytes':120*1024*1024,'maxJobsPerRun':8,'maxDownloadBytesPerRun':300*1024*1024,'maxRunSeconds':840,'coverWidth':600,'maxCoverBytes':250000}
def pdf_bytes():
    stream=b'0.2 0.6 0.4 rg 20 100 360 300 re f\nBT /F1 28 Tf 30 500 Td (Perpustakaan HOPE) Tj ET'
    objects=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 600] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',b'<< /Length '+str(len(stream)).encode()+b' >>\nstream\n'+stream+b'\nendstream',b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
    data=b'%PDF-1.4\n';offsets=[0]
    for i,obj in enumerate(objects,1):offsets.append(len(data));data+=str(i).encode()+b' 0 obj\n'+obj+b'\nendobj\n'
    pos=len(data);data+=b'xref\n0 6\n0000000000 65535 f \n'+b''.join(('%010d 00000 n \n'%o).encode() for o in offsets[1:]);data+=b'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+str(pos).encode()+b'\n%%EOF\n';return data

def row(index=1,thumb=False):
    obj={'id':'TEST_BOOK_'+str(index).zfill(12),'name':'Buku '+str(index)+'.pdf','mimeType':'application/pdf','parents':[FOLDER],'size':len(pdf_bytes()),'modifiedTime':'2026-10-15T08:00:00Z','md5Checksum':'checksum'+str(index)}
    if thumb:obj['thumbnailLink']='https://lh3.googleusercontent.com/example'
    return obj
class Fake:
    def __init__(self,rows):self.rows=rows;self.downloads=0;self.corrupt=False;self.private=set();self.list_error=False;self.color='teal'
    def list_files(self,folder):
        if self.list_error:raise SyncError('Daftar tidak lengkap.')
        return copy.deepcopy(self.rows)
    def is_public(self,fid):return fid not in self.private
    def thumbnail(self,url):
        im=Image.new('RGB',(600,850),self.color);b=io.BytesIO();im.save(b,'JPEG');return b.getvalue()
    def download(self,fid,target,limit):
        self.downloads+=1;data=b'bad file' if self.corrupt else pdf_bytes();target.write_bytes(data);return len(data)
class Response:
    def __init__(self,data):self.data=data
    def json(self):return self.data
    def __enter__(self):return self
    def __exit__(self,*a):pass

class SyncTests(unittest.TestCase):
    def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
    def tearDown(self):self.tmp.cleanup()
    def test_render_real_pdf_and_no_persistent_pdf(self):
        c=Fake([row()]);data,summary=sync_catalog(c,self.root,CONFIG,now=NOW)
        b=data['books'][0];self.assertEqual(b['status'],'ready');self.assertEqual(b['coverMethod'],'pdf-first-pages');self.assertEqual(b['cover']['width'],600);self.assertLess(b['cover']['bytes'],250000);self.assertEqual(list(self.root.rglob('*.pdf')),[]);self.assertEqual(summary['ready'],1)
    def test_thumbnail_first_no_pdf_download(self):
        c=Fake([row(thumb=True)]);data,_=sync_catalog(c,self.root,CONFIG,now=NOW);self.assertEqual(c.downloads,0);self.assertEqual(data['books'][0]['coverMethod'],'drive-thumbnail')
    def test_unchanged_does_not_reprocess_or_publish(self):
        c=Fake([row()]);first,_=sync_catalog(c,self.root,CONFIG,now=NOW);raw=(self.root/'library-data/catalog.json').read_bytes();_,s=sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(minutes=30));self.assertFalse(s['changed']);self.assertEqual(c.downloads,1);self.assertEqual(raw,(self.root/'library-data/catalog.json').read_bytes())
    def test_daily_heartbeat(self):
        c=Fake([row()]);sync_catalog(c,self.root,CONFIG,now=NOW);_,s=sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(days=1));self.assertTrue(s['changed']);self.assertEqual(c.downloads,1)
    def test_changed_book_new_version_and_old_cover_kept_on_failure(self):
        c=Fake([row()]);first,_=sync_catalog(c,self.root,CONFIG,now=NOW);old=first['books'][0]['cover'];c.rows[0]['md5Checksum']='changed';c.corrupt=True
        failed,_=sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(minutes=30));b=failed['books'][0];self.assertEqual(b['status'],'failed');self.assertEqual(b['cover'],old);self.assertNotEqual(b['revision'],first['books'][0]['revision']);self.assertIn('retryAt',b)
        c.corrupt=False;ready,_=sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(hours=2));self.assertEqual(ready['books'][0]['status'],'ready');self.assertEqual(ready['books'][0]['cover']['path'],old['path']);self.assertNotEqual(ready['books'][0]['revision'],first['books'][0]['revision'])
    def test_force_new_cover_bytes_get_new_url(self):
        c=Fake([row(thumb=True)]);first,_=sync_catalog(c,self.root,CONFIG,now=NOW);c.color='orange';second,_=sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(minutes=5),force=True)
        self.assertNotEqual(first['books'][0]['cover']['path'],second['books'][0]['cover']['path']);self.assertNotEqual(first['books'][0]['revision'],second['books'][0]['revision']);self.assertTrue((self.root/first['books'][0]['cover']['path']).exists())
    def test_title_change_changes_share_version_without_pdf_download(self):
        c=Fake([row(thumb=True)]);first,_=sync_catalog(c,self.root,CONFIG,now=NOW);c.rows[0]['name']='Judul baru.pdf';second,_=sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(minutes=5));self.assertNotEqual(first['books'][0]['revision'],second['books'][0]['revision']);self.assertEqual(first['books'][0]['cover'],second['books'][0]['cover']);self.assertEqual(c.downloads,0)
    def test_failure_backoff(self):
        c=Fake([row()]);c.corrupt=True;sync_catalog(c,self.root,CONFIG,now=NOW);sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(minutes=10));self.assertEqual(c.downloads,1);sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(minutes=31));self.assertEqual(c.downloads,2)
    def test_queue_respects_job_limit_and_resumes(self):
        c=Fake([row(i) for i in range(12)]);data,s=sync_catalog(c,self.root,CONFIG,now=NOW);self.assertEqual(s['ready'],8);self.assertEqual(s['pending'],4);data,s=sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(minutes=30));self.assertEqual(s['ready'],12);self.assertEqual(c.downloads,12)
    def test_private_or_removed_files_not_published(self):
        c=Fake([row(1),row(2)]);first,_=sync_catalog(c,self.root,CONFIG,now=NOW);c.private.add(row(1)['id']);second,_=sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(minutes=30));self.assertEqual([b['id'] for b in second['books']],[row(2)['id']]);self.assertFalse(any(row(1)['id'] in p.name for p in (self.root/'library-data/covers').glob('*.jpg')))
    def test_listing_error_preserves_every_row_and_asset(self):
        c=Fake([row()]);first,_=sync_catalog(c,self.root,CONFIG,now=NOW);raw=(self.root/'library-data/catalog.json').read_bytes();c.list_error=True
        with self.assertRaises(SyncError):sync_catalog(c,self.root,CONFIG,now=NOW+timedelta(hours=1))
        self.assertEqual(raw,(self.root/'library-data/catalog.json').read_bytes());record_failure(self.root,'DO NOT PUBLISH THIS SECRET',NOW);text=(self.root/'library-data/catalog.json').read_text();self.assertNotIn('DO NOT PUBLISH',text);self.assertEqual(json.loads(text)['books'],first['books'])
    def test_oversize_does_not_download(self):
        r=row();r['size']=130*1024*1024;c=Fake([r]);d,s=sync_catalog(c,self.root,CONFIG,now=NOW);self.assertEqual(c.downloads,0);self.assertEqual(d['books'][0]['status'],'failed')
    def test_official_api_pagination_more_than_fifty(self):
        c=DriveClient(object());calls=[];rows=[row(i) for i in range(125)]
        def get(url,params=None,stream=False):
            calls.append((url,params))
            if url.endswith('/'+FOLDER):return Response({'id':FOLDER,'mimeType':'application/vnd.google-apps.folder'})
            return Response({'files':rows[:70],'nextPageToken':'NEXT'}) if not params.get('pageToken') else Response({'files':rows[70:]})
        c._get=get;result=c.list_files(FOLDER);self.assertEqual(len(result),125);self.assertEqual(calls[-1][1]['pageToken'],'NEXT');self.assertEqual(calls[-1][1]['pageSize'],1000)
    def test_incomplete_search_is_not_treated_as_empty(self):
        c=DriveClient(object());c._get=lambda url,params=None,stream=False:Response({'id':FOLDER,'mimeType':'application/vnd.google-apps.folder'} if url.endswith('/'+FOLDER) else {'files':[],'incompleteSearch':True})
        with self.assertRaises(SyncError):c.list_files(FOLDER)
if __name__=='__main__':unittest.main()
