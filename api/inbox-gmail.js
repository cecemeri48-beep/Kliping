/*
 * api/inbox-gmail.js
 * Membaca kotak masuk Gmail redaksi lewat IMAP, lalu mengembalikannya
 * dalam bentuk yang langsung dipakai panel admin.
 *
 * TANPA dependensi npm. Hanya modul bawaan Node (tls).
 *
 * Environment variable yang wajib diisi di Vercel:
 *   GMAIL_USER          -> kliping.rcscbs@gmail.com
 *   GMAIL_APP_PASSWORD  -> 16 digit App Password (BUKAN sandi Gmail biasa)
 *
 * Opsional:
 *   GMAIL_IMAP_HOST     -> default imap.gmail.com
 *   GMAIL_IMAP_PORT     -> default 993
 *   GMAIL_LIMIT         -> default 30 (jumlah email terbaru yang diambil)
 *   GMAIL_IMAP_INSECURE -> "1" hanya untuk pengujian lokal
 */

const tls = require('node:tls');

const SUPA = 'https://nfeexstvdjgywonbtxtb.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWV4c3R2ZGpneXdvbmJ0eHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTEyNzgsImV4cCI6MjEwMDk2NzI3OH0.rStSOT85A0IIy1Qes6A92b5Jpe4CrBZyrpVNQDC3o1E';
const PERAN_BOLEH = ['Admin', 'Super-Admin'];

/* ------------------------------------------------------------------ *
 * 1. GERBANG OTORISASI
 * ------------------------------------------------------------------ */

async function periksaAkses(req) {
  const auth = String(req.headers['authorization'] || req.headers['Authorization'] || '');
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { ok: false, kode: 401, pesan: 'Token tidak ada. Silakan masuk sebagai Admin.' };

  let uid = null;
  try {
    const r = await fetch(SUPA + '/auth/v1/user', {
      headers: { apikey: ANON, Authorization: 'Bearer ' + token }
    });
    if (!r.ok) return { ok: false, kode: 401, pesan: 'Sesi tidak sah atau sudah kedaluwarsa.' };
    const u = await r.json();
    uid = u && u.id;
  } catch (e) {
    return { ok: false, kode: 503, pesan: 'Gagal memverifikasi sesi: ' + e.message };
  }
  if (!uid) return { ok: false, kode: 401, pesan: 'Sesi tidak sah.' };

  let peran = null;
  try {
    const r = await fetch(SUPA + '/rest/v1/profiles?select=peran&id=eq.' + encodeURIComponent(uid), {
      headers: { apikey: ANON, Authorization: 'Bearer ' + token }
    });
    const rows = await r.json();
    peran = Array.isArray(rows) && rows[0] ? rows[0].peran : null;
  } catch (e) {
    return { ok: false, kode: 503, pesan: 'Gagal membaca peran pengguna: ' + e.message };
  }

  if (PERAN_BOLEH.indexOf(peran) === -1) {
    return { ok: false, kode: 403, pesan: 'Akses ditolak. Hanya Admin & Super-Admin yang boleh membuka kotak masuk redaksi.' };
  }
  return { ok: true, uid: uid, peran: peran };
}

/* ------------------------------------------------------------------ *
 * 2. KLIEN IMAP MINIMAL
 * ------------------------------------------------------------------ */

/* Cari akhir respons bertag, sambil melompati literal {N} */
function cariAkhirTag(buf, tag) {
  const awalan = Buffer.from(tag + ' ', 'latin1');
  let i = 0;
  while (i < buf.length) {
    const nl = buf.indexOf('\r\n', i, 'latin1');
    if (nl === -1) return -1;
    const baris = buf.slice(i, nl).toString('latin1');
    const lit = /\{(\d+)\+?\}$/.exec(baris);
    if (lit) {
      i = nl + 2 + parseInt(lit[1], 10);
      continue;
    }
    if (nl - i >= awalan.length && buf.slice(i, i + awalan.length).equals(awalan)) {
      return nl + 2;
    }
    i = nl + 2;
  }
  return -1;
}

function cariAkhirBaris(buf) {
  const nl = buf.indexOf('\r\n', 0, 'latin1');
  return nl === -1 ? -1 : nl + 2;
}

/* Ambil seluruh literal {N} dari sebuah respons FETCH */
function ambilLiteral(buf) {
  const keluar = [];
  let i = 0;
  while (i < buf.length) {
    const nl = buf.indexOf('\r\n', i, 'latin1');
    if (nl === -1) break;
    const baris = buf.slice(i, nl).toString('latin1');
    const lit = /\{(\d+)\+?\}$/.exec(baris);
    if (lit) {
      const n = parseInt(lit[1], 10);
      keluar.push(buf.slice(nl + 2, nl + 2 + n));
      i = nl + 2 + n;
      continue;
    }
    i = nl + 2;
  }
  return keluar;
}

