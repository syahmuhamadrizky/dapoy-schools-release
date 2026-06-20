# Dapoy Schools

**Dapoy Schools** adalah aplikasi manajemen sekolah terpadu berbasis web yang dirancang dengan antarmuka modern (Glassmorphism & Mode Gelap/Terang) dan berfokus pada kecepatan dan kemudahan akses data operasional.

![Dapoy Schools](public/dapoy-schools.png)

## Fitur Utama

- **Sistem Lisensi & Aktivasi**: Terintegrasi langsung dengan `hub.dapoy.net` untuk memvalidasi *Hardware ID* dan status *Trial* secara otomatis.
- **Sistem Penerimaan Murid Baru (SPMB)**: Kelola pendaftaran murid baru dengan mudah menggunakan panel khusus.
- **Manajemen Data Siswa Terpusat**: Tambah, edit, dan pantau status siswa lengkap dengan fitur pencarian interaktif.
- **Tautan Cepat (Quick Links)**: Menu navigasi khusus untuk mengakses situs-situs eksternal penting operasional sekolah.
- **Live Clock & Dashboard Intuitif**: Tampilan waktu langsung di layar admin, dengan desain UI interaktif untuk kenyamanan maksimal.

## Kebutuhan Sistem
- **Node.js** versi 18 atau yang lebih baru.
- Akses internet aktif (diperlukan untuk verifikasi lisensi dan aktivasi).
- SQLite3 (sudah terpaket sebagai penyimpanan *database* lokal `database.sqlite`).

## Panduan Instalasi & Menjalankan Aplikasi

1. **Clone & Install Dependensi**
   ```bash
   git clone https://github.com/syahmuhamadrizky/dapoy-schools.git
   cd dapoy-schools
   npm install
   ```

2. **Jalankan Aplikasi (Mode Development)**
   ```bash
   npm run dev
   # Atau bisa klik file start_dev.bat
   ```

3. **Jalankan Aplikasi (Mode Portable / Produksi)**
   ```bash
   npm run build
   # Kemudian jalankan:
   node server.js
   # Atau bisa klik file start-portable Elearning.bat
   ```

## Proses Aktivasi & Lisensi

Ketika aplikasi baru di-*install* dan dijalankan pertama kali, Dapoy Schools akan memberikan **Masa Percobaan Gratis (Free Trial) selama 2 Jam**. 

Selama masa percobaan, aplikasi berfungsi secara penuh namun akan muncul *banner* peringatan oranye. Jika waktu trial habis (atau jika lisensi ditolak oleh server Dapoy Hub), layar administrasi akan otomatis terkunci *(Lock Screen)*.

**Cara Mengaktifkan:**
1. Hubungi Admin (via WhatsApp yang tertera di layar).
2. Dapatkan *License Key* yang berawalan `DSC-XXXXX...`.
3. Masukkan kunci lisensi di formulir aktivasi.
4. Sistem akan secara otomatis mengikat ID perangkat (*Hardware ID*) Anda ke lisensi tersebut dan membuka kunci aplikasi secara permanen atau hingga masa aktif lisensi Anda habis.

---
Dikembangkan oleh **SMR** - [Dapoy.net](https://dapoy.net)
