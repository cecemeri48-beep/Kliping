const SUPA='https://nfeexstvdjgywonbtxtb.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWV4c3R2ZGpneXdvbmJ0eHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTEyNzgsImV4cCI6MjEwMDk2NzI3OH0.rStSOT85A0IIy1Qes6A92b5Jpe4CrBZyrpVNQDC3o1E';
const SITE='https://kliping-reichas.my.id';

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function cdata(s){return '<![CDATA['+String(s==null?'':s).replace(/\]\]>/g,']]&gt;')+']]>';}
function hariRFC(tgl){
  try{var d=new Date(String(tgl)+'T07:00:00+08:00');if(isNaN(d))return new Date().toUTCString();return d.toUTCString();}
  catch(e){return new Date().toUTCString();}
}
async function ambilKliping(){
  const url=SUPA+'/rest/v1/kliping?status=eq.Terbit&select=id,judul,lead,rubrik,media,gambar,tglKliping,tglBerita,topik,wilayah&order=tglKliping.desc&limit=200';
  const r=await fetch(url,{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});
  const rows=await r.json();
  return Array.isArray(rows)?rows:[];
}
async function ambilMateri(){
  const r=await fetch(SUPA+'/rest/v1/materi?select=id,judul,rumpun&limit=200',{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});
  const rows=await r.json();
  return Array.isArray(rows)?rows:[];
}

async function sitemap(res){
  let kl=[],mt=[];
  try{kl=await ambilKliping();}catch(e){}
  try{mt=await ambilMateri();}catch(e){}
  // Hanya URL sungguhan. Google mengabaikan bagian setelah tanda #, jadi
  // alamat seperti /#materi dibaca sebagai duplikat beranda dan memicu
  // peringatan "duplicate, submitted URL not selected as canonical".
  const tetap=[['/',1.0,'daily']];
  const now=new Date().toISOString().slice(0,10);
  let x='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  tetap.forEach(function(t){
    x+='<url><loc>'+esc(SITE+t[0])+'</loc><lastmod>'+now+'</lastmod><changefreq>'+t[2]+'</changefreq><priority>'+t[1].toFixed(1)+'</priority></url>\n';
  });
  kl.forEach(function(k){
    x+='<url><loc>'+esc(SITE+'/klip/'+encodeURIComponent(k.id))+'</loc>'+
       (k.tglKliping?'<lastmod>'+esc(k.tglKliping)+'</lastmod>':'')+
       '<changefreq>monthly</changefreq><priority>0.8</priority></url>\n';
  });
  x+='</urlset>\n';
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=1800, s-maxage=3600');
  res.status(200).send(x);
}

async function rss(res){
  let kl=[];
  try{kl=await ambilKliping();}catch(e){}
  kl=kl.slice(0,50);
  const now=new Date().toUTCString();
  let x='<?xml version="1.0" encoding="UTF-8"?>\n'+
   '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n<channel>\n'+
   '<title>Kliping REICHAS</title>\n'+
   '<link>'+esc(SITE)+'</link>\n'+
   '<description>Menggunting berita, menanam pengetahuan. Kliping dan telaah kegiatan alam bebas dari REICHAS CHELEBES, Makassar.</description>\n'+
   '<language>id-ID</language>\n'+
   '<lastBuildDate>'+now+'</lastBuildDate>\n'+
   '<generator>Kliping REICHAS</generator>\n'+
   '<image><url>'+esc(SITE+'/icon-512.png')+'</url><title>Kliping REICHAS</title><link>'+esc(SITE)+'</link></image>\n'+
   '<atom:link href="'+esc(SITE+'/rss.xml')+'" rel="self" type="application/rss+xml" />\n';
  kl.forEach(function(k){
    const tautan=SITE+'/klip/'+encodeURIComponent(k.id);
    const isi=(k.lead||'')+(k.media?' \u2014 disarikan dari '+k.media+'.':'');
    x+='<item>\n<title>'+cdata(k.judul)+'</title>\n'+
       '<link>'+esc(tautan)+'</link>\n'+
       '<guid isPermaLink="true">'+esc(tautan)+'</guid>\n'+
       '<pubDate>'+hariRFC(k.tglKliping||k.tglBerita)+'</pubDate>\n'+
       (k.rubrik?'<category>'+cdata(k.rubrik)+'</category>\n':'')+
       (Array.isArray(k.topik)?k.topik.map(function(t){return '<category>'+cdata(t)+'</category>\n';}).join(''):'')+
       '<description>'+cdata(isi)+'</description>\n'+
       (k.gambar&&/^https?:\/\//.test(k.gambar)?'<enclosure url="'+esc(k.gambar)+'" type="image/jpeg" />\n':'')+
       '</item>\n';
  });
  x+='</channel>\n</rss>\n';
  res.setHeader('Content-Type','application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=900, s-maxage=1800');
  res.status(200).send(x);
}

module.exports = async function (req, res) {
  const jenis = (req.query && req.query.jenis) || 'rss';
  try {
    if (jenis === 'sitemap') return await sitemap(res);
    return await rss(res);
  } catch (e) {
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    res.status(500).send('Gagal menyusun umpan.');
  }
};
