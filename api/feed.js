const SUPA='https://nfeexstvdjgywonbtxtb.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWV4c3R2ZGpneXdvbmJ0eHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTEyNzgsImV4cCI6MjEwMDk2NzI3OH0.rStSOT85A0IIy1Qes6A92b5Jpe4CrBZyrpVNQDC3o1E';
const SITE='https://kliping-reichas.my.id';

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function cdata(s){return '<![CDATA['+String(s==null?'':s).replace(/\]\]>/g,']]&gt;')+']]>';}
function hariRFC(tgl){
  try{var d=new Date(String(tgl)+'T07:00:00+08:00');if(isNaN(d))return new Date().toUTCString();return d.toUTCString();}
  catch(e){return new Date().toUTCString();}
}
// Ambil apa adanya: tanpa filter kolom, tanpa order, tanpa select bernama.
// PostgREST membalas 400 kalau satu saja nama kolom tidak cocok huruf besar
// kecilnya, dan galat itu dulu tertelan diam-diam sehingga sitemap kosong.
async function ambilTabel(tabel){
  const url=SUPA+'/rest/v1/'+tabel+'?select=*&limit=300';
  const r=await fetch(url,{headers:{apikey:KEY,Authorization:'Bearer '+KEY,Accept:'application/json'}});
  const teks=await r.text();
  let data=null;
  try{data=JSON.parse(teks);}catch(e){}
  return {
    ok:r.ok&&Array.isArray(data),
    kode:r.status,
    baris:Array.isArray(data)?data:[],
    pesan:Array.isArray(data)?'':String(teks).slice(0,400)
  };
}
// Nama kolom dicari lentur supaya tahan kalau Postgres melipat huruf besar.
function ambilNilai(o,nama){
  if(!o)return undefined;
  if(o[nama]!==undefined)return o[nama];
  const cari=String(nama).toLowerCase().replace(/[^a-z0-9]/g,'');
  for(const k in o){
    if(String(k).toLowerCase().replace(/[^a-z0-9]/g,'')===cari)return o[k];
  }
  return undefined;
}
function tglKlip(k){return ambilNilai(k,'tglKliping')||ambilNilai(k,'tglBerita')||'';}
async function ambilKliping(){
  const h=await ambilTabel('kliping');
  return h.baris
    .filter(function(k){
      const s=String(ambilNilai(k,'status')||'').trim().toLowerCase();
      return s==='terbit' && ambilNilai(k,'id');
    })
    .sort(function(a,b){return String(tglKlip(b)).localeCompare(String(tglKlip(a)));})
    .slice(0,200);
}
async function ambilMateri(){
  const h=await ambilTabel('materi');
  return h.baris;
}
async function cek(res){
  const out=[];
  for(const t of ['kliping','materi']){
    let h;
    try{h=await ambilTabel(t);}catch(e){h={ok:false,kode:0,baris:[],pesan:String(e&&e.message||e)};}
    const satu=h.baris[0]||null;
    const status={};
    h.baris.forEach(function(r){
      const s=String(ambilNilai(r,'status')||'(kosong)');
      status[s]=(status[s]||0)+1;
    });
    out.push({
      tabel:t,
      httpKode:h.kode,
      berhasil:h.ok,
      jumlahBaris:h.baris.length,
      sebaranStatus:status,
      namaKolom:satu?Object.keys(satu):[],
      contohId:satu?ambilNilai(satu,'id'):null,
      contohTanggal:satu?tglKlip(satu):null,
      pesanGalat:h.pesan||null
    });
  }
  let n=0;
  try{n=(await ambilKliping()).length;}catch(e){}
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.status(200).send(JSON.stringify({klipingTerbitTerbaca:n,tabel:out},null,2));
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
       (tglKlip(k)?'<lastmod>'+esc(String(tglKlip(k)).slice(0,10))+'</lastmod>':'')+
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
    const tautan=SITE+'/klip/'+encodeURIComponent(ambilNilai(k,'id'));
    const isi=(ambilNilai(k,'lead')||'')+(ambilNilai(k,'media')?' \u2014 disarikan dari '+ambilNilai(k,'media')+'.':'');
    x+='<item>\n<title>'+cdata(ambilNilai(k,'judul'))+'</title>\n'+
       '<link>'+esc(tautan)+'</link>\n'+
       '<guid isPermaLink="true">'+esc(tautan)+'</guid>\n'+
       '<pubDate>'+hariRFC(String(tglKlip(k)).slice(0,10))+'</pubDate>'+'\n'+
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
    if (jenis === 'cek') return await cek(res);
    if (jenis === 'sitemap') return await sitemap(res);
    return await rss(res);
  } catch (e) {
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    res.status(500).send('Gagal menyusun umpan.');
  }
};
