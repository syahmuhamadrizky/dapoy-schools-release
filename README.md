# 🎓 Dapoy Schools

**Dapoy Schools** adalah platform sistem informasi dan manajemen operasional sekolah generasi baru. Dibangun dengan desain antarmuka *Glassmorphism* yang modern, dukungan Mode Gelap (Dark Mode), dan performa kilat, aplikasi ini dirancang khusus untuk memenuhi segala kebutuhan digitalisasi sekolah masa kini—mulai dari penerimaan siswa baru, absensi, hingga publikasi mading digital.

---

## ✨ Fitur Unggulan

Dapoy Schools hadir dengan segudang fitur *All-in-One* yang dibagi menjadi beberapa modul utama:

### 1. 🛡️ Sistem Lisensi & Keamanan Terpusat
- **Proteksi Hardware (HWID):** Lisensi aplikasi terkunci pada spesifikasi perangkat secara otomatis untuk mencegah pembajakan.
- **Sistem *Free Trial*:** Pengalaman uji coba gratis selama 2 Jam secara otomatis pada instalasi pertama sebelum aplikasi terkunci.
- **Integrasi Dapoy Hub:** Sinkronisasi langsung dengan `hub.dapoy.net` untuk aktivasi *License Key* secara instan.

### 2. 📝 Sistem Penerimaan Murid Baru (SPMB)
- Panel Pendaftaran Mandiri.
- Manajemen Status Pendaftar (Pending, Diterima, Ditolak).
- Verifikasi Dokumen & Konversi pendaftar yang lulus menjadi Siswa Aktif dengan satu klik.

### 3. 👥 Manajemen Data Siswa & Pegawai
- **Database Siswa Terpadu:** Sistem pencarian *real-time*, filter by kelas/rombel, dan profil detail siswa.
- **ID Card Digital:** Kemampuan mencetak Kartu Tanda Pelajar lengkap dengan Barcode/QR-Code.
- **Manajemen Staf:** Pendataan Guru & Tenaga Kependidikan dengan hak akses berjenjang (Roles).

### 4. 📅 Akademik & Operasional
- **Presensi Digital (Absensi):** Rekap kehadiran siswa harian dengan mudah.
- **Jadwal Pelajaran:** Tata kelola mata pelajaran dan pengingat kelas.
- **Manajemen Kelas/Rombel:** Pemetaan siswa ke dalam rombongan belajar secara terstruktur.
- **Kegiatan Ekstrakurikuler:** Pendataan kegiatan luar jam sekolah dan partisipasi siswa.

### 5. 📢 Mading Digital & Publikasi
- **Pengumuman Resmi:** Panel *broadcast* pengumuman untuk seluruh warga sekolah.
- **Blog Sekolah:** Platform *Blogging* internal untuk mempublikasikan karya tulis, berita, maupun prestasi sekolah.
- **Galeri Foto:** Penyimpanan dokumentasi dan memori kegiatan sekolah.

### 6. ⚙️ Kemudahan Tambahan (Utility)
- **Tautan Cepat (Quick Links):** Kumpulkan URL layanan penting seperti Dapodik, e-Rapor, BOS, dll dalam satu halaman yang mudah diakses *staff*.
- **Live Clock:** Fitur penunjuk jam *real-time* dengan estetika tinggi di panel admin.
- **Pengaturan Aplikasi Ekstensif:** Kustomisasi Logo Sekolah, Nama Lembaga, Data Kontak, Tema, dll tanpa perlu menyentuh *coding*.

---

## 💻 Kebutuhan Sistem
- **Sistem Operasi:** Windows / Linux / macOS
- **Engine:** Node.js versi 18 atau lebih baru.
- **Database:** MySQL / MariaDB (Direkomendasikan menggunakan XAMPP atau Laragon).
- Akses Internet (Hanya saat proses pengecekan Lisensi / Aktivasi awal).

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

1. **Clone & Install Dependensi**
   ```bash
   git clone https://github.com/syahmuhamadrizky/dapoy-schools.git
   cd dapoy-schools
   npm install
   ```

2. **Jalankan Aplikasi (Mode Development)**
   ```bash
   npm run dev
   # Atau cukup klik ganda pada file start_dev.bat (Windows)
   ```

3. **Jalankan Aplikasi (Mode Portable / Produksi)**
   ```bash
   npm run build
   # Kemudian jalankan:
   node server.js
   # Atau cukup klik ganda pada file start_dapoy_schools.bat (Windows)
   ```

---

## 🔑 Panduan Aktivasi Aplikasi

Ketika Dapoy Schools pertama kali dihidupkan, aplikasi akan masuk ke Mode Uji Coba (*Free Trial*).

**Cara Mengaktifkan Lisensi Penuh:**
1. Ketika masa uji coba habis (atau jika Anda ingin langsung aktivasi), layar akan otomatis terkunci.
2. Hubungi Admin (tombol WhatsApp tersedia di layar Lock Screen).
3. Anda akan diberikan *License Key* (contoh: `DSC-ABCDE-12345`).
4. Masukkan kunci tersebut di formulir aktivasi.
5. Selesai! Aplikasi akan terhubung ke Dapoy Hub, mencatat Hardware ID Anda, dan terbuka secara permanen.

---
**Hak Cipta © 2026 SMR** - [Dapoy.net](https://dapoy.net)
*Dapoy Schools - Transformasi Digital Pendidikan yang Sesungguhnya.*
