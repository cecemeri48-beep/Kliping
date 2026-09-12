# Mobile Polish Notes

Perubahan utama:

1. Onboarding mobile 3 langkah untuk pengguna baru.
2. Mode baca nyaman dengan font lebih lega dan header disembunyikan saat membaca.
3. Progress baca global di bagian atas layar.
4. Floating action button mobile untuk Mode Baca dan Kutip/Share.
5. Panel kutipan siap salin/share via Web Share API.
6. Banner pasang PWA ke layar utama.
7. Sticky search/tools di mobile.
8. Kartu kliping mobile dibuat lebih ringkas, rounded, dan mudah disentuh.
9. Bottom navigation diberi safe-area agar nyaman di iPhone/Android modern.
10. Fallback offline untuk QA/local preview ketika CDN Supabase tidak termuat.
11. Service worker cache dinaikkan ke reichas-v55-mobile-polish.

Catatan deploy:
- Upload seluruh folder ke Vercel/GitHub seperti biasa.
- Pastikan RLS Supabase tetap aktif untuk data publik/admin.
- Bila CDN Supabase tersedia di produksi, aplikasi tetap memakai client Supabase asli.

12. Tombol eksternal Bivak Rental ditambahkan di menu dan footer: https://bivak-rental.vercel.app/#

13. Floating Anoa tidak lagi tertutup panel kutipan; tombol menu dibuat compact tanpa tulisan MENU.

14. Password Gmail frontend dibersihkan: browser hanya menyimpan label email, kredensial tetap di Vercel env.
15. Selector TTS dibuat lebih aman terhadap duplicate ID lint/static.

16. Restore mobile floating Anoa: tampil di kiri bawah, otomatis sembunyi saat panel kutipan aktif.

17. Fungsi interaksi Anoa mobile dipulihkan: tap lompat/sparkle/ucapan, drag tetap aktif, speech bubble tampil lagi.

18. Cache service worker dinaikkan ke reichas-v56-anoa-final-mobile agar HP/PWA mengambil fix Anoa terbaru.

19. Visual refresh editorial (minim AI slop): satu aksen hijau rimba; gradien ungu-lime, glow, dan glassmorphism dihilangkan; tombol share seragam netral; banner literasi jadi kartu tinta; strip pelangi kartu diganti garis gunting putus-putus; ikon bottom nav diganti SVG garis; statistik tanpa emoji; onboarding tinta solid + aksen hijau; maskot lebih kecil dan tidak menumpuk onboarding; mode gelap ikut aksen hijau.

