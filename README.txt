CARA MEMASANG 2 KLIPING CONTOH + ADMIN CECE MERI (JALUR SQL)
============================================================

Situs Anda masuk lewat Google, jadi tidak ada kata sandi yang bisa
dipakai halaman impor. Jalur ini tidak butuh login sama sekali.

LANGKAH 1 — JALANKAN SQL
1. Buka Supabase Dashboard proyek Anda.
2. Masuk ke SQL Editor -> New query.
3. Tempel SELURUH isi file seed.sql, lalu klik Run.
4. Bagian hasil (Results) harus menampilkan:
   - 2 baris kliping: contoh-17agustus-gunung dan contoh-ppgd-gunung
     (status Terbit, kurator u-cecemeri)
   - 1 baris profil: Cece Meri, peran Admin

LANGKAH 2 — PASANG GAMBAR KLIPING
SQL tidak bisa mengunggah gambar, jadi gambar dipasang lewat aplikasi
(alur yang sudah terbukti berhasil di situs Anda):
1. Buka panel admin -> Kliping -> Sunting kliping "Pendakian massal
   17 Agustus...".
2. Di bagian gambar, unggah file gambar/contoh-17agustus.jpg, simpan.
3. Ulangi untuk kliping PPGD dengan gambar/contoh-ppgd.jpg.
   (Kedua gambar 1200x630, di bawah 300 KB — aman untuk thumbnail WA.)

SELESAI
- Kedua kliping langsung tampil di Papan Kliping dengan status Terbit,
  kurator Cece Meri.
- Aman dijalankan ulang: seed.sql memakai upsert, tidak membuat dobel.
- Agar Cece Meri bisa masuk panel: cukup daftarkan emailnya di tabel
  profiles (sudah dibuat oleh seed.sql), lalu dia masuk lewat tombol
  Google dengan email cecemeri48@gmail.com — sama seperti akun lain.

BERSIH-BERSIH REPO
Hapus dari GitHub: impor-kliping.html, README-impor.txt, dan folder
gambar/ hasil upload sebelumnya — halaman impor tidak dipakai lagi dan
tidak perlu tayang publik.
