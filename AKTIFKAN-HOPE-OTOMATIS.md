# Perpustakaan HOPE — aktivasi satu kali

Setelah aktif: unggah PDF ke folder buku yang sama; proses terjadwal membaca Google Drive API, membuat JPEG kecil bila thumbnail tidak tersedia, menyimpan hasilnya, dan menerbitkan katalog. HP pengunjung tidak memproses PDF hanya untuk menampilkan sampul.

**Status paket:** kode dan sampul awal sudah disiapkan. Sinkronisasi resmi belum berjalan sebelum dua Secrets di bawah diisi dan workflow pertama berhasil. Enam buku/sampul yang disertakan adalah snapshot migrasi, bukan bukti autentikasi Google sudah aktif.

## A. Pasang berkas tanpa merusak beranda

1. Ekstrak ZIP ke folder baru. Jangan unggah ZIP-nya langsung.
2. Buka ROOT repository `cecemeri48-beep/Kliping` di GitHub, bukan folder `api`.
3. Pilih Add file → Upload files. Seret **folder utuh** `.github`, `automation`, `api`, `library-data`, dan berkas root yang disertakan. Pertahankan semua jalur folder. Jangan hanya memilih isi subfolder lalu menaruhnya di root.
4. Pastikan pratinjau daftar upload memperlihatkan `api/perpustakaan.js`, `.github/workflows/hope-library-sync.yml`, `automation/sync_library.py`, dan `library-data/catalog.json`.
5. Timpa berkas yang sama lalu commit. Jangan membuat `perpustakaan (1).js` atau mengubah nama gambar.
6. Paket tidak berisi `index.html`, sehingga beranda Kliping tidak diganti. `vercel.json` mempertahankan route lama dan membundel katalog untuk fungsi server.

Jika menggunakan Git/GitHub Desktop, salin isi paket ke working tree, pertahankan struktur folder, periksa diff, commit, lalu push. Jangan menghapus berkas proyek lain.

## B. Buat akses Google yang hanya dapat membaca folder buku

