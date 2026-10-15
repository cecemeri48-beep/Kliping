/* Read-only public Drive metadata. No permanent PDF storage, credentials or eval. Audio uses bounded PDF byte ranges. */
const FOLDER_ID='1FsGEVM_KRcCyu43tEDwQPn1CrNugDKdA';
const FOLDER_URL='https://drive.google.com/drive/folders/'+FOLDER_ID;
const VALID_ID=/^[A-Za-z0-9_-]{15,100}$/;
function decodeLiteral(s){return s.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|[\s\S])/g,(_,v)=>{if(v[0]==='x'||v[0]==='u')return String.fromCharCode(parseInt(v.slice(1),16));return ({n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v'})[v]??v})}
function parseFolder(html){
 const m=html.match(/window\['_DRIVE_ivd'\]\s*=\s*'((?:\\[\s\S]|[^'\\])*)'/);
 if(!m)throw new Error('Format daftar Drive tidak terbaca atau folder tidak publik.');
 let payload;try{payload=JSON.parse(decodeLiteral(m[1]))}catch(e){throw new Error('Format metadata Drive berubah.')}
 if(!Array.isArray(payload)||!Array.isArray(payload[0]))throw new Error('Daftar file Drive tidak valid.');
 // Public folder HTML is not an official API. Never silently claim a paged result is complete.
 if(payload[1]||payload[2]||payload[0].length>=50)throw new Error('Folder terlalu besar untuk daftar publik satu halaman. Gunakan integrasi Drive resmi untuk seluruh koleksi.');
 const books=[],seen=new Set();
 for(const row of payload[0]){
  if(!Array.isArray(row)||typeof row[0]!=='string'||!VALID_ID.test(row[0])||typeof row[2]!=='string')continue;
  if(row[3]!=='application/pdf'||!Array.isArray(row[1])||!row[1].includes(FOLDER_ID)||seen.has(row[0]))continue;
  seen.add(row[0]);books.push({id:row[0],name:row[2],mimeType:'application/pdf'});
 }
 books.sort((a,b)=>a.name.localeCompare(b.name,'id'));
 return books;
}
const fs=require('fs'),path=require('path');
const SITE='https://www.kliping-reichas.my.id';
let collectionCache=null,collectionPending=null;const coverCache=new Map();
const htmlEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bookTitle=b=>b.name.replace(/\.pdf$/i,'').split(/\s*--\s*/)[0].trim()||'Buku';
async function loadCollection(){
 if(collectionCache&&Date.now()-collectionCache.time<60000)return collectionCache.data;
 if(collectionPending)return collectionPending;
 collectionPending=(async()=>{const r=await fetch(FOLDER_URL,{headers:{'User-Agent':'Mozilla/5.0 (compatible; HopePublicLibrary/1.0)','Accept-Language':'id,en;q=0.8'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('Folder belum dapat dibaca.');const text=await r.text();if(text.length>8*1024*1024)throw new Error('Daftar terlalu besar.');const data={folderId:FOLDER_ID,folderUrl:FOLDER_URL,books:parseFolder(text),sharePreview:true,checkedAt:new Date().toISOString()};collectionCache={time:Date.now(),data};return data})();
 try{return await collectionPending}finally{collectionPending=null}
}
function shellHTML(){for(const p of [path.join(process.cwd(),'perpustakaan.html'),path.join(__dirname,'..','perpustakaan.html')]){if(fs.existsSync(p))return fs.readFileSync(p,'utf8')}throw new Error('Halaman perpustakaan belum dibundel.');}
function bookHTML(book,image=null){const title=bookTitle(book),url=SITE+'/buku/'+book.id+'?v=hope118',img=SITE+'/sampul/'+book.id+'?v=hope118',description='Baca '+title+' langsung di Perpustakaan HOPE. Temukan bahan obrolan, bagikan, dan tandai untuk diskusi.';let html=shellHTML();const tags=`<meta property="og:title" content="${htmlEsc(title)} — Perpustakaan HOPE"><meta property="og:description" content="${htmlEsc(description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Perpustakaan HOPE"><meta property="og:url" content="${htmlEsc(url)}"><meta property="og:image" content="${htmlEsc(img)}"><meta property="og:image:secure_url" content="${htmlEsc(img)}"><meta property="og:image:type" content="image/jpeg">${image?.width&&image?.height?`<meta property="og:image:width" content="${image.width}"><meta property="og:image:height" content="${image.height}">`:``}<meta property="og:image:alt" content="Sampul ${htmlEsc(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${htmlEsc(title)}"><meta name="twitter:image" content="${htmlEsc(img)}"><link rel="canonical" href="${htmlEsc(url)}">`;
 html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+htmlEsc(title)+' — Perpustakaan HOPE</title>').replace(/<!-- HOPE_OG_START -->[\s\S]*?<!-- HOPE_OG_END -->/,tags);
 html=html.replace('</head>','<script>window.HOPE_SHARED_BOOK='+JSON.stringify(book).replace(/</g,'\\u003c')+';</script></head>');
 return html;
}
function jpegDimensions(b){
 if(b.length<4||b[0]!==0xff||b[1]!==0xd8)throw Error('Sampul bukan JPEG.');
 let p=2;
 while(p+4<=b.length){if(b[p++]!==0xff)continue;while(p<b.length&&b[p]===0xff)p++;const marker=b[p++];if(marker===0xd9||marker===0xda)break;if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;if(p+2>b.length)break;const len=b.readUInt16BE(p);if(len<2||p+len>b.length)break;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&len>=7){const height=b.readUInt16BE(p+3),width=b.readUInt16BE(p+5);if(width&&height)return {width,height};break}p+=len}
 throw Error('Dimensi JPEG belum tersedia.');
}
async function fetchCoverJPEG(id,size){
 const r=await fetch('https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w'+size+'-rj',{signal:AbortSignal.timeout(10000)});
 if(!r.ok||(r.headers.get('content-type')||'').split(';')[0]!=='image/jpeg'){await r.body?.cancel();throw Error('Sampul JPEG belum tersedia.');}
 const reader=r.body.getReader(),parts=[];let length=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>2*1024*1024)throw Error('Sampul terlalu besar.');parts.push(Buffer.from(value))}}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
 const buffer=Buffer.concat(parts);return {time:Date.now(),type:'image/jpeg',buffer,...jpegDimensions(buffer)};
}
async function bookCover(id){const cached=coverCache.get(id);if(cached&&Date.now()-cached.time<3600000)return cached;
 let image=await fetchCoverJPEG(id,600);if(image.buffer.length>250000)image=await fetchCoverJPEG(id,360);
 if(coverCache.size>=12)coverCache.delete(coverCache.keys().next().value);coverCache.set(id,image);return image;
}
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
 if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');res.statusCode=405;res.end('Method not allowed');return}
 const params=new URL(req.url||'/','https://localhost').searchParams,q=req.query||{};const book=q.book||params.get('book'),cover=q.cover||params.get('cover'),audio=q.audio||params.get('audio');
 const isPage=!!book,id=book||cover||audio;
 if(id&&(typeof id!=='string'||!VALID_ID.test(id))){res.statusCode=400;res.setHeader('Cache-Control','no-store');res.end('ID buku tidak valid.');return}
 try{const data=await loadCollection();
  if(id){const b=data.books.find(x=>x.id===id);if(!b){res.statusCode=404;res.setHeader('Cache-Control','no-store');res.end('Buku tidak ditemukan dalam koleksi.');return}
   if(audio&&!book&&!cover){const raw=q.offset??params.get('offset')??'0';if(typeof raw!=='string'||!/^\d{1,9}$/.test(raw)||Number(raw)>=AUDIO_MAX){res.statusCode=400;res.end('Offset tidak valid.');return}const offset=Number(raw),chunk=await audioChunk(id,offset);res.setHeader('Content-Type','application/pdf');res.setHeader('Cache-Control','no-store');res.setHeader('X-HOPE-Total',chunk.total);res.setHeader('X-HOPE-Offset',offset);res.setHeader('Content-Length',chunk.buffer.length);res.statusCode=200;res.end(req.method==='HEAD'?undefined:chunk.buffer);return}
   if(cover&&!book){const image=await bookCover(id);res.setHeader('Content-Type',image.type);res.setHeader('Cache-Control','public, max-age=3600, s-maxage=3600');res.setHeader('Content-Length',image.buffer.length);res.statusCode=200;res.end(req.method==='HEAD'?undefined:image.buffer);return}
   const image=await bookCover(id).catch(()=>null);const body=bookHTML(b,image);res.setHeader('X-HOPE-Book',b.id);res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');res.statusCode=200;res.end(req.method==='HEAD'?'':body);return;
  }
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');res.statusCode=200;res.end(req.method==='HEAD'?'':JSON.stringify(data));
 }catch(e){res.statusCode=502;res.setHeader('Cache-Control','no-store');if(isPage||cover||audio){res.setHeader('Content-Type','text/plain; charset=utf-8');res.end('Buku sementara belum dapat dimuat. Silakan coba lagi.')}else{res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({error:'Koleksi sementara belum dapat diperbarui.'}))}}
}
module.exports=handler;module.exports.jpegDimensions=jpegDimensions;module.exports.bookCover=bookCover;module.exports.audioChunk=audioChunk;module.exports.parseFolder=parseFolder;module.exports.bookHTML=bookHTML;
