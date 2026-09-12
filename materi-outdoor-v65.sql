-- v65: dua belas materi kegiatan outdoor (m8-m19) untuk halaman Materi.
-- MENGGANTIKAN materi-outdoor-v64.sql — file ini sudah memuat semuanya.
-- Jalankan di Supabase -> SQL Editor. Aman diulang (upsert per id).
-- Catatan: kolom "tautan" menampilkan tombol "Buka referensi" di halaman materi.

insert into materi (id, judul, rumpun, tingkat, acuan, tautan, isi) values
  ('m8', 'Packing Seimbang: Aturan 20 Persen', 'Logistik', 'Dasar', 'Kompilasi catatan lapangan anggota', null,
   'Berat carrier idealnya tidak lebih dari 20 persen berat badan untuk pendakian satu-dua hari. Barang paling berat diletakkan menempel punggung dan setinggi bahu, bukan di dasar tas. Jas hujan, P3K, headlamp, dan sarung tangan selalu di kantong luar — barang darurat tidak boleh dikubur.'),
  ('m9', 'Komunikasi Darurat Tanpa Sinyal', 'Keselamatan', 'Dasar', 'Standar komunikasi lapangan RCS.CBS', null,
   'Sepakati kode sebelum berangkat: satu tiupan peluit panjang berarti berhenti dan berkumpul, tiga tiupan pendek beruntun berarti minta tolong. Tentukan titik kumpul ulang setiap kali melewati persimpangan jalur, dan titipkan rencana rute tertulis kepada anggota yang berjalan paling belakang.'),
  ('m10', 'Memilih Tempat Kemah yang Aman', 'Keterampilan', 'Dasar', 'Leave No Trace Center for Outdoor Ethics', 'https://lnt.org/why/7-principles',
   'Hindari tiga tempat: di bawah pohon besar yang lapuk, di cekungan bekas aliran air meski tampak kering, dan di punggungan terbuka saat musim badai. Pilih tanah datar dengan drainase alami, dan usahakan tiba saat langit masih terang agar sempat membaca sekeliling.'),
  ('m11', 'Tiga Simpul Wajib di Lapangan', 'Keterampilan', 'Menengah', 'Modul Pendidikan Dasar RCS.CBS', null,
   'Figure eight untuk ujung tambat, bowline untuk simpul tetap yang mudah dilepas, dan taut-line untuk menegangkan tali flysheet. Latih ketiganya sampai bisa dipasang dengan mata tertutup — di lapangan kamu akan memakainya dalam gelap dengan tangan dingin.'),
  ('m12', 'Panjat Tebing: Cek Pasangan Sebelum Bergerak', 'Keterampilan', 'Menengah', 'UIAA — Federasi Panjat Tebing Internasional', 'https://www.theuiaa.org/safety/',
   'Sebelum pemanjat bergerak, lakukan cek pasangan: simpul terikat benar, harness terpasang rapat, dan belayer siap dengan perangkat terkunci. UIAA menekankan bahwa hampir semua kecelakaan panjat bermula dari komunikasi yang terlewat, bukan dari kegagalan alat. Helm dipakai sejak berdiri di bawah tebing, bukan hanya saat memanjat.'),
  ('m13', 'Susur Goa: Aturan Tiga Sumber Cahaya', 'Keterampilan', 'Menengah', 'National Speleological Society (NSS), AS', 'https://caves.org/education',
   'Komunitas penelusur goa dunia mewajibkan tiga hal: setiap orang membawa tiga sumber cahaya yang terpisah, tidak pernah masuk goa sendirian (minimal tiga orang), dan selalu menitipkan rencana perjalanan kepada orang di luar. Goa tidak menoleransi cuaca — hujan di hulu bisa menaikkan air dalam hitungan menit, padahal di dalam goa langit tidak terlihat.'),
  ('m14', 'Susur Sungai: Baca Arus Sebelum Masuk Air', 'Keselamatan', 'Menengah', 'American Canyoneering Association (ACA)', 'https://canyoneering.net/',
   'Susur sungai ala canyoning internasional menekankan urutan yang tetap: amati arus dari tepi, tentukan titik keluar darurat setiap puluhan meter, dan jangan pernah mengikat diri ke tali saat berada di dalam arus. Bila tersapu, posisi telentang dengan kaki mengarah ke hilir untuk menahan benturan batu.'),
  ('m15', 'Jeram: Pelampung, Helm, dan Renang Bertahan', 'Keselamatan', 'Menengah', 'American Whitewater — Safety Code', 'https://www.americanwhitewater.org/explore/safety/safety-code',
   'Kode keselamatan arus deras American Whitewater sederhana: pelampung (PFD) dan helm wajib sejak kelas jeram paling mudah; jangan berdiri di arus yang lebih dalam dari lutut karena kaki bisa terjepit batu; dan regu menyepakati sinyal tangan sebelum berangkat. Menolong korban dimulai dengan melempar tali, bukan ikut terjun.'),
  ('m16', 'Menyeberangi Sungai: Keputusan Ada di Tepi', 'Keselamatan', 'Dasar', 'New Zealand Mountain Safety Council (NZMSC)', 'https://www.mountainsafety.org.nz/learn/skills/river-safety',
   'Dewan keselamatan gunung Selandia Baru merumuskan satu kalimat penyelamat: if in doubt, do not cross — ragu sedikit saja, jangan menyeberang. Tanda sungai tak aman: air di atas lutut yang keruh, bunyi batu berguling di dasar, atau arus yang menghanyutkan ranting besar. Bila tetap menyeberang, lepas pengikat pinggang carrier agar tas mudah diloloskan saat jatuh.'),
  ('m17', 'Petir di Lapangan: Aturan 30/30', 'Cuaca', 'Dasar', 'NOAA / National Weather Service, AS', 'https://www.weather.gov/safety/lightning',
   'When thunder roars, go indoors — bunyi guruh berarti petir sudah cukup dekat untuk membunuh. Aturan 30/30: bila jeda antara kilat dan guruh kurang dari 30 detik, segera turun dari punggungan dan jangan berteduh di bawah pohon tunggal; tunggu 30 menit setelah guruh terakhir sebelum kembali bergerak.'),
  ('m18', 'Snorkeling & Menyelam: Aturan Emas di Bawah Air', 'Keselamatan', 'Menengah', 'Divers Alert Network (DAN)', 'https://dan.org/health-medicine/health-resources/health-safety-guidelines/',
   'DAN, lembaga keselamatan selam dunia, menetapkan aturan yang tidak bisa ditawar: selalu menyelam berpasangan (buddy), periksa alat bersama sebelum turun, dan jangan pernah menahan napas saat naik ke permukaan — paru-paru bisa mengembang dan pecah. Naiklah perlahan, dan jangan menyelam dalam 24 jam sebelum naik gunung atau terbang.'),
  ('m19', 'Di Pantai: Kenali Rip Current, Arus Balik Pembunuh', 'Keselamatan', 'Dasar', 'RNLI — Royal National Lifeboat Institution', 'https://rnli.org/water-safety/know-the-risks/rip-currents',
   'Rip current adalah penyebab utama kecelakaan di pantai berombak: arus sempit yang menarik lurus ke tengah laut. Cirinya kanal air lebih tenang dan lebih gelap di antara barisan ombak. Bila terseret, JANGAN melawan arus ke tepi — mengambanglah, angkat tangan minta tolong, lalu berenang menyamping sejajar pantai sampai lepas dari arus.')
on conflict (id) do update set
  judul = excluded.judul,
  rumpun = excluded.rumpun,
  tingkat = excluded.tingkat,
  acuan = excluded.acuan,
  tautan = excluded.tautan,
  isi = excluded.isi;
