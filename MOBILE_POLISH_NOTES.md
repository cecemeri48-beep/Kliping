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

22. Polesan visual kekinian (v64, lapisan CSS paling akhir): tipografi dipertegas (text-wrap:balance, letter-spacing, judul artikel pakai clamp), mikro-interaksi pegas pada chip/bottom nav/kartu/tombol, bayangan kartu tiga lapis, color-scheme light/dark, kontras --ink2 dinaikkan ke #6B6863, semua animasi mati saat prefers-reduced-motion.

23. Materi outdoor gelombang satu: m8 Packing Seimbang (aturan 20 persen), m9 Komunikasi Darurat Tanpa Sinyal, m10 Memilih Tempat Kemah, m11 Tiga Simpul Wajib.

24. Materi outdoor gelombang dua berlink (m12–m19), memakai kolom tautan sehingga tombol "Buka referensi" tampil di halaman detail: UIAA (panjat), National Speleological Society (goa), American Canyoneering Association (susur sungai), American Whitewater (jeram), NZ Mountain Safety Council (menyeberangi sungai), NOAA/NWS (petir 30/30), Divers Alert Network (selam), RNLI (rip current). Untuk produksi jalankan materi-outdoor-v65.sql (memuat m8–m19, aman diulang karena upsert).

25. Hiasan onboarding mobile (v66): mata angin kompas SVG inline di area atas yang kosong — cincin skala berputar pelan, jarum berayun 45° per langkah slide, huruf U-T-S-B, koordinat Makassar. Tanpa berkas gambar baru; disembunyikan di layar ≤540px tinggi.

26. Splash mata angin (v67): tampil setiap buka/reload ±1,3 detik lalu memudar (ketuk untuk lewati), wordmark KLIPING RCS.CBS. Ringan: SVG inline (variabel MPCOMPASS dipakai bersama splash & onboarding), nol permintaan jaringan baru, elemen dihapus dari DOM setelah memudar. Diskip saat balikan OAuth (?code/#access_token/?error). Onboarding 3 langkah tetap hanya untuk pengguna baru.

27. Cache service worker dinaikkan ke reichas-v67-splash-kompas-ringan.
