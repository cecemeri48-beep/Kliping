-- ============================================================
-- SEED: 2 kliping contoh + profil Admin Cece Meri
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query ->
--             tempel SELURUH file ini -> Run.
-- Aman dijalankan ulang (upsert). Tidak perlu login apa pun.
-- ============================================================

do $$
declare
  pen text;
  cece_id text;
  r1 text;
  r2 text;
  t_type text;
  a_empty text; a_top1 text; a_top2 text; a_pel1 text; a_pel2 text;
  j1 text := 'Pendakian massal 17 Agustus: bendera berkibar di puncak, sampah menggunung di jalur';
  l1 text := 'Setiap Agustus ribuan pendaki naik serentak untuk upacara bendera di puncak; yang tersisa di jalur adalah sampah, tanah tergerus, dan vegetasi yang terinjak.';
  p1 text := 'Tren pendakian gunung membuat volume sampah di gunung meningkat, menurut catatan Trashbag Community yang dikutip Kompas. Masifnya aktivitas pendakian dalam lima tahun terakhir membawa dampak berlapis: perilaku satwa berubah, dan volume sampah pendaki membengkak. Puncak kunjungan hampir selalu jatuh pada pekan 17 Agustus, ketika ribuan orang naik serentak untuk mengibarkan bendera di ketinggian.';
  k1 text := 'Mengibarkan bendera di puncak terasa heroik, tetapi mengukur nasionalisme dari ketinggian yang dicapai adalah salah alamat. Massa sebesar itu menginjak vegetasi rapuh, memperlebar jalur, dan meninggalkan tumpukan sampah di kawasan yang sebagian berstatus konservasi — tepat ketika pemerintah menargetkan persoalan sampah nasional selesai akhir 2027, seperti dilaporkan CNBC Indonesia (30 Juli 2026). Kain merah putih yang berkibar sehari tidak menebus botol plastik yang tertinggal bertahun-tahun. Cinta tanah air yang paling sederhana justru jarang difoto: menjaga tanahnya tetap hidup.';
  q11 text := 'Rayakan 17 Agustus tanpa memindahkan keramaian ke kawasan lindung: upacara di desa, bersih-bersih jalur, atau tanam pohon jauh lebih berguna.';
  q12 text := 'Kalau tetap naik, patuhi kuota pendakian, batasi jumlah anggota, dan turunkan semua sampah — termasuk sisa dekorasi upacara.';
  q13 text := 'Ukur nasionalisme dari apa yang kamu tinggalkan: jalur yang bersih lebih patriotik daripada foto bendera di puncak.';
  j2 text := 'Di gunung, penolong pertama bukan tim SAR: PPGD dan sepuluh menit yang menentukan nyawa';
  l2 text := 'Di jalur pendakian, bantuan medis terdekat bisa berjarak berjam-jam; sepuluh menit pertama sepenuhnya ada di tangan kelompokmu sendiri.';
  p2 text := 'PPGD (Pertolongan Pertama Gawat Darurat) wajib dipelajari sebelum mendaki, tulis MAWAPALA Walisongo dalam panduannya. Langkah dasarnya dikenal sebagai A-B-C-D: Airway (memastikan jalan napas terbuka), Breathing (memeriksa pernapasan), Circulation (mencegah perdarahan dan menjaga sirkulasi), dan Disability (menilai kesadaran dengan skala A-V-P-U: Alert, Verbal, Pain, Unresponsive).';
  k2 text := 'Sebagian besar kematian di gunung bukan disebabkan luka yang mustahil ditangani, melainkan menit-menit awal yang terbuang: korban hipotermia dibiarkan berpakaian basah, patah tulang digerakkan sembarangan, atau penurunan kesadaran disangka sekadar kelelahan. PPGD bukan keterampilan khusus tim SAR; ia kompetensi dasar setiap anggota kelompok, sama wajibnya dengan membawa air. Kelompok yang paham PPGD mengubah menunggu bantuan menjadi membeli waktu sampai bantuan tiba.';
  q21 text := 'Kuasai urutan A-B-C-D dan penilaian kesadaran A-V-P-U sebelum mendaki — latih di basecamp, bukan dibaca saat panik.';
  q22 text := 'Hipotermia ditangani dengan menghentikan kehilangan panas: ganti pakaian basah, selimuti, isolasi dari tanah; jangan beri minum korban yang kesadarannya menurun.';
  q23 text := 'Bawa P3K yang benar-benar kamu pahami isinya, dan sepakati jalur evakuasi serta pembagian peran sebelum berangkat.';
