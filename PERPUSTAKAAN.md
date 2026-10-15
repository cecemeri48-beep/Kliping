# Perpustakaan Kliping

Buka `/perpustakaan/` atau gunakan menu Perpustakaan di halaman Kliping. Unggah seluruh folder ini ke hosting Kliping seperti biasa; versi ini belum dipasang ke situs live.

## Fitur
- Katalog awal 3 buku berbahasa Indonesia: Filosofi Teras; Fatamorgana: Catatan Pendakian Gunung Semeru Desember 2012; Burung: Jalur Pendakian Taman Nasional Gunung Rinjani.
- Cari judul/penulis/topik dan filter kategori/ketersediaan.
- Pratinjau metadata tanpa keluar dari Kliping.
- Tambah atau pasangkan PDF berizin, baca dengan PDF.js tertanam, unduh langsung, dan hapus dari perangkat.
- IndexedDB menyimpan koleksi pribadi di browser. Tidak memerlukan akun atau layanan tambahan.

## Batasan penting
Tidak ada PDF dari WeLib yang disalin atau disertakan. Tautan WeLib adalah halaman metadata, bukan endpoint PDF terverifikasi. Tombol baca/unduh PDF hanya aktif sesudah pengguna menambahkan PDF miliknya atau yang berizin. PDF.js dibundel lokal agar pratinjau bekerja tanpa pembaca PDF bawaan browser. PDF yang terkunci, rusak, atau memakai fitur tidak didukung dapat diunduh untuk dibuka dengan aplikasi PDF lain.

PDF hanya ada pada perangkat/browser dan origin yang dipakai ketika menambahkan file. Menghapus data situs atau menggunakan mode privat bisa menghilangkan koleksi; simpan salinan asli. Koleksi tidak otomatis dibagikan ke pengunjung lain dan tidak tersinkron antarperangkat. Untuk perpustakaan bersama diperlukan penyimpanan server serta autentikasi dan izin penerbitan file.

Jalankan melalui HTTPS (hosting) atau localhost untuk pengujian; jangan mengandalkan membuka langsung lewat file://. Maksimum satu PDF 30 MB. Situs tidak memindai keamanan isi PDF; gunakan file tepercaya.

## Data awal
Metadata diperiksa pada 15 Oktober 2026. Tahun mengikuti metadata WeLib, tidak diklaim sebagai tahun cetakan pertama. Kategori dan topik adalah kurasi Kliping. Deskripsi tidak mengklaim hasil pembacaan isi buku.

- https://id.welib.st/md5/9c584eb98c8c17515800ec05106819f7
- https://id.welib.st/md5/ad5626468dcbbc8d29c92a5e52db18c7
- https://id.welib.st/md5/e79418ba81344efd2fb0643fdfb61fe7

Tidak ada scraping otomatis, proxy unduhan, atau mekanisme melewati batas baca situs sumber. PDF.js 4.10.38 (Apache-2.0) disertakan dalam perpustakaan/vendor beserta lisensinya. Service worker dinaikkan versi dan memuat aset perpustakaan untuk katalog luring.

## Pengujian versi awal
Pencarian/filter kategori, kondisi hasil kosong/reset, tambah PDF uji, render halaman PDF.js, unduh, penyimpanan setelah reload, dan hapus PDF lulus uji lokal Chromium. Tampilan desktop 1280 px dan ponsel 390 px diperiksa. PDF uji tidak disertakan dalam koleksi atau paket.
