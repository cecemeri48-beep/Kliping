-- v64: empat materi kegiatan outdoor baru untuk halaman Materi.
-- Jalankan di Supabase -> SQL Editor. Aman dijalankan berulang (upsert per id).

insert into materi (id, judul, rumpun, tingkat, acuan, isi) values
  ('m8', 'Packing Seimbang: Aturan 20 Persen', 'Logistik', 'Dasar', 'Kompilasi catatan lapangan anggota',
   'Berat carrier idealnya tidak lebih dari 20 persen berat badan untuk pendakian satu-dua hari. Barang paling berat diletakkan menempel punggung dan setinggi bahu, bukan di dasar tas. Jas hujan, P3K, headlamp, dan sarung tangan selalu di kantong luar — barang darurat tidak boleh dikubur.'),
  ('m9', 'Komunikasi Darurat Tanpa Sinyal', 'Keselamatan', 'Dasar', 'Standar komunikasi lapangan RCS.CBS',
   'Sepakati kode sebelum berangkat: satu tiupan peluit panjang berarti berhenti dan berkumpul, tiga tiupan pendek beruntun berarti minta tolong. Tentukan titik kumpul ulang setiap kali melewati persimpangan jalur, dan titipkan rencana rute tertulis kepada anggota yang berjalan paling belakang.'),
  ('m10', 'Memilih Tempat Kemah yang Aman', 'Keterampilan', 'Dasar', 'Leave No Trace Center for Outdoor Ethics',
   'Hindari tiga tempat: di bawah pohon besar yang lapuk, di cekungan bekas aliran air meski tampak kering, dan di punggungan terbuka saat musim badai. Pilih tanah datar dengan drainase alami, dan usahakan tiba saat langit masih terang agar sempat membaca sekeliling.'),
  ('m11', 'Tiga Simpul Wajib di Lapangan', 'Keterampilan', 'Menengah', 'Modul Pendidikan Dasar RCS.CBS',
   'Figure eight untuk ujung tambat, bowline untuk simpul tetap yang mudah dilepas, dan taut-line untuk menegangkan tali flysheet. Latih ketiganya sampai bisa dipasang dengan mata tertutup — di lapangan kamu akan memakainya dalam gelap dengan tangan dingin.')
on conflict (id) do update set
  judul = excluded.judul,
  rumpun = excluded.rumpun,
  tingkat = excluded.tingkat,
  acuan = excluded.acuan,
  isi = excluded.isi;
