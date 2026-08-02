const SUPA='https://nfeexstvdjgywonbtxtb.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWV4c3R2ZGpneXdvbmJ0eHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTEyNzgsImV4cCI6MjEwMDk2NzI3OH0.rStSOT85A0IIy1Qes6A92b5Jpe4CrBZyrpVNQDC3o1E';
const SITE='https://kliping-reichas.my.id';
const SUREL_REDAKSI='kliping.rcscbs@gmail.com';

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function arr(x){
  if(typeof x==='string'){
    var t=x.trim();
    if(t.charAt(0)==='['){try{x=JSON.parse(t);}catch(e){x=t.split(/\n|\|/);}}
    else x=t?t.split(/\n|\|/):[];
  }
  return Array.isArray(x)?x.filter(function(v){return v&&String(v).trim();}).map(function(v){return String(v).trim();}):[];
}
// Kolom di Supabase memakai snake_case (tgl_kliping, keterangan_gambar),
// sedangkan aplikasi memakai camelCase. Samakan dulu supaya tanggal dan
// keterangan gambar tidak hilang diam-diam dari halaman kliping.
function keCamel(s){return String(s).replace(/_([a-z0-9])/g,function(m,c){return c.toUpperCase();});}
function rapikan(row){
  var o={};
  for(var k in row){
    o[k]=row[k];
    var c=keCamel(k);
    if(o[c]===undefined)o[c]=row[k];
  }
  if(o.gbrKet===undefined&&o.keteranganGambar!==undefined)o.gbrKet=o.keteranganGambar;
  if(o.gbrKet===undefined&&o.gambarKet!==undefined)o.gbrKet=o.gambarKet;
  return o;
}
function tglID(s){
  if(!s)return '';
  var B=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  var p=String(s).slice(0,10).split('-');
  if(p.length!==3)return String(s);
  return parseInt(p[2],10)+' '+B[parseInt(p[1],10)-1]+' '+p[0];
}
function potong(s,n){s=String(s==null?'':s).replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1)+'\u2026':s;}

const GAYA='*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#2C2C2B;background:#fff;line-height:1.65}'+
'.w{max-width:720px;margin:0 auto;padding:28px 22px 60px}'+
'header.t{border-bottom:1px solid #E6E5E3;background:#F9F8F7}header.t .w{padding:16px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px}'+
'header.t .bm{display:flex;align-items:center;gap:10px;text-decoration:none;color:#2C2C2B}header.t .bm img{width:auto;height:46px;flex:none;background:none;object-fit:contain}header.t .bm b{display:block;font-size:15px;font-weight:800;letter-spacing:.05em;line-height:1.2}header.t .bm i{display:block;font-size:12px;color:#7D7A75;font-style:italic;font-family:Georgia,serif}'+
'a{color:#2783DE}h1{font-size:29px;line-height:1.3;margin:14px 0 10px}h2{font-size:19px;margin:32px 0 10px}'+
'.lead{font-size:18px;color:#4a4845;margin:0 0 20px}'+
'.meta{font-size:13.5px;color:#7D7A75;border-bottom:1px solid #E6E5E3;padding-bottom:16px;margin-bottom:22px}'+
'.tag{display:inline-block;font-size:12px;font-weight:700;background:#F0EFED;border-radius:999px;padding:4px 11px;margin:0 6px 6px 0;color:#5c5955}'+
'blockquote{margin:0;background:#F9F8F7;border-left:3px solid #D5803B;border-radius:0 12px 12px 0;padding:16px 18px;font-size:15.5px;color:#3d3b39}'+
'blockquote cite{display:block;margin-top:10px;font-size:13px;color:#7D7A75;font-style:normal}'+
'ul{padding-left:20px}li{margin-bottom:9px}'+
'.img{width:100%;border-radius:14px;margin:0 0 8px}.cap{font-size:12.5px;color:#7D7A75;margin:0 0 22px}'+
'.cta{display:inline-block;background:#7357ff;color:#fff;text-decoration:none;font-weight:700;border-radius:12px;padding:12px 20px;margin-top:8px}'+
'.box{border:1px solid #E6E5E3;border-radius:14px;padding:16px 18px;margin-top:26px;font-size:14px;background:#F9F8F7}'+
'footer{border-top:1px solid #E6E5E3;margin-top:40px;padding-top:20px;font-size:13px;color:#7D7A75}'+
'footer a{margin-right:14px;color:#7D7A75}'+
'@media(max-width:560px){h1{font-size:24px}.lead{font-size:16.5px}.w{padding:22px 18px 48px}}';