1. Di [Google Cloud Console](https://console.cloud.google.com/), pilih/buat project dan aktifkan **Google Drive API** melalui APIs & Services → Library.
2. Buka IAM & Admin → Service Accounts → Create service account. Nama yang disarankan: `hope-library-reader`. Tidak perlu memberi role Owner/Editor pada project.
3. Pada akun layanan tersebut, buka Keys → Add key → Create new key → JSON. Unduh ke lokasi pribadi DI LUAR folder repository.
4. Salin alamat email akun layanan (`client_email`, bukan private key). Pada folder Drive buku yang sudah digunakan, pilih Share, tambahkan alamat akun layanan itu sebagai **Viewer**, bukan Editor.
5. Situs ini tetap perpustakaan publik. PDF yang akan ditampilkan harus bisa dibaca secara publik seperti sebelumnya. Proses memeriksa akses PDF tanpa login sebelum menerbitkan judul dan sampul. Jangan mencampur dokumen rahasia di folder ini.
6. GitHub repository → Settings → Secrets and variables → Actions → New repository secret:
   - **Name:** `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Secret:** seluruh isi file JSON akun layanan tadi.

Jangan kirim JSON/private key lewat chat, jangan unggah JSON tersebut ke repository, dan jangan memasangnya pada kode JavaScript browser. Scope yang dipakai proses hanya `drive.readonly`. Jika kebijakan organisasi melarang pembuatan key, jangan melonggarkan kebijakan; mintalah admin menyiapkan autentikasi yang disetujui (misalnya OIDC/Workload Identity Federation; memerlukan adaptasi konfigurasi).

Panduan autentikasi akun layanan: https://developers.google.com/identity/protocols/oauth2/service-account

## C. Siapkan pemicu penerbitan Vercel

1. Buka project Vercel `kliping` → Settings → Git → Deploy Hooks.
2. Buat hook bernama `hope-library-sync` untuk branch **`main`** (branch production repository ini).
3. Salin URL hook ke GitHub repository → Settings → Secrets and variables → Actions → New repository secret:
   - **Name:** `VERCEL_DEPLOY_HOOK`
   - **Secret:** URL Deploy Hook Vercel.

URL hook adalah rahasia; jangan masukkan ke berkas publik atau chat. Tidak perlu memberi Google key kepada Vercel. Deploy Hook menerima POST untuk membuat deployment: https://vercel.com/docs/deploy-hooks

## D. Jalankan pertama kali

1. Buka tab **Actions** di GitHub; aktifkan Actions pada repository jika sebelumnya belum aktif dan kebijakan akun mengizinkan.
2. Pilih workflow **Perpustakaan HOPE - Sinkronisasi** → Run workflow → branch `main`. Biarkan opsi Force tidak dicentang untuk penggunaan biasa.
3. Pada Settings → Actions → General → Workflow permissions, proses memerlukan izin menulis isi repository (`contents: write`) dan membaca status workflow (`actions: read`). Jika kebijakan organisasi/branch protection menolak push, minta pemilik repository memberikan akses bot yang sesuai. Jangan menonaktifkan perlindungan branch secara sembarangan.
4. Tunggu workflow hijau, lalu tunggu deployment Vercel terbaru berstatus **Ready**. Workflow hijau berarti proses dan permintaan deploy berhasil; status Ready tetap perlu diperiksa pada Vercel.
5. Buka perpustakaan, tekan Perbarui. Pesan bahwa otomatisasi belum aktif seharusnya hilang setelah katalog pertama dari Drive API diterbitkan.

**Hasil yang perlu diperiksa:** katalog tetap memuat buku lama; Filosofi Teras memiliki sampul; buku baru muncul; tombol Bagikan menghasilkan `/buku/ID?v=...` dengan versi per buku. Buka tautan baru untuk mencoba WhatsApp. Pesan WA lama tidak otomatis diperbarui.

## Setelah aktivasi

- Unggah PDF langsung ke folder yang sama. Tidak perlu lagi membuat/unggah JPG manual untuk PDF yang berhasil diproses.
- Jadwal disetel sekitar **30 menit**, pada menit 13 dan 43 setiap jam (UTC). Ditambah waktu pemrosesan, deployment, dan pemeriksaan ulang halaman. Tombol Perbarui membaca katalog yang sudah diterbitkan; tidak memulai pemrosesan GitHub.
- Untuk memeriksa lebih cepat, pilih Run workflow di GitHub. Jadwal GitHub bersifat best effort: dapat terlambat, dan jadwal repository publik yang tidak aktif bisa dinonaktifkan. Periksa tab Actions jika pembaruan berhenti. Dokumentasi: https://docs.github.com/en/actions/reference/events-that-trigger-workflows#schedule
- Sampul siap disajikan langsung sebagai JPEG statis dari CDN, bukan mengambil thumbnail eksternal setiap kali orang membuka katalog.
- PDF berubah → sumber diperiksa ulang; sampul baru mendapat nama berbasis hash isi. Versi tautan berbagi ikut berubah jika judul, sampul, atau status berubah.
- Daftar Drive dibaca sampai semua halaman hasil API selesai. Pembacaan daftar yang gagal/tidak lengkap tidak menghapus katalog lama.
- Sampul yang gagal memiliki backoff, lalu dicoba lagi otomatis. PDF berpassword/rusak atau yang dilarang diunduh tidak bisa dijamin berhasil; statusnya ditampilkan tanpa merusak tombol baca buku lain.
- Per sekali proses: paling banyak 8 sampul baru/ulang, sekitar 300 MiB unduhan PDF total, maksimal 120 MiB per PDF, dan batas waktu kerja sekitar 14 menit. Sisanya mengantre pada jadwal berikutnya. Nilai ada di `automation/library-config.json`.
- Proses hanya menyimpan JPEG dan metadata, tidak menyimpan PDF koleksi di GitHub. Sampul lama dipertahankan maksimal dua revisi per buku untuk mengurangi tautan rusak; sampul buku yang tidak lagi dipublikasikan dibuang dari versi repository terbaru.
- Repository dan sampulnya publik. Menghapus file tidak menjamin salinan di histori Git/CDN/pesan orang lain ikut terhapus. Jangan memakai alur ini untuk dokumen rahasia.
- Tanpa perubahan, tidak ada pemrosesan ulang sampul atau deployment berulang; metadata diperbarui sekurangnya sekali sehari untuk pemeriksaan kesegaran. Biaya/kuota GitHub Actions, Vercel, dan Google tetap mengikuti akun masing-masing.
- Baca, Bagikan, tanda Diskusi lokal, dan narator lama dipertahankan. Narator masih bergantung suara Indonesia di perangkat, maksimal PDF 80 MiB pada endpoint audio lama, dan belum dijamin berlanjut saat layar dikunci.
- Subfolder, EPUB, dan shortcut tidak disertakan: sumber adalah PDF langsung di folder yang sudah ditetapkan.

## Jika ada kegagalan

| Gejala | Pemeriksaan |
| --- | --- |
| Actions meminta Secret | Pastikan kedua nama di atas tepat dan nilainya di Repository Secrets, bukan berkas kode. |
| Google 401/403 | Periksa Drive API aktif, key masih berlaku, serta email akun layanan diberi Viewer pada folder. |
| Buku tertentu tidak masuk | Pastikan PDF langsung di folder, tidak dihapus/shortcut, dan dapat dibaca tanpa login. |
| Sampul mengantre | Tunggu jadwal berikutnya; batas jumlah/ukuran mencegah pemrosesan membebani runner. |
| Sampul gagal | Lihat ringkasan Actions; periksa password/kerusakan/izin unduh file. Tidak perlu mengunggah JPG manual untuk kegagalan sementara. |
| Push bot ditolak | Periksa Workflow permissions dan kebijakan branch; tidak ada force-push di workflow. |
| Hook deployment gagal | Katalog mungkin sudah tersimpan di GitHub. Workflow berikutnya memeriksa kegagalan sebelumnya untuk mencoba deploy ulang; Run workflow manual juga memicu deploy. |
| Vercel Build Failed | Buka error pertama pada deployment terbaru. Jangan mengubah file lain sebelum penyebabnya diketahui. |
| Sampul WA belum berubah | Kirim tautan versi terbaru lewat Bagikan; cache, pengaturan, dan jaringan WhatsApp masih dapat memengaruhi hasil. |

## Pengujian paket

- Uji otomatis pemroses: thumbnail lebih dulu, fallback render PDF nyata, file berubah, force dengan gambar berbeda, judul berubah, antrean, retry/backoff, file tidak publik, kegagalan daftar, ukuran terlalu besar, dan pagination 125 item.
- Uji renderer terhadap Filosofi Teras sekitar 72 MB: berhasil menghasilkan JPEG 600 × 850 sekitar 95 KB tanpa menyimpan PDF dalam output katalog.
- Uji API/HTML metadata tanpa JavaScript, keenam JPEG statis, tautan berbagi berbasis revisi, baca/tutup, pencarian/tanda diskusi, keadaan mengantre/gagal, serta layar 320/390/1280 px.
- Penelusuran katalog lokal tidak mengirim permintaan ke Google Drive atau memuat modul PDF/OCR.
- Belum ada uji autentikasi Drive API dengan kredensial akunmu, eksekusi workflow pada repositorymu, deployment produksi paket ini, atau pengiriman WhatsApp fisik. Itu baru dapat diverifikasi setelah aktivasi.
