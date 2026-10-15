PERPUSTAKAAN KLIPING: DRIVE SAJA

Folder sumber:
https://drive.google.com/drive/folders/1FsGEVM_KRcCyu43tEDwQPn1CrNugDKdA

PUSH HANYA BERKAS DALAM PAKET INI. Paket TIDAK menyertakan index.html beranda atau vercel.json, jadi beranda Kliping tidak diganti.

DI ROOT REPOSITORI:
- perpustakaan.html (halaman Perpustakaan, dibuka sebagai /perpustakaan karena cleanUrls:true)
- library.css
- library.js
- sw.js (versi cache baru, endpoint /api/ tidak dicache)
- README-DRIVE.txt

DI FOLDER api YANG SUDAH ADA:
- api/perpustakaan.js

PENTING UNTUK GITHUB WEB: perpustakaan.js HARUS berada di api/perpustakaan.js, bukan di root. Bila pengunggahan folder tidak mempertahankan struktur, buka folder api di GitHub dahulu lalu unggah perpustakaan.js ke sana. File halaman bernama perpustakaan.html, bukan index.html. Commit dan tunggu deployment selesai.

FITUR
- Hanya PDF langsung di folder Drive sumber, tidak ada daftar WeLib atau koleksi IndexedDB.
- Kartu tiap buku dengan thumbnail halaman pertama dari Drive (judul menjadi fallback jika gambar tidak dapat dimuat).
- Pratinjau di dialog melalui pembaca Drive tertanam.
- Tombol unduh menuju Google Drive. Google dapat meminta konfirmasi unduhan, menerapkan kuota, atau meminta login sesuai izin. Aplikasi tidak memintas batas tersebut.
- Daftar dibaca saat halaman dibuka, ketika kembali ke tab, setiap 5 menit selama tab terlihat, dan ketika Perbarui koleksi ditekan. Bukan job background terjadwal; tidak memperbarui apa pun ketika halaman tidak dibuka.
- Metadata server memiliki cache CDN 60 detik. Pemeriksaan manual memakai URL baru. Tidak perlu push ulang ketika PDF ditambah/dihapus dari folder yang sama.
- Hanya metadata dikirim oleh server, tidak menyalin atau menyimpan PDF ke Kliping.

PENGELOLAAN BUKU
1. Upload PDF yang kamu miliki hak/izin untuk bagikan ke folder sumber.
2. Pastikan folder dan file dapat dilihat oleh siapa saja yang memiliki link. File yang dibatasi sendiri mungkin tidak dapat dipratinjau/diunduh pengunjung.
3. Gunakan nama file yang jelas (judul -- penulis.pdf). Judul katalog berasal dari nama file, bukan metadata isi PDF.
4. Simpan langsung dalam folder sumber. Subfolder, shortcut, EPUB dan format non-PDF belum didukung. Bahasa tidak dideteksi otomatis; kurasi bahasa Indonesia dilakukan pengelola folder.
5. Hapus/pindahkan file dari folder untuk mengeluarkannya dari daftar pada pemeriksaan selanjutnya.

BATAS TEKNIS
Versi tanpa kredensial ini membaca metadata halaman folder Drive publik, bukan Google Drive API resmi. Telah diuji pada dua PDF saat paket dibuat. Bila Google mengubah format halaman, membatasi akses server, atau memakai pagination, aplikasi menampilkan kegagalan, bukan mengklaim daftar kosong/komplet. Untuk folder yang mencapai 50 item atau lebih atau terdeteksi berpaginasi, daftar publik ditolak agar tidak menampilkan koleksi parsial sebagai seluruh koleksi. Integrasi Drive resmi dengan pagination diperlukan untuk skala tersebut. Tidak ada akses untuk folder privat dan tidak ada trik melewati izin Google.

Jangan hapus seluruh data browser untuk migrasi ini: koleksi lokal lama tidak lagi ditampilkan, tetapi PDF lama masih ada pada IndexedDB jika pernah disimpan. Simpan salinannya terlebih dahulu sebelum membersihkan data situs. Berkas PDF.js versi sebelumnya boleh dibiarkan; versi Drive ini tidak menggunakannya.

PENGUJIAN
Endpoint live membaca dua PDF dari folder. Thumbnail kedua PDF dan halaman preview memberi respons 200. Pratinjau buku pertama diperiksa dalam browser. Pencarian, hasil kosong, penutupan pembaca, refresh setelah simulasi penghapusan, error awal, penggunaan daftar terakhir saat error, interval 5 menit, dan layout 390/1280 px diuji lokal. Paket belum dipasang ke situs live.
