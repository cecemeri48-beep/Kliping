const SUPA = 'https://nfeexstvdjgywonbtxtb.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWV4c3R2ZGpneXdvbmJ0eHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTEyNzgsImV4cCI6MjEwMDk2NzI3OH0.rStSOT85A0IIy1Qes6A92b5Jpe4CrBZyrpVNQDC3o1E';
const SUREL_REDAKSI = 'kliping.rcscbs@gmail.com';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const url = `${SUPA}/rest/v1/kliping?select=*&or=(media.eq.Surat%20Pembaca,topik.cs.{"Surat Pembaca"})&order=id.desc&limit=50`;
      const r = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
      const data = await r.json();
      return res.status(200).json({ success: true, surelRedaksi: SUREL_REDAKSI, count: Array.isArray(data) ? data.length : 0, data: data });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const pengirim = String(body.pengirim || body.nama || body.from || 'Pembaca Web').trim();
      const emailPengirim = String(body.email || body.fromEmail || SUREL_REDAKSI).trim();
      const subjek = String(body.subjek || body.judul || body.subject || 'Surat Pembaca Baru').trim();
      const isi = String(body.isi || body.pesan || body.text || body.body || '').trim();
      const jenis = String(body.jenis || 'Surat Pembaca').trim();

      if (!subjek || !isi) {
        return res.status(400).json({ success: false, error: 'Subjek dan isi surat wajib diisi.' });
      }

      const id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const payload = {
        id: id,
        judul: `[${jenis}] ${subjek}`,
        lead: `Kiriman ${jenis} dari pembaca: ${pengirim} (${emailPengirim})`,
        rubrik: jenis === 'Draf Buah Pikir' ? 'Rubrik Sampah' : 'Cek Fakta',
        media: 'Surat Pembaca',
        tautan: 'https://kliping-reichas.my.id/',
        tgl_berita: new Date().toISOString().slice(0, 10),
        tgl_kliping: new Date().toISOString().slice(0, 10),
        wilayah: 'Sulawesi',
        lokasi: [],
        topik: ['Surat Pembaca'],
        potongan: isi.slice(0, 250) + (isi.length > 250 ? '...' : ''),
        konteks: `[SURAT PEMBACA MASUK]\nDari: ${pengirim} <${emailPengirim}>\nKe: ${SUREL_REDAKSI}\nPerihal: ${subjek}\n\n${isi}`,
        pelajaran: ['Tanggapan pembaca terbuka untuk diskusi publik.'],
        materi: [],
        status: 'Ditinjau',
        kurator: 'u4',
        kepekaan: 'Biasa',
        gambar: 'Tanpa gambar'
      };

      const r = await fetch(`${SUPA}/rest/v1/kliping`, {
        method: 'POST',
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!r.ok) {
        const errTxt = await r.text();
        return res.status(500).json({ success: false, error: errTxt });
      }

      return res.status(200).json({ success: true, id: id, message: 'Surat berhasil disimpan ke redaksi.' });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
