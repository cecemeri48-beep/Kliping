const SUPA='https://nfeexstvdjgywonbtxtb.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWV4c3R2ZGpneXdvbmJ0eHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTEyNzgsImV4cCI6MjEwMDk2NzI3OH0.rStSOT85A0IIy1Qes6A92b5Jpe4CrBZyrpVNQDC3o1E';
const SITE='https://kliping-reichas.my.id';
module.exports = async function (req, res) {
  const id = (req.query && req.query.id) || '';
  const esc = function (s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  const go = SITE + '/#klip=' + encodeURIComponent(id);
  const self = SITE + '/api/share?id=' + encodeURIComponent(id);
  let k = null;
  try {
    if (id) {
      const r = await fetch(SUPA + '/rest/v1/kliping?id=eq.' + encodeURIComponent(id) + '&select=judul,lead,gambar,rubrik,status', { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
      const rows = await r.json();
      if (Array.isArray(rows) && rows.length && rows[0].status === 'Terbit') k = rows[0];
    }
  } catch (e) {}
  const title = k ? k.judul : 'Kliping REICHAS \u2014 Galeri Literasi & Cek Fakta';
  const desc = k ? k.lead : 'Galeri kliping literasi & cek fakta REICHAS \u2014 baca, telaah, dan bagikan.';
  const clipImg = (k && k.gambar && /^https?:\/\//.test(k.gambar)) ? k.gambar : null;
  const img = clipImg || (SITE + '/og-image.jpg?v=3');
  const imgMeta = clipImg
    ? ''
    : '<meta property="og:image:type" content="image/jpeg" />' +
      '<meta property="og:image:width" content="1200" />' +
      '<meta property="og:image:height" content="630" />';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
  res.status(200).send(
    '<!doctype html><html lang="id"><head><meta charset="utf-8" />' +
    '<title>' + esc(title) + '</title>' +
    '<meta name="description" content="' + esc(desc) + '" />' +
    '<meta property="og:type" content="article" />' +
    '<meta property="og:site_name" content="Kliping REICHAS" />' +
    '<meta property="og:title" content="' + esc(title) + '" />' +
    '<meta property="og:description" content="' + esc(desc) + '" />' +
    '<meta property="og:image" content="' + esc(img) + '" />' +
    '<meta property="og:image:secure_url" content="' + esc(img) + '" />' +
    imgMeta +
    '<meta property="og:image:alt" content="' + esc(title) + '" />' +
    '<meta property="og:url" content="' + esc(self) + '" />' +
    '<meta property="og:locale" content="id_ID" />' +
    '<meta name="twitter:card" content="summary_large_image" />' +
    '<meta name="twitter:title" content="' + esc(title) + '" />' +
    '<meta name="twitter:description" content="' + esc(desc) + '" />' +
    '<meta name="twitter:image" content="' + esc(img) + '" />' +
    '<meta http-equiv="refresh" content="0; url=' + esc(go) + '" />' +
    '<link rel="canonical" href="' + esc(go) + '" />' +
    '</head><body style="font-family:sans-serif;padding:40px;text-align:center"><script>location.replace(' + JSON.stringify(go) + ')<\/script>' +
    '<p>Mengalihkan ke <a href="' + esc(go) + '">Kliping REICHAS</a>\u2026</p></body></html>'
  );
};