function buatPembaca(sock) {
  let buf = Buffer.alloc(0);
  let ingin = null;
  let galat = null;

  function pompa() {
    if (!ingin) return;
    const akhir = ingin.cari(buf);
    if (akhir > -1) {
      const potong = buf.slice(0, akhir);
      buf = buf.slice(akhir);
      const w = ingin;
      ingin = null;
      w.resolve(potong);
    }
  }
  function bubar(e) {
    galat = e;
    if (ingin) { const w = ingin; ingin = null; w.reject(e); }
  }

  sock.on('data', function (d) { buf = Buffer.concat([buf, d]); pompa(); });
  sock.on('error', bubar);
  sock.on('close', function () { bubar(new Error('Koneksi IMAP terputus.')); });

  return {
    baca: function (cari) {
      if (galat) return Promise.reject(galat);
      return new Promise(function (resolve, reject) {
        ingin = { cari: cari, resolve: resolve, reject: reject };
        pompa();
      });
    }
  };
}

function kutip(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

async function ambilEmailIMAP(opsi) {
  const host = opsi.host;
  const port = opsi.port;
  const batas = opsi.batas;

  const sock = await new Promise(function (resolve, reject) {
    const s = tls.connect({
      host: host,
      port: port,
      servername: host,
      rejectUnauthorized: opsi.rejectUnauthorized !== false
    }, function () { resolve(s); });
    s.setTimeout(20000, function () { s.destroy(new Error('Waktu tunggu IMAP habis.')); });
    s.on('error', reject);
  });

  const pembaca = buatPembaca(sock);
  let no = 0;

  async function perintah(baris, rahasia) {
    const tag = 'a' + (++no);
    sock.write(tag + ' ' + baris + '\r\n');
    const resp = await pembaca.baca(function (b) { return cariAkhirTag(b, tag); });
    const teks = resp.toString('latin1');
    const hasil = new RegExp('^' + tag + ' (OK|NO|BAD)([^\r\n]*)', 'm').exec(teks);
    if (!hasil || hasil[1] !== 'OK') {
      const sebab = hasil ? hasil[2].trim() : 'respons tidak dikenali';
      throw new Error('IMAP ' + (rahasia ? 'LOGIN' : baris.split(' ')[0]) + ' gagal: ' + sebab);
    }
    return resp;
  }

  try {
    await pembaca.baca(cariAkhirBaris); /* salam pembuka server */

    await perintah('LOGIN ' + kutip(opsi.user) + ' ' + kutip(opsi.pass), true);

    const pilih = await perintah('SELECT INBOX');
    const jml = /\* (\d+) EXISTS/.exec(pilih.toString('latin1'));
    const total = jml ? parseInt(jml[1], 10) : 0;
    if (!total) { try { await perintah('LOGOUT'); } catch (e) {} sock.end(); return []; }

    const mulai = Math.max(1, total - batas + 1);
    const rentang = mulai + ':' + total;
    const isi = await perintah('FETCH ' + rentang + ' (BODY.PEEK[])');
    const mentah = ambilLiteral(isi);

    try { await perintah('LOGOUT'); } catch (e) {}
    sock.end();
    return mentah;
  } catch (e) {
    try { sock.destroy(); } catch (x) {}
    throw e;
  }
}

/* ------------------------------------------------------------------ *
 * 3. PENGURAI MIME
 * ------------------------------------------------------------------ */

function bukaLipatan(head) {
  return head.replace(/\r?\n[ \t]+/g, ' ');
}

function ambilHeader(head, nama) {
  const re = new RegExp('^' + nama + ':[ \t]*([^\r\n]*)', 'im');
  const m = re.exec(head);
  return m ? m[1].trim() : '';
}

function decodeQP(s) {
  return Buffer.from(
    s.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, function (_, h) {
      return String.fromCharCode(parseInt(h, 16));
    }),
    'latin1'
  );
}

function keTeks(buf, charset) {
  const cs = String(charset || 'utf-8').toLowerCase();
  if (cs.indexOf('utf-8') > -1 || cs.indexOf('utf8') > -1) return buf.toString('utf8');
  if (cs.indexOf('iso-8859') > -1 || cs.indexOf('windows-1252') > -1 || cs.indexOf('ascii') > -1) return buf.toString('latin1');
  return buf.toString('utf8');
}

/* =?UTF-8?B?....?= dan =?UTF-8?Q?....?= */
function decodeKataTersandi(s) {
  if (!s) return '';
  return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, function (_, cs, jenis, data) {
    try {
      if (jenis.toUpperCase() === 'B') return keTeks(Buffer.from(data, 'base64'), cs);
      return keTeks(decodeQP(data.replace(/_/g, ' ')), cs);
    } catch (e) { return data; }
  }).replace(/\?=\s+=\?/g, '');
}

function pisahKepala(raw) {
  const s = raw.toString('latin1');
  const m = /\r?\n\r?\n/.exec(s);
  if (!m) return { head: s, body: Buffer.alloc(0) };
  return {
    head: bukaLipatan(s.slice(0, m.index)),
    body: raw.slice(m.index + m[0].length)
  };
}

function paramHeader(nilai, nama) {
  const m = new RegExp(nama + '\\s*=\\s*"([^"]+)"|' + nama + '\\s*=\\s*([^;\\s]+)', 'i').exec(nilai || '');
  return m ? (m[1] || m[2]) : '';
}