20. Perbaikan login Google (berlaku mobile & desktop): URL balikan OAuth (?code / #access_token / ?error) kini ditangani — muncul layar "Menyelesaikan masuk...", lalu otomatis masuk panel admin bila berhasil, atau kartu error yang jelas dengan tombol Coba lagi bila gagal (sebelumnya gagal diam-diam di beranda). Tombol Google memakai prompt pemilih akun agar tidak loop setelah logout, dan ada peringatan khusus bila situs dibuka dari peramban mini (Instagram/WhatsApp/dsb). Titik masuk tetap tersembunyi via ketuk logo, sesuai keputusan pengelola.

21. Cache service worker dinaikkan ke reichas-v63-login-oauth-fix agar semua perangkat mengambil perbaikan terbaru.

22. Polesan visual kekinian (v64, lapisan CSS paling akhir di index.html): tipografi dipertegas (text-wrap:balance pada judul, letter-spacing, ukuran judul artikel memakai clamp), mikro-interaksi pegas pada chip filter/bottom nav/kartu/tombol (cubic-bezier pegas + efek tekan saat disentuh), bayangan kartu kliping diperhalus tiga lapis, color-scheme light/dark agar scrollbar dan kontrol form ikut tema, kontras --ink2 dinaikkan dari #7D7A75 ke #6B6863, dan semua animasi baru otomatis mati bila prefers-reduced-motion aktif.

23. Materi outdoor baru di seed: m8 Packing Seimbang (aturan 20 persen), m9 Komunikasi Darurat Tanpa Sinyal, m10 Memilih Tempat Kemah yang Aman, m11 Tiga Simpul Wajib di Lapangan. Seed hanya tampil saat Supabase tidak terjangkau — untuk produksi jalankan materi-outdoor-v64.sql di SQL Editor Supabase, atau tambahkan lewat panel admin (Materi → tambah).

24. Cache service worker dinaikkan ke reichas-v64-visual-kekinian-mobile agar HP/PWA mengambil polesan terbaru.

25. Materi outdoor gelombang dua (m12–m19) — semuanya memakai kolom tautan sehingga tombol "Buka referensi" tampil di halaman detail materi. Sumber internasional: UIAA (panjat tebing), National Speleological Society (susur goa), American Canyoneering Association (susur sungai), American Whitewater Safety Code (jeram), NZ Mountain Safety Council (menyeberangi sungai), NOAA/National Weather Service (petir 30/30), Divers Alert Network (snorkeling & menyelam), RNLI (rip current di pantai). Untuk produksi jalankan materi-outdoor-v65.sql (sudah memuat m8–m19, menggantikan v64; aman diulang karena upsert).

26. Cache service worker dinaikkan ke reichas-v65-materi-outdoor-berlink.

27. Hiasan grafis onboarding mobile (v66): mata angin kompas SVG inline di area atas yang sebelumnya kosong — cincin skala hijau berputar pelan, jarum hijau berayun 45° setiap langkah slide, huruf arah U-T-S-B, dan koordinat Makassar (5°08′S 119°25′E) sebagai aksen editorial. Tanpa berkas gambar baru sehingga mode sinyal tipis tidak terbebani; animasi mati saat prefers-reduced-motion, dan hiasan disembunyikan di layar sangat pendek (max-height 540px).

28. Cache service worker dinaikkan ke reichas-v66-onboarding-mata-angin.

29. Splash mata angin (v67): setiap buka/reload menampilkan kompas ±1,3 detik lalu memudar otomatis (ketuk untuk lewati), wordmark KLIPING RCS.CBS. Ringan: SVG inline (variabel MPCOMPASS dipakai bersama splash & onboarding), nol permintaan jaringan, elemen dihapus dari DOM setelah memudar. Diskip saat balikan OAuth. Onboarding 3 langkah tetap hanya untuk pengguna baru.

30. Materi hewan liar (m20–m24), semua berlink sumber internasional: NPS 7 Ways (jarak aman saat bertemu hewan), Mayo Clinic (pertolongan pertama gigitan ular), Be Crocwise NT Australia (aturan tepi air di habitat buaya), NPS Bear Safety (mengamankan makanan dari monyet/babi hutan di kemah), NPS Wildlife Safety (saat hewan besar menyerang). Untuk produksi jalankan materi-outdoor-v68.sql (memuat m8–m24, menggantikan v65; aman diulang karena upsert).

31. Cache service worker dinaikkan ke reichas-v68-materi-hewan-liar.

32. Materi gelombang tiga (m25–m40, 16 materi): P3K lapangan (Stop the Bleed, Red Cross CPR, tandu darurat), tersesat & sinyal (STOP ala US Forest Service, sinyal 3x universal, PLB Cospas-Sarsat/NOAA), hewan lanjutan (tawon, rabies WHO, pacet ala NSW National Parks), cuaca & bencana tropis (heat stroke NWS, tsunami Ready.gov, kebakaran hutan Ready.gov), air & sanitasi kemah (CDC), plus dua materi pemula (Ten Essentials REI, Tiga T AdventureSmart). Untuk produksi jalankan materi-outdoor-v69.sql (memuat m8–m40, menggantikan v68; upsert aman diulang).

33. Cache service worker dinaikkan ke reichas-v69-materi-lengkap-40.

34. Rehat Sejenak (v70): dua gim dari proyek Pintu Angin dikloning ke folder rehat/ — FLYER (terbangkan logo melewati celah pegunungan) dan NGOPI (tangkap kopi dengan cangkir) — lengkap dengan halaman hub rehat/index.html bergaya editorial Kliping. Papan Rekor membaca localStorage: rekor terbaik (reichas_best, reichas_ngopi_best) plus riwayat 10 skor terakhir per gim (reichas_hist_flyer/ngopi, dicatat oleh suntikan kecil di kode game-over). Gim mandiri penuh (logo base64, audio WebAudio) sehingga nol berkas tambahan dan bisa dimainkan offline setelah dibuka sekali. Tautan masuk di footer situs. Setiap gim diberi tombol kembali ke Rehat Sejenak.

35. Perbaikan SW terkait halaman kedua: navigasi kini dicache per-URL (c.put(req)) bukan selalu ke "/" — sebelumnya membuka /rehat/ akan menimpa cache beranda. Cache dinaikkan ke reichas-v70-rehat-sejenak.

36. Papan Rekor Bersama (v71): Rehat Sejenak kini berjenjang dua — rekor perangkat (localStorage, offline) dan papan rekor bersama seluruh pembaca (tabel Supabase rehat_skor, publik tanpa akun). Pemain mengisi nama sekali sebelum main (input di layar mulai kedua gim, tersimpan di perangkat; bisa juga diatur dari halaman hub). Skor terkirim via REST Supabase langsung dari gim (tanpa library baru), gagal jaringan = diam-diam dilewati. RLS: select+insert publik, tanpa update/delete; CHECK membatasi game ('flyer'/'ngopi'), nama 1-24 karakter, skor 0-100000. Wajib: jalankan rehat-leaderboard.sql di SQL Editor Supabase.

37. Cache service worker dinaikkan ke reichas-v71-papan-rekor-bersama.

38. Percantik visual gim (v72), semuanya vektor canvas tanpa berkas baru: FLYER kini punya langit yang berubah siang ke senja seiring skor (matahari turun & memerah, bintang muncul), awan parallax, burung siluet jauh, pinus & garis rumput bergulir di garis tanah, dan vignette lembut. NGOPI kini berlatar kafe: lampu string berpendar, bokeh hangat, meja kayu tempat cangkir berdiri, dan uap mengepul dari kopi.

39. Cache service worker dinaikkan ke reichas-v72-visual-game-kafe.

40. Gim ketiga Rehat Sejenak: SUSUN LOGO (rehat/puzzle.html) — logo RCS.CBS HOPE (rehat/logo-puzzle.webp) dipotong 4x4; potongan tertukar DAN 5 di antaranya terputar 90–270°. Ketuk dua potongan untuk menukar, ketuk potongan terpilih untuk memutar. Skor murni kecepatan: 6000 − 30/detik − 8/tukar. Input nama sama seperti dua gim lain; masuk Papan Rekor Bersama sebagai game 'puzzle'. Hub menampilkan kartu ketiga + peringkat SUSUN.

41. Cache service worker dinaikkan ke reichas-v73-game-susun. Bila tabel rehat_skor sudah dibuat dari paket v71, jalankan ulang rehat-leaderboard.sql (kini memperluas batasan game ke 'puzzle' lewat alter table di bagian bawah).

42. Pintasan 🎮 Rehat Sejenak kini juga ada di menu dropdown header (fungsi _menuRehat, pola sama seperti Rak Baca/Panduan Darurat) — duduk di antara Bivak Rental dan Panduan Darurat, diberi aksen gradien violet (mi-rehat, ada varian mode gelap). Cache SW: reichas-v74-menu-rehat.
