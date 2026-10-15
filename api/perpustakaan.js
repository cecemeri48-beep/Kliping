/* Read-only public Drive metadata. No PDF copying, credentials or eval. */
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
async function handler(req,res){
 if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');res.statusCode=405;res.end(JSON.stringify({error:'Metode tidak didukung.'}));return}
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const response=await fetch(FOLDER_URL,{headers:{'User-Agent':'Mozilla/5.0 (compatible; KlipingPublicLibrary/1.0)','Accept-Language':'id,en;q=0.8'},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('Drive membalas '+response.status+'.');
  const html=await response.text();if(html.length>8*1024*1024)throw new Error('Daftar Drive terlalu besar.');
  const books=parseFolder(html);
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');
  res.statusCode=200;res.end(req.method==='HEAD'?'':JSON.stringify({folderId:FOLDER_ID,folderUrl:FOLDER_URL,books,checkedAt:new Date().toISOString(),source:'public-folder',scope:'PDF langsung di folder; tidak menelusuri subfolder'}));
 }catch(e){res.setHeader('Cache-Control','no-store');res.statusCode=502;res.end(JSON.stringify({error:'Daftar Drive belum dapat dimuat. '+(e.message||'Coba lagi.'),folderUrl:FOLDER_URL}))}
}
module.exports=handler;
module.exports.parseFolder=parseFolder;
