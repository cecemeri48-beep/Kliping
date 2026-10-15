/* HOPE: static catalog + persisted covers; Drive API sync runs in GitHub Actions.
 * No scraping, service-account key, or PDF rendering in the visitor's request. */
'use strict';
const fs=require('fs'),path=require('path');
const FOLDER_ID='1FsGEVM_KRcCyu43tEDwQPn1CrNugDKdA',SITE='https://www.kliping-reichas.my.id';
const VALID_ID=/^[A-Za-z0-9_-]{15,100}$/,REV=/^[a-f0-9]{16}$/;
const htmlEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bookTitle=b=>b.name.replace(/\.pdf$/i,'').split(/\s*--\s*/)[0].trim()||'Buku';
function readAsset(relative){for(const base of [process.cwd(),path.join(__dirname,'..')]){const file=path.join(base,relative);if(fs.existsSync(file))return fs.readFileSync(file,'utf8')}throw Error('Aset perpustakaan belum dipasang.');}
function safeCover(b){const c=b.cover;if(!c||typeof c.path!=='string'||!c.path.startsWith('library-data/covers/'+b.id+'-')||!/^library-data\/covers\/[A-Za-z0-9_-]{15,100}-[a-f0-9]{16}\.jpg$/.test(c.path)||!Number.isInteger(c.width)||!Number.isInteger(c.height)||c.width<1||c.width>2000||c.height<1||c.height>2000)return null;return {...c,type:'image/jpeg',url:'/'+c.path};}
function loadCollection(){const data=JSON.parse(readAsset('library-data/catalog.json'));if(data.schemaVersion!==2||data.folderId!==FOLDER_ID||!Array.isArray(data.books))throw Error('Katalog belum valid.');const seen=new Set();const books=data.books.map(b=>{if(!b||typeof b.id!=='string'||!VALID_ID.test(b.id)||typeof b.name!=='string'||b.mimeType!=='application/pdf'||!REV.test(b.revision)||seen.has(b.id))throw Error('Baris katalog tidak valid.');seen.add(b.id);return {...b,cover:safeCover(b)}});return {...data,sharePreview:true,books};}
function bookHTML(book){const title=bookTitle(book),url=SITE+'/buku/'+book.id+'?v='+book.revision;const image=safeCover(book);const description='Baca '+title+' langsung di Perpustakaan HOPE. Bagikan dan tandai untuk diskusi.';
const imageTags=image?`<meta property="og:image" content="${htmlEsc(SITE+image.url)}"><meta property="og:image:secure_url" content="${htmlEsc(SITE+image.url)}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="${image.width}"><meta property="og:image:height" content="${image.height}"><meta property="og:image:alt" content="Sampul ${htmlEsc(title)}"><meta name="twitter:image" content="${htmlEsc(SITE+image.url)}">`:'';
const tags=`<meta property="og:title" content="${htmlEsc(title)} — Perpustakaan HOPE"><meta property="og:description" content="${htmlEsc(description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Perpustakaan HOPE"><meta property="og:url" content="${htmlEsc(url)}">${imageTags}<meta name="twitter:card" content="${image?'summary_large_image':'summary'}"><meta name="twitter:title" content="${htmlEsc(title)}"><link rel="canonical" href="${htmlEsc(url)}">`;
let html=readAsset('perpustakaan.html').replace(/<title>[\s\S]*?<\/title>/i,'<title>'+htmlEsc(title)+' — Perpustakaan HOPE</title>').replace(/<!-- HOPE_OG_START -->[\s\S]*?<!-- HOPE_OG_END -->/,tags);
return html.replace('</head>','<script>window.HOPE_SHARED_BOOK='+JSON.stringify({...book,cover:image}).replace(/</g,'\\u003c')+';</script></head>');}
const AUDIO_CHUNK=262144,AUDIO_MAX=80*1024*1024;
async function audioChunk(id,offset){
 const response=await fetch('https://drive.usercontent.google.com/download?id='+encodeURIComponent(id)+'&export=download',{headers:{Range:'bytes='+offset+'-'+(offset+AUDIO_CHUNK-1)},signal:AbortSignal.timeout(18000)});
 const match=(response.headers.get('content-range')||'').match(/^bytes (\d+)-(\d+)\/(\d+)$/);
 const type=(response.headers.get('content-type')||'').split(';')[0];
 const total=match?Number(match[3]):Number(response.headers.get('content-length'));
 if(!response.ok||!['application/pdf','application/octet-stream','application/binary'].includes(type)||!total||total>AUDIO_MAX){await response.body?.cancel();throw new Error('PDF audio tidak tersedia.');}
 if(response.status===206&&(!match||Number(match[1])!==offset||Number(match[2])-offset+1>AUDIO_CHUNK)){await response.body?.cancel();throw new Error('Potongan PDF tidak valid.');}
 if(response.status!==206&&!(response.status===200&&offset===0&&total<=AUDIO_CHUNK)){await response.body?.cancel();throw new Error('Penyedia tidak mendukung akses PDF bertahap.');}
 const reader=response.body.getReader(),parts=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>AUDIO_CHUNK)throw new Error('Potongan terlalu besar.');parts.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 const buffer=Buffer.concat(parts);if(!buffer.length||size!==Math.min(AUDIO_CHUNK,total-offset)||(offset===0&&!buffer.subarray(0,1024).includes(Buffer.from('%PDF-'))))throw new Error('Data PDF tidak valid.');
 return {buffer,total};
}