function halamanKosong(res,id){
  const go=SITE+'/#klip='+encodeURIComponent(id||'');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=60, s-maxage=120');
  res.status(404).send('<!doctype html><html lang="id"><head><meta charset="utf-8" />'+
   '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />'+
   '<title>Kliping tidak ditemukan \u2014 Kliping RCS.CBS</title>'+
   '<meta name="robots" content="noindex" /><style>'+GAYA+'</style></head><body><div class="w">'+
   '<h1>Kliping ini tidak ditemukan</h1>'+
   '<p class="lead">Mungkin sudah dicabut, masih dalam peninjauan, atau tautannya keliru.</p>'+
   '<p><a class="cta" href="'+esc(SITE)+'">Buka Kliping RCS.CBS</a></p>'+
   '<p style="margin-top:18px"><a href="'+esc(go)+'">Coba buka lewat aplikasi</a></p>'+
   '</div></body></html>');
}

module.exports = async function (req, res) {
  const id = (req.query && req.query.id) || '';
  let k=null, kurator='', peninjau='';
  try {
    if (id) {
      const r = await fetch(SUPA+'/rest/v1/kliping?id=eq.'+encodeURIComponent(id)+'&select=*',{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});
      const rows = await r.json();
      if (Array.isArray(rows) && rows.length && String(rows[0].status||'').trim().toLowerCase() === 'terbit') k = rapikan(rows[0]);
    }
  } catch (e) {}
  if (!k) return halamanKosong(res,id);

  // Nama kurator dibaca lewat tampilan publik kurator_publik yang hanya
  // memuat id dan nama. Tabel profiles dipakai sebagai cadangan, dan
  // keduanya boleh gagal tanpa merusak halaman.
  const ids=[k.kurator,k.peninjau].filter(Boolean).map(function(x){return '"'+x+'"';}).join(',');
  if(ids){
    for(const tabel of ['kurator_publik','profiles']){
      if(kurator)break;
      try{
        const r2=await fetch(SUPA+'/rest/v1/'+tabel+'?id=in.('+encodeURIComponent(ids)+')&select=id,nama',{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});
        const p=await r2.json();
        if(Array.isArray(p)){
          p.forEach(function(u){
            if(String(u.id)===String(k.kurator))kurator=u.nama;
            if(String(u.id)===String(k.peninjau))peninjau=u.nama;
          });
        }
      }catch(e){}
    }
  }

  const kanonik = SITE+'/klip/'+encodeURIComponent(k.id);
  const buka = SITE+'/#klip='+encodeURIComponent(k.id);
  const desc = potong(k.lead||k.konteks||'',180);
  const clipImg = (k.gambar && /^https?:\/\//.test(k.gambar)) ? k.gambar : null;
  const img = clipImg || (SITE+'/og-image.jpg?v=3');
  const pelajaran = arr(k.pelajaran);
  const topik = arr(k.topik);
  const lokasi = arr(k.lokasi);

  const ld = {
    '@context':'https://schema.org',
    '@type':'Article',
    headline: potong(k.judul,110),
    description: desc,
    inLanguage:'id-ID',
    datePublished: k.tglKliping || undefined,
    dateModified: k.tglKliping || undefined,
    mainEntityOfPage:{'@type':'WebPage','@id':kanonik},
    author: kurator?{'@type':'Person',name:kurator}:{'@type':'Organization',name:'REICHAS CHELEBES'},
    publisher:{'@type':'Organization',name:'Kliping RCS.CBS',logo:{'@type':'ImageObject',url:SITE+'/icon-512.png'}},
    articleSection: k.rubrik || undefined,
    keywords: topik.length?topik.join(', '):undefined,
    isBasedOn: k.tautan || undefined,
    image: img
  };

  const badan =
   '<div class="meta">'+
     (k.rubrik?'<span class="tag">'+esc(k.rubrik)+'</span>':'')+
     topik.map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join('')+
     '<div style="margin-top:8px">Digunting '+esc(tglID(k.tglKliping))+
     ' oleh '+esc(kurator||'Redaksi Kliping RCS.CBS')+
     (peninjau?' \u00b7 ditinjau '+esc(peninjau):'')+
     (lokasi.length?' \u00b7 '+esc(lokasi.join(', ')):'')+
     (k.wilayah?' \u00b7 '+esc(k.wilayah):'')+'</div></div>'+
   (clipImg?'<img class="img" src="'+esc(clipImg)+'" alt="'+esc(k.gbrKet||k.judul)+'" />'+(k.gbrKet?'<p class="cap">'+esc(k.gbrKet)+'</p>':''):'')+
   (k.potongan?'<h2>Potongan berita</h2><blockquote>'+esc(potong(k.potongan,700))+
     '<cite>Dikutip dari '+esc(k.media||'sumber asli')+
     (k.tglBerita?', '+esc(tglID(k.tglBerita)):'')+'. '+
     (k.tautan?'<a href="'+esc(k.tautan)+'" rel="nofollow noopener" target="_blank">Baca berita aslinya</a>':'')+
     '</cite></blockquote>':'')+
   (k.konteks?'<h2>Konteks dari meja kurasi</h2><p>'+esc(k.konteks).replace(/\n+/g,'</p><p>')+'</p>':'')+
   (pelajaran.length?'<h2>Pelajaran yang bisa dibawa</h2><ul>'+pelajaran.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')+
   (k.vonis?'<h2>Vonis</h2><p>'+esc(k.vonis)+'</p>':'')+
   (k.catatan?'<p style="font-size:14px;color:#7D7A75">'+esc(k.catatan)+'</p>':'')+
   '<div class="box"><b>Catatan kurasi</b><br />Konteks dan pelajaran di atas ditulis oleh pengelola Kliping RCS.CBS. Kutipan berita dipakai secukupnya untuk keperluan pendidikan, dan hak ciptanya tetap milik '+esc(k.media||'penerbit asli')+'. Keberatan atas kutipan ini bisa dikirim ke <a href="mailto:'+esc(SUREL_REDAKSI)+'">'+esc(SUREL_REDAKSI)+'</a>.</div>'+
   '<p style="margin-top:24px"><a class="cta" href="'+esc(buka)+'">Buka di portal \u2014 lengkap dengan narator, rak baca, dan kliping serupa</a></p>';

  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=300, s-maxage=900, stale-while-revalidate=3600');
  res.status(200).send(
    '<!doctype html><html lang="id"><head><meta charset="utf-8" />'+
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />'+
    '<title>'+esc(potong(k.judul,70))+' \u2014 Kliping RCS.CBS</title>'+
    '<meta name="description" content="'+esc(desc)+'" />'+
    '<link rel="canonical" href="'+esc(kanonik)+'" />'+
    '<link rel="icon" href="/icon-192.png" />'+
    '<link rel="alternate" type="application/rss+xml" title="Kliping RCS.CBS" href="/rss.xml" />'+
    '<meta name="robots" content="index,follow,max-image-preview:large" />'+
    '<meta property="og:type" content="article" />'+
    '<meta property="og:site_name" content="Kliping RCS.CBS" />'+
    '<meta property="og:title" content="'+esc(k.judul)+'" />'+
    '<meta property="og:description" content="'+esc(desc)+'" />'+
    '<meta property="og:image" content="'+esc(img)+'" />'+
    '<meta property="og:image:secure_url" content="'+esc(img)+'" />'+
    (clipImg?'':'<meta property="og:image:type" content="image/jpeg" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />')+
    '<meta property="og:image:alt" content="'+esc(k.judul)+'" />'+
    '<meta property="og:url" content="'+esc(kanonik)+'" />'+
    '<meta property="og:locale" content="id_ID" />'+
    (k.tglKliping?'<meta property="article:published_time" content="'+esc(k.tglKliping)+'" />':'')+
    (k.rubrik?'<meta property="article:section" content="'+esc(k.rubrik)+'" />':'')+
    '<meta name="twitter:card" content="summary_large_image" />'+
    '<meta name="twitter:title" content="'+esc(k.judul)+'" />'+
    '<meta name="twitter:description" content="'+esc(desc)+'" />'+
    '<meta name="twitter:image" content="'+esc(img)+'" />'+
    '<script type="application/ld+json">'+JSON.stringify(ld).replace(/</g,'\\u003c')+'<\/script>'+
    '<style>'+GAYA+'</style></head><body>'+
    '<header class="t"><div class="w"><a class="bm" href="'+esc(SITE)+'">'+'<img src="'+esc(SITE)+'/logo.png" alt="Logo REICHAS CHELEBES" width="38" height="46" />'+'<span><b>KLIPING RCS.CBS</b><i>Baca. Pahami. Bagikan.</i></span></a>'+
    '<a href="'+esc(SITE)+'/#materi" style="font-size:14px">Materi belajar</a></div></header>'+
    '<div class="w"><article><h1>'+esc(k.judul)+'</h1>'+
    (k.lead?'<p class="lead">'+esc(k.lead)+'</p>':'')+
    badan+'</article>'+
    '<footer><a href="'+esc(SITE)+'">Papan kliping</a><a href="'+esc(SITE)+'/#tentang">Tentang</a><a href="'+esc(SITE)+'/#privasi">Kebijakan Privasi</a><a href="'+esc(SITE)+'/#kontak">Kontak</a><a href="'+esc(SITE)+'/#pedoman">Pedoman Kurasi</a>'+
    '<p style="margin-top:14px">Dikelola Divisi Komunikasi &amp; Publikasi bersama Divisi Pendidikan &amp; Edukasi \u00b7 REICHAS CHELEBES, Makassar</p></footer>'+
    '</div></body></html>'
  );
};
