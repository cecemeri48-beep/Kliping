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

19. Visual refresh editorial (minim AI slop): satu aksen hijau rimba, semua gradien ungu-lime & glow dihilangkan; tombol share seragam netral; banner literasi jadi kartu tinta; strip pelangi kartu diganti garis gunting putus-putus; ikon bottom nav diganti SVG garis (emoji dihilangkan); statistik tanpa emoji; onboarding tinta solid + aksen hijau; maskot lebih kecil, gelembung tidak terpotong, dan tidak menumpuk layar onboarding; mode gelap ikut aksen hijau.

20. Cache service worker dinaikkan ke reichas-v62-visual-editorial agar HP/PWA mengambil visual refresh terbaru.