begin
  -- Peninjau: Super-Admin pertama (bila ada)
  select id into pen from public.profiles where peran = 'Super-Admin' order by id limit 1;

  -- 1) Profil Cece Meri: buat bila belum ada; perbarui bila email sudah terdaftar
  insert into public.profiles (id, nama, email, peran, divisi, aktif)
  values ('u-cecemeri', 'Cece Meri', 'cecemeri48@gmail.com', 'Admin', 'Komunikasi & Publikasi', true)
  on conflict (email) do update set
    nama = excluded.nama, peran = excluded.peran,
    divisi = excluded.divisi, aktif = excluded.aktif;

  -- Ambil ID profilnya (bisa id lama yang sudah ada, bukan u-cecemeri)
  select id into cece_id from public.profiles where email = 'cecemeri48@gmail.com';

  -- 2) Pastikan sumber media ada (aman bila tabel media punya FK dari kliping)
  insert into public.media (nama) values ('Kompas'), ('MAWAPALA Walisongo')
  on conflict do nothing;

  -- 3) Rubrik: pakai yang tersedia di tabel rubrik
  select coalesce(
    (select nama from public.rubrik where nama = 'Rubrik Sampah'),
    (select nama from public.rubrik where nama = 'Bedah Insiden'),
    (select nama from public.rubrik order by nama limit 1),
    'Bedah Insiden') into r1;
  select coalesce(
    (select nama from public.rubrik where nama = 'Bedah Insiden'),
    (select nama from public.rubrik order by nama limit 1),
    'Bedah Insiden') into r2;

  -- 4) Deteksi tipe kolom array (text[] atau jsonb)
  select data_type into t_type from information_schema.columns
   where table_schema = 'public' and table_name = 'kliping' and column_name = 'topik';

  if t_type = 'ARRAY' then
    a_empty := quote_literal('{}') || '::text[]';
    a_top1  := quote_literal('{"Sampah","Konservasi"}') || '::text[]';
    a_top2  := quote_literal('{"Keselamatan"}') || '::text[]';
    a_pel1  := quote_literal('{"' || q11 || '","' || q12 || '","' || q13 || '"}') || '::text[]';
    a_pel2  := quote_literal('{"' || q21 || '","' || q22 || '","' || q23 || '"}') || '::text[]';
  else
    a_empty := quote_literal('[]') || '::jsonb';
    a_top1  := quote_literal('["Sampah","Konservasi"]') || '::jsonb';
    a_top2  := quote_literal('["Keselamatan"]') || '::jsonb';
    a_pel1  := quote_literal('["' || q11 || '","' || q12 || '","' || q13 || '"]') || '::jsonb';
    a_pel2  := quote_literal('["' || q21 || '","' || q22 || '","' || q23 || '"]') || '::jsonb';
  end if;

  -- 5) Dua kliping, status Terbit, kurator = profil Cece Meri
  execute format($f$
    insert into public.kliping
      (id, judul, lead, rubrik, media, tautan, tgl_berita, tgl_kliping, wilayah,
       lokasi, topik, potongan, konteks, pelajaran, materi,
       status, kurator, peninjau, kepekaan, gambar, vonis, catatan)
    values
      ('contoh-17agustus-gunung', %L, %L, %L, 'Kompas',
       'https://travel.kompas.com/read/2017/08/18/093600627/imbas-tren-pendakian-gunung-volume-sampah-di-gunung-meningkat?page=all',
       '2017-08-18', '2026-08-01', 'Nasional', %s, %s, %L, %L, %s, %s,
       'Terbit', %L, %L, 'Biasa', 'Tanpa gambar', null, null),
      ('contoh-ppgd-gunung', %L, %L, %L, 'MAWAPALA Walisongo',
       'https://mawapala.walisongo.ac.id/index.php/2021/04/02/jangan-anggap-remeh-hipotermia-kenali-dan-pelajari-sebelum-terjadi/',
       '2021-04-02', '2026-08-01', 'Nasional', %s, %s, %L, %L, %s, %s,
       'Terbit', %L, %L, 'Biasa', 'Tanpa gambar', null, null)
    on conflict (id) do update set
      judul = excluded.judul, lead = excluded.lead, rubrik = excluded.rubrik,
      media = excluded.media, tautan = excluded.tautan,
      tgl_berita = excluded.tgl_berita, tgl_kliping = excluded.tgl_kliping,
      wilayah = excluded.wilayah, lokasi = excluded.lokasi, topik = excluded.topik,
      potongan = excluded.potongan, konteks = excluded.konteks,
      pelajaran = excluded.pelajaran, materi = excluded.materi,
      status = excluded.status, kurator = excluded.kurator,
      peninjau = excluded.peninjau, kepekaan = excluded.kepekaan
  $f$,
    j1, l1, r1, a_empty, a_top1, p1, k1, a_pel1, a_empty, cece_id, pen,
    j2, l2, r2, a_empty, a_top2, p2, k2, a_pel2, a_empty, cece_id, pen);

  raise notice 'Selesai: profil + 2 kliping Terbit tersimpan.';
end $$;

-- Verifikasi (dua baris kliping + satu profil harus muncul di hasil)
select id, judul, status, kurator from public.kliping
 where id in ('contoh-17agustus-gunung', 'contoh-ppgd-gunung');
select id, nama, email, peran from public.profiles where email = 'cecemeri48@gmail.com';