function decodeBagian(body, enc, charset) {
  const e = String(enc || '').toLowerCase();
  if (e.indexOf('base64') > -1) return keTeks(Buffer.from(body.toString('latin1').replace(/\s/g, ''), 'base64'), charset);
  if (e.indexOf('quoted-printable') > -1) return keTeks(decodeQP(body.toString('latin1')), charset);
  return keTeks(body, charset);
}

function bersihkanHTML(h) {
  return h
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n');
}

/* Telusuri struktur MIME, kembalikan teks terbaik yang ditemukan */
function cariTeks(head, body, dalam) {
  const ct = ambilHeader(head, 'Content-Type');
  const enc = ambilHeader(head, 'Content-Transfer-Encoding');
  const charset = paramHeader(ct, 'charset') || 'utf-8';

  if (/multipart\//i.test(ct) && (dalam || 0) < 6) {
    const batas = paramHeader(ct, 'boundary');
    if (batas) {
      const s = body.toString('latin1');
      const potong = s.split('--' + batas);
      let cadanganHTML = '';
      for (let i = 1; i < potong.length; i++) {
        const p = potong[i];
        if (/^--/.test(p)) break;
        const bagian = pisahKepala(Buffer.from(p.replace(/^\r?\n/, ''), 'latin1'));
        const hasil = cariTeks(bagian.head, bagian.body, (dalam || 0) + 1);
        if (hasil.plain) return hasil;
        if (hasil.html && !cadanganHTML) cadanganHTML = hasil.html;
      }
      return { plain: '', html: cadanganHTML };
    }
  }

  if (/text\/plain/i.test(ct) || !ct) return { plain: decodeBagian(body, enc, charset), html: '' };
  if (/text\/html/i.test(ct)) return { plain: '', html: decodeBagian(body, enc, charset) };
  return { plain: '', html: '' };
}

function uraikanEmail(raw, indeks) {
  const { head, body } = pisahKepala(raw);
  const from = decodeKataTersandi(ambilHeader(head, 'From'));
  const cocok = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(from);
  const nama = cocok ? (cocok[1].trim() || cocok[2].split('@')[0]) : (from.split('@')[0] || 'Pembaca');
  const alamat = cocok ? cocok[2].trim() : from.trim();

  const teks = cariTeks(head, body, 0);
  let isi = teks.plain || (teks.html ? bersihkanHTML(teks.html) : '');
  isi = isi.replace(/\r\n/g, '\n').trim();

  const tglMentah = ambilHeader(head, 'Date');
  let tgl = new Date().toISOString();
  if (tglMentah) { const d = new Date(tglMentah); if (!isNaN(d.getTime())) tgl = d.toISOString(); }

  const msgId = ambilHeader(head, 'Message-ID').replace(/[<>]/g, '').trim();

  return {
    id: 'gm' + (msgId ? Buffer.from(msgId).toString('base64url').slice(0, 24) : Date.now().toString(36) + indeks),
    pengirim: nama || 'Pembaca',
    email: alamat || '',
    subjek: decodeKataTersandi(ambilHeader(head, 'Subject')) || '(tanpa subjek)',
    tgl: tgl,
    isi: isi || '(email tanpa isi teks)',
    baca: false,
    sumber: 'gmail'
  };
}

/* ------------------------------------------------------------------ *
 * 4. HANDLER
 * ------------------------------------------------------------------ */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Hanya GET.' });

  const izin = await periksaAkses(req);
  if (!izin.ok) return res.status(izin.kode).json({ success: false, error: izin.pesan });

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return res.status(500).json({
      success: false,
      error: 'Gmail belum dikonfigurasi. Isi GMAIL_USER dan GMAIL_APP_PASSWORD di environment variable Vercel.'
    });
  }

  try {
    const mentah = await ambilEmailIMAP({
      host: process.env.GMAIL_IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.GMAIL_IMAP_PORT || '993', 10),
      user: user,
      pass: pass.replace(/\s/g, ''),
      batas: Math.min(parseInt(process.env.GMAIL_LIMIT || '30', 10) || 30, 100),
      rejectUnauthorized: process.env.GMAIL_IMAP_INSECURE !== '1'
    });

    const pesan = mentah.map(uraikanEmail).sort(function (a, b) {
      return new Date(b.tgl) - new Date(a.tgl);
    });

    return res.status(200).json({ success: true, akun: user, count: pesan.length, data: pesan });
  } catch (e) {
    const m = String(e && e.message || e);
    let saran = '';
    if (/AUTHENTICATIONFAILED|LOGIN gagal/i.test(m)) {
      saran = ' Pastikan yang dipakai adalah App Password 16 digit, bukan sandi Gmail biasa, dan IMAP sudah diaktifkan di Gmail Settings.';
    }
    return res.status(502).json({ success: false, error: 'Gagal membaca Gmail: ' + m + saran });
  }
};

/* diekspor untuk pengujian */
module.exports.uraikanEmail = uraikanEmail;
module.exports.ambilEmailIMAP = ambilEmailIMAP;
module.exports.ambilLiteral = ambilLiteral;
module.exports.cariAkhirTag = cariAkhirTag;