async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');
 if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');res.statusCode=405;res.end('Method not allowed');return}
 const params=new URL(req.url||'/','https://localhost').searchParams,q=req.query||{};
 const book=q.book||params.get('book'),cover=q.cover||params.get('cover'),audio=q.audio||params.get('audio'),id=book||cover||audio;
 if(id&&(typeof id!=='string'||!VALID_ID.test(id))){res.statusCode=400;res.setHeader('Cache-Control','no-store');res.end('ID buku tidak valid.');return}
 try{
  const data=loadCollection();
  if(id){const b=data.books.find(x=>x.id===id);if(!b){res.statusCode=404;res.setHeader('Cache-Control','no-store');res.end('Buku tidak ditemukan dalam koleksi.');return}
   if(audio&&!book&&!cover){const raw=q.offset??params.get('offset')??'0';if(typeof raw!=='string'||!/^\d{1,9}$/.test(raw)||Number(raw)>=AUDIO_MAX){res.statusCode=400;res.end('Offset tidak valid.');return}const offset=Number(raw),chunk=await audioChunk(id,offset);res.setHeader('Content-Type','application/pdf');res.setHeader('Cache-Control','no-store');res.setHeader('X-HOPE-Total',chunk.total);res.setHeader('X-HOPE-Offset',offset);res.setHeader('Content-Length',chunk.buffer.length);res.statusCode=200;res.end(req.method==='HEAD'?undefined:chunk.buffer);return}
   if(cover&&!book){const image=safeCover(b);res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');if(!image){res.statusCode=404;res.end('Sampul sedang disiapkan.');return}res.statusCode=307;res.setHeader('Location',image.url);res.end();return}
   res.setHeader('X-HOPE-Book',b.id);res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');res.statusCode=200;res.end(req.method==='HEAD'?'':bookHTML(b));return;
  }
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');res.statusCode=200;res.end(req.method==='HEAD'?'':JSON.stringify(data));
 }catch(e){res.statusCode=503;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',id?'text/plain; charset=utf-8':'application/json; charset=utf-8');res.end(id?'Katalog sementara belum tersedia. Silakan coba lagi.':JSON.stringify({error:'Katalog belum dipasang atau belum valid. Koleksi tersimpan tetap dapat digunakan.'}));}
}
module.exports=handler;module.exports.loadCollection=loadCollection;module.exports.safeCover=safeCover;module.exports.bookHTML=bookHTML;module.exports.audioChunk=audioChunk;
