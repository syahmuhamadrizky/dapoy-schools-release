var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_promise = __toESM(require("mysql2/promise"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_os = __toESM(require("os"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import_dotenv.default.config();
var isLicenseValid = true;
var licenseTimer = null;
var isExpired = false;
function getHwid() {
  try {
    const interfaces = import_os.default.networkInterfaces() || {};
    let mac = "";
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      for (const i of iface) {
        if (!i.internal && i.mac && i.mac !== "00:00:00:00:00:00") {
          mac = i.mac;
          break;
        }
      }
      if (mac) break;
    }
    const cpus = import_os.default.cpus() || [];
    const cpuInfo = cpus.length > 0 ? cpus[0].model : "unknown-cpu";
    const platform = import_os.default.platform() || "unknown-platform";
    const raw = `${mac}-${cpuInfo}-${platform}`;
    return import_crypto.default.createHash("sha256").update(raw).digest("hex").substring(0, 16).toUpperCase();
  } catch (err) {
    const raw = `cpanel-fallback-${import_os.default.hostname ? import_os.default.hostname() : "unknown"}`;
    return import_crypto.default.createHash("sha256").update(raw).digest("hex").substring(0, 16).toUpperCase();
  }
}
function updateEnv(key, value) {
  const envPath = import_path.default.join(process.cwd(), ".env");
  let envContent = "";
  if (import_fs.default.existsSync(envPath)) {
    envContent = import_fs.default.readFileSync(envPath, "utf8");
  }
  const regex = new RegExp(`^${key}=.*`, "m");
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `
${key}=${value}`;
  }
  import_fs.default.writeFileSync(envPath, envContent.trim() + "\n");
  process.env[key] = value;
}
async function verifyLicenseOnBoot() {
  let licenseKey = process.env.LICENSE_KEY || "";
  let hwid = getHwid();
  const hubServerUrl = "https://hub.dapoy.net";
  if (licenseKey) {
    try {
      const res = await fetch(`${hubServerUrl}/api/verify-license`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_key: licenseKey,
          hardware_id: hwid,
          app_name: "Dapoy Schools"
        })
      });
      const data = await res.json();
      if (data.valid) {
        isLicenseValid = true;
        isExpired = false;
        console.log(`[LICENSE] Valid. Activated for: ${data.client_name || "Client"}`);
        if (licenseTimer) clearInterval(licenseTimer);
        licenseTimer = setInterval(verifyLicenseOnBoot, 60 * 60 * 1e3);
      } else {
        console.log(`[LICENSE] Invalid: ${data.error}`);
        isLicenseValid = false;
        checkFreeTrial();
      }
    } catch (err) {
      console.log(`[LICENSE] Failed to contact Hub Server (${err.message}). Retrying later.`);
      isLicenseValid = false;
      checkFreeTrial();
    }
  } else {
    isLicenseValid = false;
    checkFreeTrial();
  }
}
async function checkFreeTrial() {
  let envContent = "";
  const envPath = import_path.default.join(process.cwd(), ".env");
  if (import_fs.default.existsSync(envPath)) {
    envContent = import_fs.default.readFileSync(envPath, "utf8");
  }
  if (!envContent.includes("FREE_TRIAL_START=")) {
    const startTime = Date.now();
    updateEnv("FREE_TRIAL_START", startTime.toString());
  }
  const trialStartStr = process.env.FREE_TRIAL_START;
  if (trialStartStr) {
    const trialStart = parseInt(trialStartStr);
    const now = Date.now();
    const twoHours = 5 * 24 * 60 * 60 * 1e3;
    if (now - trialStart > twoHours) {
      isExpired = true;
      console.log(`[LICENSE] Waktu Versi Free (5 Hari) telah habis. Harap aktivasi lisensi.`);
    } else {
      isExpired = false;
      const remaining = Math.round((twoHours - (now - trialStart)) / 6e4);
      console.log(`[LICENSE] Versi Free berjalan. Sisa waktu: ${remaining} menit.`);
      setTimeout(verifyLicenseOnBoot, twoHours - (now - trialStart) + 1e3);
    }
  }
}
var app = (0, import_express.default)();
app.get("/api/_test", (req, res) => {
  res.json({ ok: true, mode: process.env.NODE_ENV });
});
app.use(import_express.default.json({ limit: "10mb" }));
var PORT = process.env.PORT || 5001;
var JWT_SECRET = process.env.JWT_SECRET || "default-secret-do-not-use-in-production";
var uploadDir = import_path.default.join(process.cwd(), "uploads");
try {
  const dirsToCreate = [
    uploadDir,
    import_path.default.join(uploadDir, "profiles"),
    import_path.default.join(uploadDir, "profiles", "siswa"),
    import_path.default.join(uploadDir, "profiles", "pegawai"),
    import_path.default.join(uploadDir, "documents")
  ];
  for (const dir of dirsToCreate) {
    if (!import_fs.default.existsSync(dir)) {
      import_fs.default.mkdirSync(dir, { recursive: true });
    }
  }
} catch (e) {
  console.error("Failed to create uploads directory. Make sure permissions are correct:", e);
}
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + import_path.default.extname(file.originalname));
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB limit
});
function generateSEOTags(title, content = "") {
  const text = (title + " " + content).replace(/<[^>]*>?/gm, " ").toLowerCase();
  const stopWords = ["di", "ke", "dari", "yang", "dan", "atau", "ini", "itu", "pada", "dalam", "dengan", "untuk", "sebagai", "adalah", "ialah", "merupakan", "oleh", "kepada", "bagi", "sebab", "karena", "bisa", "dapat", "sudah", "telah", "akan", "ingin", "harus"];
  const words = text.match(/[a-z0-9]+/g) || [];
  const keywords = words.filter((word) => word.length > 3 && !stopWords.includes(word));
  const uniqueKeywords = [...new Set(keywords)].slice(0, 15);
  return uniqueKeywords.join(", ");
}
var uploadProfile = (0, import_multer.default)({
  storage: import_multer.default.diskStorage({
    destination: (req, file, cb) => cb(null, import_path.default.join(uploadDir, "profiles")),
    filename: (req, file, cb) => cb(null, "profile-" + Date.now() + import_path.default.extname(file.originalname))
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});
app.use(import_express.default.json({ limit: "50mb" }));
app.use((req, res, next) => {
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use("/uploads", import_express.default.static(uploadDir));
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/hwid", (req, res) => {
  res.json({ hwid: getHwid() });
});
app.get("/api/license-status", async (req, res) => {
  let status = "trial";
  let trialEndsAt = null;
  if (process.env.LICENSE_KEY) {
    status = "registered";
  } else {
    if (!process.env.FREE_TRIAL_START) {
      await checkFreeTrial();
    }
    const trialStartStr = process.env.FREE_TRIAL_START;
    if (trialStartStr) {
      const trialStart = parseInt(trialStartStr);
      const twoHours = 5 * 24 * 60 * 60 * 1e3;
      trialEndsAt = trialStart + twoHours;
      if (Date.now() > trialEndsAt) {
        status = "expired";
      }
    }
  }
  res.json({ status, trialEndsAt, hwid: getHwid(), isLicenseValid, isExpired });
});
app.post("/api/sync/siswa", async (req, res) => {
  try {
    const { token, data } = req.body;
    if (!token) return res.status(401).json({ success: false, message: "Token missing" });
    const [settingsRows] = await pool.query("SELECT sync_token FROM pengaturan_sekolah LIMIT 1");
    if (!settingsRows || settingsRows.length === 0 || settingsRows[0].sync_token !== token || !token.startsWith("dapoy-")) {
      return res.status(403).json({ success: false, message: "Invalid API token" });
    }
    if (!data || !data.siswa) {
      return res.status(400).json({ success: false, message: "Data siswa is missing" });
    }
    const [existingStudents] = await pool.query("SELECT id, nisn, nipd, nik, tahun_pelajaran, semester, rombel FROM siswa");
    const mapById = /* @__PURE__ */ new Map();
    const mapByNisn = /* @__PURE__ */ new Map();
    const mapByNipd = /* @__PURE__ */ new Map();
    const mapByNik = /* @__PURE__ */ new Map();
    for (const s of existingStudents) {
      mapById.set(s.id, s);
      if (s.nisn && s.nisn.trim() && s.nisn.trim() !== "-") mapByNisn.set(s.nisn.trim(), s.id);
      if (s.nipd && s.nipd.trim() && s.nipd.trim() !== "-") mapByNipd.set(s.nipd.trim(), s.id);
      if (s.nik && s.nik.trim() && s.nik.trim() !== "-") mapByNik.set(s.nik.trim(), s.id);
    }
    const idMap = /* @__PURE__ */ new Map();
    const arsipData = [];
    for (const s of data.siswa) {
      let resolvedOldStudent = null;
      if (mapById.has(s.id)) {
        resolvedOldStudent = mapById.get(s.id);
      } else if (s.nisn && mapByNisn.has(s.nisn.trim())) {
        resolvedOldStudent = mapById.get(mapByNisn.get(s.nisn.trim()));
      } else if (s.nipd && mapByNipd.has(s.nipd.trim())) {
        resolvedOldStudent = mapById.get(mapByNipd.get(s.nipd.trim()));
      } else if (s.nik && mapByNik.has(s.nik.trim())) {
        resolvedOldStudent = mapById.get(mapByNik.get(s.nik.trim()));
      }
      if (resolvedOldStudent) {
        if (resolvedOldStudent.id !== s.id) {
          idMap.set(s.id, resolvedOldStudent.id);
          s.id = resolvedOldStudent.id;
        }
        const isDifferentYear = s.tahun_pelajaran && resolvedOldStudent.tahun_pelajaran !== s.tahun_pelajaran;
        const isDifferentSemester = s.semester && resolvedOldStudent.semester !== s.semester;
        if (isDifferentYear || isDifferentSemester) {
          arsipData.push([
            s.id,
            resolvedOldStudent.tahun_pelajaran,
            resolvedOldStudent.semester,
            resolvedOldStudent.rombel
          ]);
        }
      }
    }
    if (arsipData.length > 0) {
      const BATCH_SIZE2 = 100;
      for (let i = 0; i < arsipData.length; i += BATCH_SIZE2) {
        const batch = arsipData.slice(i, i + BATCH_SIZE2);
        if (batch.length === 0) continue;
        const placeholders = batch.map(() => "(?, ?, ?, ?)").join(",");
        await pool.query(`INSERT INTO arsip_siswa (siswa_id, tahun_pelajaran, semester, rombel) VALUES ${placeholders}`, batch.flat());
      }
    }
    const resolveChildIds = (arr) => {
      if (arr) {
        for (const child of arr) {
          if (idMap.has(child.siswa_id)) {
            child.siswa_id = idMap.get(child.siswa_id);
          }
        }
      }
    };
    resolveChildIds(data.data_orang_tua);
    resolveChildIds(data.data_wali);
    resolveChildIds(data.data_kontak);
    resolveChildIds(data.data_periodik);
    resolveChildIds(data.data_afirmasi);
    const BATCH_SIZE = 100;
    const siswaIds = data.siswa ? data.siswa.map((s) => s.id) : [];
    const deleteChildRecords = async (table, ids) => {
      if (!ids || ids.length === 0) return;
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        if (batch.length === 0) continue;
        const placeholders = batch.map(() => "?").join(",");
        await pool.query(`DELETE FROM ${table} WHERE siswa_id IN (${placeholders})`, batch);
      }
    };
    if (siswaIds.length > 0) {
      await deleteChildRecords("data_orang_tua", siswaIds);
      await deleteChildRecords("data_wali", siswaIds);
      await deleteChildRecords("data_kontak", siswaIds);
      await deleteChildRecords("data_periodik", siswaIds);
      await deleteChildRecords("data_afirmasi", siswaIds);
    }
    const upsert = async (table, items) => {
      if (!items || items.length === 0) return;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        if (batch.length === 0) continue;
        const keys = Object.keys(batch[0]);
        const values = batch.map((obj) => keys.map((k) => obj[k] === void 0 ? null : obj[k]));
        const placeholders = keys.map(() => "?").join(",");
        const updateStr = keys.map((k) => `${k}=VALUES(${k})`).join(", ");
        const query = `INSERT INTO ${table} (${keys.join(",")}) VALUES ${batch.map(() => `(${placeholders})`).join(",")} ON DUPLICATE KEY UPDATE ${updateStr}`;
        await pool.query(query, values.flat());
      }
    };
    const insert = async (table, items) => {
      if (!items || items.length === 0) return;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        if (batch.length === 0) continue;
        const keys = Object.keys(batch[0]);
        const values = batch.map((obj) => keys.map((k) => obj[k] === void 0 ? null : obj[k]));
        const placeholders = keys.map(() => "?").join(",");
        const query = `INSERT INTO ${table} (${keys.join(",")}) VALUES ${batch.map(() => `(${placeholders})`).join(",")}`;
        await pool.query(query, values.flat());
      }
    };
    await upsert("siswa", data.siswa);
    await insert("data_orang_tua", data.data_orang_tua);
    await insert("data_wali", data.data_wali);
    await insert("data_kontak", data.data_kontak);
    await insert("data_periodik", data.data_periodik);
    await insert("data_afirmasi", data.data_afirmasi);
    res.json({ success: true, message: "Data siswa berhasil disinkronisasi", count: data.siswa.length });
  } catch (e) {
    console.error("Error syncing data:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});
app.post("/api/activate", async (req, res) => {
  try {
    const { license_key } = req.body;
    const hwid = getHwid();
    const hubServerUrl = "https://hub.dapoy.net";
    const apiRes = await fetch(`${hubServerUrl}/api/verify-license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key,
        hardware_id: hwid,
        app_name: "Dapoy Schools"
      })
    });
    const data = await apiRes.json();
    if (data.valid) {
      updateEnv("LICENSE_KEY", license_key);
      isLicenseValid = true;
      isExpired = false;
      if (licenseTimer) clearInterval(licenseTimer);
      licenseTimer = setInterval(verifyLicenseOnBoot, 60 * 60 * 1e3);
      return res.json({ success: true, message: data.message || "Aktivasi berhasil" });
    } else {
      return res.status(400).json({ success: false, message: data.error || "License Key tidak valid" });
    }
  } catch (error) {
    console.error("ACTIVATE ERROR:", error);
    return res.status(400).json({ success: false, message: "Gagal: " + (error.message || "Koneksi ke hub.dapoy.net bermasalah") });
  }
});
app.get("/api/check-update", async (req, res) => {
  try {
    const response = await fetch("https://raw.githubusercontent.com/syahmuhamadrizky/dapoy-schools-release/main/update_version.txt");
    const text = await response.text();
    const match = text.match(/Versi ([\d\.]+)/i);
    const latest_version = match ? match[1] : "1.0.0";
    let current_version = "1.0.0";
    try {
      const packageJson = JSON.parse(import_fs.default.readFileSync(import_path.default.join(process.cwd(), "package.json"), "utf-8"));
      current_version = packageJson.version || "1.0.0";
    } catch (e) {
      console.error("Failed to read package.json version:", e);
    }
    const currentParts = current_version.split(".").map(Number);
    const latestParts = latest_version.split(".").map(Number);
    let has_update = false;
    for (let i = 0; i < 3; i++) {
      const cur = currentParts[i] || 0;
      const lat = latestParts[i] || 0;
      if (lat > cur) {
        has_update = true;
        break;
      }
      if (lat < cur) {
        break;
      }
    }
    res.json({ current_version, latest_version, has_update, changelog: text });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengecek update" });
  }
});
var pool = null;
var clean = (v) => v === "" || v === void 0 || v === null ? null : v;
function getPool() {
  if (!pool) {
    console.log("Creating database pool with host:", process.env.DB_HOST);
    pool = import_promise.default.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      // Reduced for safer start
      queueLimit: 0,
      connectTimeout: 5e3,
      // Reduced timeout
      enableKeepAlive: true,
      keepAliveInitialDelay: 1e4
    });
  }
  return pool;
}
async function ensureColumn(p, table, column, definition) {
  try {
    const [rows] = await p.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
    if (rows.length === 0) {
      console.log(`[DB] Adding missing column ${column} to ${table}`);
      await p.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`[DB] Successfully added column ${column} to ${table}`);
    }
  } catch (err) {
    console.error(`[DB] Error ensuring column ${column} in ${table}:`, err.message);
  }
}
async function initDb() {
  console.log("[DB] Starting database initialization...");
  const startTime = Date.now();
  try {
    const p = getPool();
    await p.query("SELECT 1");
    console.log("[DB] Database connection successful");
    const tables = [
      {
        name: "referensi",
        query: `
          CREATE TABLE IF NOT EXISTS referensi (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ref_id VARCHAR(36) DEFAULT (UUID()),
            jenis_ptk VARCHAR(255),
            bid_study VARCHAR(255),
            mata_pelajaran VARCHAR(255),
            status_kepegawaian VARCHAR(255),
            jenjang_pendidikan VARCHAR(255),
            jenis_sertifikasi VARCHAR(255),
            jurusan VARCHAR(255)
          )
        `
      },
      {
        name: "pengumuman",
        query: `
          CREATE TABLE IF NOT EXISTS pengumuman (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            target ENUM('siswa', 'pegawai', 'semua') DEFAULT 'semua',
            status ENUM('draft', 'published') DEFAULT 'published',
            intro TEXT,
            content TEXT NOT NULL,
            closing TEXT,
            signature VARCHAR(100),
            publish_start TIMESTAMP NULL,
            publish_end TIMESTAMP NULL,
            seo_tags TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: "pengaturan_sekolah",
        query: `
          CREATE TABLE IF NOT EXISTS pengaturan_sekolah (
            id INT PRIMARY KEY DEFAULT 1,
            school_name VARCHAR(255) DEFAULT 'SDN Tanah Tinggi 1',
            npsn VARCHAR(50),
            akreditasi VARCHAR(10),
            logo_url TEXT,
            hero_image_url TEXT,
            hero_title VARCHAR(255),
            hero_subtitle VARCHAR(255),
            visi TEXT,
            misi TEXT,
            stats_students VARCHAR(50),
            stats_teachers VARCHAR(50),
            stats_rooms VARCHAR(50),
            stats_extracurriculars VARCHAR(50),
            contact_address TEXT,
            contact_phone VARCHAR(100),
            contact_email VARCHAR(100),
            bentuk_pendidikan VARCHAR(100) DEFAULT 'Sekolah Dasar (SD)',
            status_sekolah VARCHAR(50) DEFAULT 'Negeri',
            kurikulum VARCHAR(100) DEFAULT 'Kurikulum Merdeka',
            gallery_slide_interval INT DEFAULT 2,
            headmaster_name VARCHAR(255),
            headmaster_nip VARCHAR(50),
            schedule_date VARCHAR(100),
            spmb_config LONGTEXT,
            social_links LONGTEXT,
            seo_title TEXT,
            seo_description TEXT,
            seo_keywords TEXT,
            sitemap_enabled BOOLEAN DEFAULT 1
          )
        `
      },
      {
        name: "peran",
        query: `
          CREATE TABLE IF NOT EXISTS peran (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            permissions TEXT NOT NULL
          )
        `
      },
      {
        name: "pegawai",
        query: `
          CREATE TABLE IF NOT EXISTS pegawai (
            pegawai_id VARCHAR(36) PRIMARY KEY,
            nama_lengkap VARCHAR(255) NOT NULL,
            nuptk VARCHAR(50),
            jenis_kelamin VARCHAR(20) DEFAULT 'L',
            tempat_lahir VARCHAR(100),
            tanggal_lahir DATE,
            nip VARCHAR(50),
            status_kepegawaian VARCHAR(50) DEFAULT 'Honorer',
            jenis_ptk VARCHAR(100),
            gelar_depan VARCHAR(50),
            gelar_belakang VARCHAR(50),
            jenjang_pendidikan VARCHAR(100),
            jurusan_prodi VARCHAR(100),
            sertifikasi VARCHAR(100),
            tmt_kerja VARCHAR(50),
            tugas_tambahan VARCHAR(100),
            mengajar VARCHAR(255),
            jam_tugas_tambahan VARCHAR(50),
            jjm VARCHAR(50),
            total_jjm VARCHAR(50),
            siswa VARCHAR(50),
            kompetensi VARCHAR(255),
            nik VARCHAR(50) UNIQUE,
            jabatan_ptk VARCHAR(100)
          )
        `
      },
      {
        name: "pengguna_web",
        query: `
          CREATE TABLE IF NOT EXISTS pengguna_web (
            id INT AUTO_INCREMENT PRIMARY KEY,
            staff_id INT,
            role_id INT,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            status_aktif BOOLEAN DEFAULT TRUE
          )
        `
      },
      {
        name: "siswa",
        query: `
          CREATE TABLE IF NOT EXISTS siswa (
            id VARCHAR(36) PRIMARY KEY,
            tahun_pelajaran VARCHAR(20),
            semester VARCHAR(10),
            nipd VARCHAR(50) NOT NULL,
            nisn VARCHAR(50) NOT NULL,
            nik VARCHAR(20),
            nama_lengkap VARCHAR(255) NOT NULL,
            jenis_kelamin VARCHAR(2) DEFAULT NULL,
            tempat_lahir VARCHAR(50) DEFAULT NULL,
            tanggal_lahir VARCHAR(20) DEFAULT NULL,
            agama VARCHAR(50) DEFAULT NULL,
            kewarganegaraan VARCHAR(30) DEFAULT 'Indonesia',
            alamat_jalan VARCHAR(200) DEFAULT NULL,
            rt VARCHAR(5) DEFAULT NULL,
            rw VARCHAR(5) DEFAULT NULL,
            provinsi VARCHAR(100) DEFAULT NULL,
            kota VARCHAR(100) DEFAULT NULL,
            kecamatan VARCHAR(100) DEFAULT NULL,
            kelurahan VARCHAR(100) DEFAULT NULL,
            kode_pos VARCHAR(10) DEFAULT NULL,
            lintang VARCHAR(20) DEFAULT NULL,
            bujur VARCHAR(20) DEFAULT NULL,
            nomor_kk VARCHAR(50) DEFAULT NULL,
            tempat_tinggal VARCHAR(50) DEFAULT NULL,
            moda_transportasi VARCHAR(50) DEFAULT NULL,
            rombel VARCHAR(50),
            status_aktif BOOLEAN DEFAULT TRUE,
            tk_paud VARCHAR(10) DEFAULT 'Tidak',
            nama_tk_paud VARCHAR(100) DEFAULT NULL,
            nomor_akte_lahir VARCHAR(50) DEFAULT NULL,
            skhun VARCHAR(50) DEFAULT NULL,
            no_peserta_ujian_nasioal VARCHAR(50) DEFAULT NULL,
            no_seri_ijazah VARCHAR(50) DEFAULT NULL,
            sekolah_asal VARCHAR(100) DEFAULT NULL,
            kebutuhan_khusus VARCHAR(100) DEFAULT NULL,
            INDEX (nama_lengkap),
            INDEX (rombel)
          )
        `
      },
      {
        name: "data_orang_tua",
        query: `
          CREATE TABLE IF NOT EXISTS data_orang_tua (
              id INT AUTO_INCREMENT PRIMARY KEY,
              siswa_id VARCHAR(36) NOT NULL,
              tipe ENUM('ayah', 'ibu') NOT NULL,
              nama VARCHAR(100) DEFAULT NULL,
              nik VARCHAR(20) DEFAULT NULL,
              tahun_lahir VARCHAR(4) DEFAULT NULL,
              pendidikan VARCHAR(30) DEFAULT NULL,
              pekerjaan VARCHAR(50) DEFAULT NULL,
              penghasilan VARCHAR(50) DEFAULT NULL,
              kebutuhan_khusus VARCHAR(10) DEFAULT 'Tidak',
              FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
          )
        `
      },
      {
        name: "data_wali",
        query: `
          CREATE TABLE IF NOT EXISTS data_wali (
              id INT AUTO_INCREMENT PRIMARY KEY,
              siswa_id VARCHAR(36) NOT NULL,
              nama VARCHAR(100) DEFAULT NULL,
              nik VARCHAR(20) DEFAULT NULL,
              tahun_lahir VARCHAR(4) DEFAULT NULL,
              pendidikan VARCHAR(30) DEFAULT NULL,
              pekerjaan VARCHAR(50) DEFAULT NULL,
              penghasilan VARCHAR(50) DEFAULT NULL,
              FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
          )
        `
      },
      {
        name: "data_kontak",
        query: `
          CREATE TABLE IF NOT EXISTS data_kontak (
              id INT AUTO_INCREMENT PRIMARY KEY,
              siswa_id VARCHAR(36) NOT NULL,
              telepon_rumah VARCHAR(20) DEFAULT NULL,
              nomor_hp VARCHAR(20) DEFAULT NULL,
              email VARCHAR(100) DEFAULT NULL,
              FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
          )
        `
      },
      {
        name: "data_periodik",
        query: `
          CREATE TABLE IF NOT EXISTS data_periodik (
              id INT AUTO_INCREMENT PRIMARY KEY,
              siswa_id VARCHAR(36) NOT NULL,
              tinggi_badan DECIMAL(5,2) DEFAULT NULL,
              berat_badan DECIMAL(5,2) DEFAULT NULL,
              lingkar_kepala VARCHAR(10) DEFAULT NULL,
              jarak_rumah VARCHAR(20) DEFAULT NULL,
              waktu_tempuh VARCHAR(20) DEFAULT NULL,
              anak_keberapa INT DEFAULT NULL,
              jumlah_saudara_kandung INT DEFAULT NULL,
              FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
          )
        `
      },
      {
        name: "data_afirmasi",
        query: `
          CREATE TABLE IF NOT EXISTS data_afirmasi (
              id INT AUTO_INCREMENT PRIMARY KEY,
              siswa_id VARCHAR(36) NOT NULL,
              nomor_kks VARCHAR(50) DEFAULT NULL,
              penerima_kps_pkh VARCHAR(10) DEFAULT 'Tidak',
              nomor_kps VARCHAR(50) DEFAULT NULL,
              penerima_kip VARCHAR(10) DEFAULT 'Tidak',
              nomor_kip VARCHAR(50) DEFAULT NULL,
              nama_sesuai_kip VARCHAR(100) DEFAULT NULL,
              bank_pip VARCHAR(50) DEFAULT NULL,
              nomor_rek_pip VARCHAR(50) DEFAULT NULL,
              atasnama_rek_pip VARCHAR(100) DEFAULT NULL,
              layak_pip VARCHAR(10) DEFAULT NULL,
              alasan_layak_pip VARCHAR(200) DEFAULT NULL,
              FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
          )
        `
      },
      {
        name: "arsip_siswa",
        query: `
          CREATE TABLE IF NOT EXISTS arsip_siswa (
            id INT AUTO_INCREMENT PRIMARY KEY,
            siswa_id VARCHAR(36) NOT NULL,
            tahun_pelajaran VARCHAR(20),
            semester VARCHAR(10),
            rombel VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
          )
        `
      },
      {
        name: "riwayat_masuk",
        query: `
          CREATE TABLE IF NOT EXISTS riwayat_masuk (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            student_id VARCHAR(36),
            type ENUM('pegawai', 'student') NOT NULL,
            username VARCHAR(100),
            ip_address VARCHAR(50),
            user_agent TEXT,
            status ENUM('success', 'failed') DEFAULT 'success',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES pengguna_web(id) ON DELETE SET NULL,
            FOREIGN KEY (student_id) REFERENCES siswa(id) ON DELETE SET NULL
          )
        `
      },
      {
        name: "rombongan_belajar",
        query: `
          CREATE TABLE IF NOT EXISTS rombongan_belajar (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tingkat VARCHAR(20),
            name VARCHAR(100) UNIQUE NOT NULL,
            wali_kelas_id INT,
            FOREIGN KEY (wali_kelas_id) REFERENCES staff(id) ON DELETE SET NULL
          )
        `
      },
      {
        name: "absensi_siswa",
        query: `
          CREATE TABLE IF NOT EXISTS absensi_siswa (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(36) NOT NULL,
            tanggal DATE NOT NULL,
            status VARCHAR(50) DEFAULT 'Hadir',
            keterangan TEXT,
            recorded_by VARCHAR(36),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES siswa(id) ON DELETE CASCADE,
            UNIQUE KEY unique_attendance (student_id, tanggal)
          )
        `
      },
      {
        name: "pengajuan_ubah_data",
        query: `
          CREATE TABLE IF NOT EXISTS pengajuan_ubah_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(36) NOT NULL,
            proposed_data TEXT NOT NULL,
            document_url TEXT,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            admin_note TEXT,
            FOREIGN KEY (student_id) REFERENCES siswa(id) ON DELETE CASCADE
          )
        `
      },
      {
        name: "artikel_blog",
        query: `
          CREATE TABLE IF NOT EXISTS artikel_blog (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            author_id INT,
            author_name VARCHAR(255),
            category VARCHAR(100) DEFAULT 'Kegiatan',
            status VARCHAR(20) DEFAULT 'draft',
            publish_start TIMESTAMP NULL,
            publish_end TIMESTAMP NULL,
            seo_tags TEXT,
            created_at DATETIME DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES pengguna_web(id) ON DELETE SET NULL
          )
        `
      },
      {
        name: "galeri",
        query: `
          CREATE TABLE IF NOT EXISTS galeri (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255),
            description TEXT,
            image_url TEXT NOT NULL,
            seo_tags TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: "kalender_akademik",
        query: `
          CREATE TABLE IF NOT EXISTS kalender_akademik (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            event_date DATE NOT NULL,
            description TEXT,
            category VARCHAR(100) DEFAULT 'Event',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: "jadwal_pelajaran",
        query: `
          CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_name VARCHAR(50) NOT NULL,
            day_name VARCHAR(50) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            teacher_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: "ekstrakurikuler",
        query: `
          CREATE TABLE IF NOT EXISTS ekstrakurikuler (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image_url TEXT,
            schedule_info VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
    ];
    for (const table of tables) {
      try {
        console.log(`[DB] Ensuring table ${table.name} exists...`);
        const result = await p.query(table.query);
        console.log(`[DB] Table ${table.name} check/creation done.`);
        if (table.name === "pengumuman") {
          const [cols] = await p.query("SHOW COLUMNS FROM pengumuman");
          const colNames = cols.map((c) => c.Field);
          if (cols.some((c) => c.Field === "target" && c.Type.includes("'umum'"))) {
            console.log("[DB] Migrating pengumuman.target from 'umum' to 'semua'...");
            await p.query("ALTER TABLE pengumuman MODIFY COLUMN target ENUM('siswa', 'pegawai', 'semua') DEFAULT 'semua'");
            await p.query("UPDATE pengumuman SET target = 'semua' WHERE target = 'umum'");
          }
          if (cols.some((c) => c.Field === "target" && c.Type.includes("enum"))) {
            console.log("[DB] Migrating pengumuman.target from ENUM to VARCHAR...");
            await p.query("ALTER TABLE pengumuman MODIFY COLUMN target VARCHAR(500) DEFAULT 'semua'");
          }
          if (!colNames.includes("status")) {
            await p.query("ALTER TABLE pengumuman ADD COLUMN status ENUM('draft', 'published') DEFAULT 'published' AFTER target");
          }
          if (!colNames.includes("publish_start")) {
            await p.query("ALTER TABLE pengumuman ADD COLUMN publish_start TIMESTAMP NULL AFTER signature");
          }
          if (!colNames.includes("publish_end")) {
            await p.query("ALTER TABLE pengumuman ADD COLUMN publish_end TIMESTAMP NULL AFTER publish_start");
          }
          if (colNames.includes("event_time")) {
            await p.query("ALTER TABLE pengumuman DROP COLUMN event_time");
          }
          if (colNames.includes("event_location")) {
            await p.query("ALTER TABLE pengumuman DROP COLUMN event_location");
          }
        }
        if (table.name === "pegawai") {
          const [cols] = await p.query("SHOW COLUMNS FROM pegawai");
          const colNames = cols.map((c) => c.Field);
          const validCols = ["pegawai_id", "id", "nama_lengkap", "nuptk", "jenis_kelamin", "tempat_lahir", "tanggal_lahir", "nip", "status_kepegawaian", "jenis_ptk", "gelar_depan", "gelar_belakang", "jenjang_pendidikan", "jurusan_prodi", "sertifikasi", "tmt_kerja", "tugas_tambahan", "mengajar", "jam_tugas_tambahan", "jjm", "total_jjm", "siswa", "kompetensi", "nik", "jabatan_ptk"];
          for (const col of colNames) {
            if (!validCols.includes(col)) {
              try {
                console.log(`[DB] Dropping column ${col} from pegawai`);
                await p.query(`ALTER TABLE pegawai DROP COLUMN ${col}`);
              } catch (e) {
              }
            }
          }
        }
        if (table.name === "siswa") {
          const [cols] = await p.query("SHOW COLUMNS FROM siswa");
          const colNames = cols.map((c) => c.Field);
          if (!colNames.includes("agama")) {
            await p.query("ALTER TABLE siswa ADD COLUMN agama VARCHAR(50) DEFAULT 'Islam' AFTER nik");
          }
          if (!colNames.includes("status_aktif")) {
            await p.query("ALTER TABLE siswa ADD COLUMN status_aktif BOOLEAN DEFAULT TRUE AFTER agama");
          }
        }
        if (table.name === "pengguna_web") {
          const [cols] = await p.query("SHOW COLUMNS FROM pengguna_web");
          const colNames = cols.map((c) => c.Field);
          if (!colNames.includes("status_aktif")) {
            await p.query("ALTER TABLE pengguna_web ADD COLUMN status_aktif BOOLEAN DEFAULT TRUE AFTER password");
          }
        }
      } catch (err) {
        console.error(`[DB] Failed to ensure table ${table.name}:`, err.message);
      }
    }
    await ensureColumn(p, "rombongan_belajar", "tingkat", "VARCHAR(20) AFTER id");
    const pegawaiCols = [
      { c: "nuptk", t: "VARCHAR(50)" },
      { c: "jenis_kelamin", t: "VARCHAR(20) DEFAULT 'L'" },
      { c: "tempat_lahir", t: "VARCHAR(100)" },
      { c: "tanggal_lahir", t: "DATE" },
      { c: "nip", t: "VARCHAR(50)" },
      { c: "status_kepegawaian", t: "VARCHAR(50) DEFAULT 'Honorer'" },
      { c: "jenis_ptk", t: "VARCHAR(100)" },
      { c: "gelar_depan", t: "VARCHAR(50)" },
      { c: "gelar_belakang", t: "VARCHAR(50)" },
      { c: "jenjang_pendidikan", t: "VARCHAR(100)" },
      { c: "jurusan_prodi", t: "VARCHAR(100)" },
      { c: "sertifikasi", t: "VARCHAR(100)" },
      { c: "tmt_kerja", t: "VARCHAR(50)" },
      { c: "tugas_tambahan", t: "VARCHAR(100)" },
      { c: "mengajar", t: "VARCHAR(255)" },
      { c: "jam_tugas_tambahan", t: "VARCHAR(50)" },
      { c: "jjm", t: "VARCHAR(50)" },
      { c: "total_jjm", t: "VARCHAR(50)" },
      { c: "siswa", t: "VARCHAR(50)" },
      { c: "kompetensi", t: "VARCHAR(255)" },
      { c: "nik", t: "VARCHAR(50) UNIQUE" },
      { c: "jabatan_ptk", t: "VARCHAR(100)" }
    ];
    for (const col of pegawaiCols) {
      await ensureColumn(p, "pegawai", col.c, col.t);
    }
    await ensureColumn(p, "siswa", "nipd", "VARCHAR(50) NOT NULL");
    await ensureColumn(p, "siswa", "rombel", "VARCHAR(50)");
    await ensureColumn(p, "siswa", "jenis_kelamin", "VARCHAR(2)");
    await ensureColumn(p, "siswa", "agama", "VARCHAR(50) AFTER nik");
    await ensureColumn(p, "siswa", "status_aktif", "BOOLEAN DEFAULT TRUE AFTER agama");
    await ensureColumn(p, "pengguna_web", "status_aktif", "BOOLEAN DEFAULT TRUE AFTER password");
    await ensureColumn(p, "pengaturan_sekolah", "school_name", "VARCHAR(255) DEFAULT 'SDN Tanah Tinggi 1'");
    await ensureColumn(p, "pengaturan_sekolah", "npsn", "VARCHAR(50)");
    await ensureColumn(p, "pengaturan_sekolah", "akreditasi", "VARCHAR(10)");
    await ensureColumn(p, "pengaturan_sekolah", "logo_url", "TEXT");
    await ensureColumn(p, "pengaturan_sekolah", "hero_image_url", "TEXT");
    await ensureColumn(p, "pengaturan_sekolah", "hero_title", "VARCHAR(255)");
    await ensureColumn(p, "pengaturan_sekolah", "sync_token", "VARCHAR(255) DEFAULT NULL");
    await ensureColumn(p, "pengaturan_sekolah", "hero_subtitle", "VARCHAR(255)");
    await ensureColumn(p, "pengaturan_sekolah", "visi", "TEXT");
    await ensureColumn(p, "pengaturan_sekolah", "misi", "TEXT");
    await ensureColumn(p, "pengaturan_sekolah", "provinsi", "VARCHAR(100)");
    await ensureColumn(p, "pengaturan_sekolah", "kota", "VARCHAR(100)");
    await ensureColumn(p, "pengaturan_sekolah", "kecamatan", "VARCHAR(100)");
    await ensureColumn(p, "pengaturan_sekolah", "kelurahan", "VARCHAR(100)");
    await ensureColumn(p, "pengaturan_sekolah", "contact_address", "TEXT");
    await ensureColumn(p, "pengaturan_sekolah", "contact_phone", "VARCHAR(100)");
    await ensureColumn(p, "pengaturan_sekolah", "contact_email", "VARCHAR(100)");
    await ensureColumn(p, "pengaturan_sekolah", "bentuk_pendidikan", "VARCHAR(100) DEFAULT 'Sekolah Dasar (SD)'");
    await ensureColumn(p, "pengaturan_sekolah", "status_sekolah", "VARCHAR(50) DEFAULT 'Negeri'");
    await ensureColumn(p, "pengaturan_sekolah", "kurikulum", "VARCHAR(100) DEFAULT 'Kurikulum Merdeka'");
    await ensureColumn(p, "pengaturan_sekolah", "gallery_slide_interval", "INT DEFAULT 2");
    await ensureColumn(p, "pengaturan_sekolah", "stats_students", "VARCHAR(50)");
    await ensureColumn(p, "pengaturan_sekolah", "stats_teachers", "VARCHAR(50)");
    await ensureColumn(p, "pengaturan_sekolah", "stats_rooms", "VARCHAR(50)");
    await ensureColumn(p, "pengaturan_sekolah", "stats_extracurriculars", "VARCHAR(50)");
    await ensureColumn(p, "pengaturan_sekolah", "headmaster_name", "VARCHAR(255)");
    await ensureColumn(p, "pengaturan_sekolah", "headmaster_nip", "VARCHAR(50)");
    await ensureColumn(p, "pengaturan_sekolah", "schedule_date", "VARCHAR(100)");
    await ensureColumn(p, "pengaturan_sekolah", "spmb_config", "LONGTEXT");
    await ensureColumn(p, "pengaturan_sekolah", "social_links", "LONGTEXT");
    await ensureColumn(p, "pengaturan_sekolah", "seo_title", "TEXT");
    await ensureColumn(p, "pengaturan_sekolah", "seo_description", "TEXT");
    await ensureColumn(p, "pengaturan_sekolah", "seo_keywords", "TEXT");
    await ensureColumn(p, "pengaturan_sekolah", "sitemap_enabled", "BOOLEAN DEFAULT 1");
    await ensureColumn(p, "pengaturan_sekolah", "active_template", "VARCHAR(50) DEFAULT 'template1'");
    await ensureColumn(p, "pengaturan_sekolah", "theme_color", "VARCHAR(50) DEFAULT '#2563eb'");
    await ensureColumn(p, "artikel_blog", "status", "VARCHAR(20) DEFAULT 'draft'");
    await ensureColumn(p, "artikel_blog", "publish_start", "TIMESTAMP NULL");
    await ensureColumn(p, "artikel_blog", "publish_end", "TIMESTAMP NULL");
    await ensureColumn(p, "artikel_blog", "seo_tags", "TEXT");
    await ensureColumn(p, "galeri", "seo_tags", "TEXT");
    await ensureColumn(p, "pengumuman", "seo_tags", "TEXT");
    try {
      const [rows] = await p.execute("SELECT * FROM pengaturan_sekolah WHERE id = 1");
      if (rows.length === 0) {
        await p.execute(`
          INSERT INTO pengaturan_sekolah (id, school_name, npsn, akreditasi, hero_image_url, hero_title, hero_subtitle, visi, misi, stats_students, stats_teachers, stats_rooms, stats_extracurriculars, provinsi, kota, kecamatan, kelurahan, contact_address, contact_phone, contact_email, bentuk_pendidikan, status_sekolah, kurikulum, gallery_slide_interval, headmaster_name, headmaster_nip, schedule_date, social_links)
          VALUES (1, 'SDN Tanah Tinggi 1', '20222830', 'A', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop', 'Membangun Masa Depan Cerdas & Berkarakter', 'Kami berkomitmen menyelenggarakan pendidikan dasar berkualitas yang berfokus pada potensi unik setiap anak.', 'Terwujudnya peserta didik yang religius, cerdas, berkarakter, dan berwawasan lingkungan.', '["Pendidikan berkualitas & inklusif bagi semua.", "Menanamkan nilai religius & budi pekerti.", "Mengembangkan potensi akademik & bakat.", "Menciptakan lingkungan bersih & sehat."]', '480+', '24', '18', '12', 'Banten', 'Kota Tangerang', 'Tangerang', 'Tanah Tinggi', 'Jl. Tanah Tinggi No. 1, 15119', '(021) 555-1234', 'info@sdntanahtinggi1.sch.id', 'Sekolah Dasar (SD)', 'Negeri', 'Kurikulum Merdeka', 2, 'Hj. NENI HERAWATI, S.Pd', '197003181992032007', 'Tangerang, ......................... 20...', '{}')
        `);
      } else {
        const row = rows[0];
        if (!row.hero_title || !row.hero_subtitle) {
          console.log("[DB] Updating empty hero fields in pengaturan_sekolah...");
          await p.execute(`
            UPDATE pengaturan_sekolah SET 
              hero_title = COALESCE(hero_title, 'Membangun Masa Depan Cerdas & Berkarakter'),
              hero_subtitle = COALESCE(hero_subtitle, 'Kami berkomitmen menyelenggarakan pendidikan dasar berkualitas yang berfokus pada potensi unik setiap anak.'),
              hero_image_url = COALESCE(hero_image_url, 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop')
            WHERE id = 1
          `);
        }
      }
    } catch (err) {
      console.error("[DB] Failed to seed pengaturan_sekolah:", err.message);
    }
    const [roleRows] = await p.execute("SELECT * FROM peran WHERE name IN ('Admin', 'Superadmin', 'Guru')");
    if (roleRows.length < 3) {
      if (!roleRows.some((r) => r.name === "Admin")) {
        await p.execute(`INSERT INTO peran (name, permissions) VALUES ('Admin', '["all"]')`);
      }
      if (!roleRows.some((r) => r.name === "Superadmin")) {
        await p.execute(`INSERT INTO peran (name, permissions) VALUES ('Superadmin', '["all"]')`);
      }
      if (!roleRows.some((r) => r.name === "Guru")) {
        await p.execute(`INSERT INTO peran (name, permissions) VALUES ('Guru', '["jadwal_pelajaran", "rombongan_belajar:view", "students:view"]')`);
      }
    }
    const [userRows] = await p.execute("SELECT * FROM pengguna_web WHERE username = 'admin'");
    if (userRows.length === 0) {
      const [superadminRole] = await p.execute("SELECT id FROM peran WHERE name = 'Superadmin'");
      if (superadminRole.length > 0) {
        const [staffInsert] = await p.execute(
          "INSERT IGNORE INTO pegawai (nama_lengkap, nip, nik) VALUES (?, ?, ?)",
          ["Syah Muhamad RIzky", "198212292025211010", "3671010101010101"]
        );
        let staffId;
        if (staffInsert.insertId) {
          staffId = staffInsert.insertId;
        } else {
          const [existingStaff] = await p.execute("SELECT pegawai_id as id FROM pegawai WHERE nip = '198212292025211010'");
          staffId = existingStaff[0].id;
        }
        await p.execute(
          "INSERT INTO pengguna_web (staff_id, role_id, username, password) VALUES (?, ?, ?, ?)",
          [staffId, superadminRole[0].id, "admin", "admin123"]
        );
      }
    }
    try {
      const [users] = await p.query("SELECT id, password FROM pengguna_web");
      if (users && users.length > 0) {
        let hashedCount = 0;
        for (const user of users) {
          if (user.password && !user.password.startsWith("$2a$") && !user.password.startsWith("$2b$")) {
            const hashedPassword = await import_bcryptjs.default.hash(user.password, 10);
            await p.query("UPDATE pengguna_web SET password = ? WHERE id = ?", [hashedPassword, user.id]);
            hashedCount++;
          }
        }
        if (hashedCount > 0) {
          console.log(`[DB] Migrated ${hashedCount} plaintext passwords to bcrypt.`);
        }
      }
    } catch (e) {
      console.error("[DB] Error hashing plaintext passwords:", e);
    }
    console.log(`Database initialized in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error("Database initialization failed critically:", err);
    throw err;
  }
}
var authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  import_jsonwebtoken.default.verify(token, JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = { ...user, permissions: Array.isArray(user?.permissions) ? user.permissions : ["all"] };
    if (req.user.type === "staff" && !req.user.staff_id && req.user.id) {
      try {
        const [uRows] = await getPool().execute("SELECT staff_id FROM pengguna_web WHERE id = ?", [req.user.id]);
        if (uRows.length > 0) req.user.staff_id = uRows[0].staff_id;
      } catch (e) {
        console.error("Error attaching staff_id:", e);
      }
    }
    next();
  });
};
var asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
app.get("/api/system/version", authenticate, (req, res) => {
  try {
    const pkg = JSON.parse(import_fs.default.readFileSync("./package.json", "utf8"));
    res.json({ version: pkg.version });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/system/check-update", authenticate, async (req, res) => {
  try {
    const timestamp = (/* @__PURE__ */ new Date()).getTime();
    const response = await fetch(`https://raw.githubusercontent.com/syahmuhamadrizky/dapoy-schools-release/main/package.json?t=${timestamp}`);
    if (!response.ok) throw new Error("Gagal memeriksa update");
    const remotePkg = await response.json();
    const localPkg = JSON.parse(import_fs.default.readFileSync("./package.json", "utf8"));
    const hasUpdate = remotePkg.version !== localPkg.version;
    res.json({
      available: hasUpdate,
      currentVersion: localPkg.version,
      latestVersion: remotePkg.version
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/system/install-update", authenticate, async (req, res) => {
  try {
    res.json({ success: true, message: "Update sedang diproses. Mohon tunggu sekitar 15-30 detik kemudian refresh halaman." });
    setTimeout(async () => {
      try {
        const AdmZip = require("adm-zip");
        const path2 = require("path");
        const fsExt = require("fs");
        const rootDir = process.cwd();
        const tempDir = path2.join(rootDir, "temp_update");
        const zipFile = path2.join(rootDir, "update.zip");
        console.log("[UPDATE] Mengunduh rilis terbaru...");
        const response = await fetch("https://github.com/syahmuhamadrizky/dapoy-schools-release/archive/refs/heads/main.zip");
        if (!response.ok) throw new Error("Gagal mengunduh update");
        const buffer = await response.arrayBuffer();
        fsExt.writeFileSync(zipFile, Buffer.from(buffer));
        console.log("[UPDATE] Mengekstrak rilis...");
        const zip = new AdmZip(zipFile);
        zip.extractAllTo(tempDir, true);
        console.log("[UPDATE] Menyalin file baru ke direktori utama...");
        const sourceDir = path2.join(tempDir, "dapoy-schools-release-main");
        fsExt.cpSync(sourceDir, rootDir, { recursive: true, force: true });
        console.log("[UPDATE] Membersihkan file sementara...");
        fsExt.rmSync(tempDir, { recursive: true, force: true });
        fsExt.rmSync(zipFile, { force: true });
        console.log("[UPDATE] Memicu restart server (cPanel/PM2)...");
        const tmpDir = path2.join(process.cwd(), "tmp");
        if (!fsExt.existsSync(tmpDir)) fsExt.mkdirSync(tmpDir);
        fsExt.writeFileSync(path2.join(tmpDir, "restart.txt"), String(Date.now()));
        setTimeout(() => {
          if (process.env.pm_id) {
            require("child_process").exec(`pm2 restart ${process.env.pm_id}`, (err) => {
              if (err) process.exit(1);
            });
          } else {
            process.exit(1);
          }
        }, 1e3);
      } catch (err) {
        console.error("[UPDATE] Background process error:", err);
      }
    }, 100);
  } catch (error) {
    console.error("[UPDATE] Endpoint Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/system/restart-pm2", authenticate, async (req, res) => {
  try {
    res.json({ success: true, message: "Server sedang direstart. Mohon tunggu 5-10 detik." });
    setTimeout(() => {
      try {
        const fsExt = require("fs");
        const path2 = require("path");
        const tmpDir = path2.join(process.cwd(), "tmp");
        if (!fsExt.existsSync(tmpDir)) fsExt.mkdirSync(tmpDir);
        fsExt.writeFileSync(path2.join(tmpDir, "restart.txt"), String(Date.now()));
        console.log("[SYSTEM] Memicu restart server (PM2/cPanel)...");
        if (process.env.pm_id) {
          require("child_process").exec(`pm2 restart ${process.env.pm_id}`, (err) => {
            if (err) process.exit(1);
          });
        } else {
          process.exit(1);
        }
      } catch (err) {
        console.error("[SYSTEM] Restart error:", err);
      }
    }, 1e3);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post("/api/upload", authenticate, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: err.message || "File upload error" });
    }
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});
app.post("/api/profile/photo", authenticate, (req, res, next) => {
  uploadProfile.single("photo")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || "File upload error" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      const photoUrl = `/uploads/profiles/${req.file.filename}`;
      await getPool().execute("UPDATE pengguna_web SET foto_profil = ? WHERE id = ?", [photoUrl, req.user.id]);
      if (req.user.staff_id) {
        await getPool().execute("UPDATE pegawai SET foto_profil = ? WHERE pegawai_id = ?", [photoUrl, req.user.staff_id]);
      }
      res.json({ photo_url: photoUrl });
    } catch (error) {
      console.error("Profile photo update error:", error);
      res.status(500).json({ error: "Failed to update profile photo" });
    }
  });
});
app.put("/api/profile/password", authenticate, asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const [rows] = await getPool().execute("SELECT password FROM pengguna_web WHERE id = ?", [req.user.id]);
  if (!rows.length) return res.status(404).json({ error: "User not found" });
  const isMatch = await import_bcryptjs.default.compare(oldPassword, rows[0].password);
  if (!isMatch) return res.status(400).json({ error: "Password lama salah." });
  const hashed = await import_bcryptjs.default.hash(newPassword, 10);
  await getPool().execute("UPDATE pengguna_web SET password = ? WHERE id = ?", [hashed, req.user.id]);
  res.json({ success: true });
}));
app.get("/api/pengumuman/public", asyncHandler(async (req, res) => {
  const { page } = req.query;
  let targetPage = page || "public/beranda";
  let query = `
        SELECT * FROM pengumuman 
        WHERE status = 'published' 
        AND (publish_start IS NULL OR publish_start <= CURRENT_TIMESTAMP) 
        AND (publish_end IS NULL OR publish_end >= CURRENT_TIMESTAMP) 
        AND (FIND_IN_SET(?, target) > 0 OR FIND_IN_SET('public/semua', target) > 0)
        ORDER BY created_at DESC LIMIT 5
    `;
  const [rows] = await getPool().execute(query, [targetPage]);
  res.json(rows);
}));
app.get("/api/pengumuman", authenticate, asyncHandler(async (req, res) => {
  const { target, isAdmin } = req.query;
  let query = "SELECT * FROM pengumuman WHERE 1=1";
  let params = [];
  if (isAdmin !== "true") {
    query += " AND status = 'published' AND (publish_start IS NULL OR publish_start <= CURRENT_TIMESTAMP) AND (publish_end IS NULL OR publish_end >= CURRENT_TIMESTAMP)";
  }
  if (target) {
    query += " AND (FIND_IN_SET(?, target) > 0 OR FIND_IN_SET('semua', target) > 0)";
    params.push(target);
  }
  query += " ORDER BY created_at DESC";
  const [rows] = await getPool().execute(query, params);
  res.json(rows);
}));
app.post("/api/pengumuman", authenticate, asyncHandler(async (req, res) => {
  const { title, target, status, intro, content, closing, signature, publish_start, publish_end } = req.body;
  let { seo_tags } = req.body;
  if (!seo_tags) seo_tags = generateSEOTags(title, (intro || "") + " " + content);
  await getPool().execute(
    "INSERT INTO pengumuman (title, target, status, intro, content, closing, signature, publish_start, publish_end, seo_tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [title, target || "semua", status || "published", intro, content, closing, signature, publish_start || null, publish_end || null, seo_tags]
  );
  res.json({ success: true });
}));
app.put("/api/pengumuman/:id", authenticate, asyncHandler(async (req, res) => {
  const { title, target, status, intro, content, closing, signature, publish_start, publish_end } = req.body;
  let { seo_tags } = req.body;
  if (!seo_tags) seo_tags = generateSEOTags(title, (intro || "") + " " + content);
  await getPool().execute(
    `UPDATE pengumuman SET 
            title = ?, target = ?, status = ?, intro = ?, content = ?, 
            closing = ?, signature = ?,
            publish_start = ?, publish_end = ?, seo_tags = ?
        WHERE id = ?`,
    [title, target, status, intro, content, closing, signature, publish_start || null, publish_end || null, seo_tags, req.params.id]
  );
  res.json({ success: true });
}));
app.delete("/api/pengumuman/:id", authenticate, asyncHandler(async (req, res) => {
  const [result] = await getPool().execute("DELETE FROM pengumuman WHERE id = ?", [req.params.id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "Pengumuman tidak ditemukan" });
  }
  res.json({ success: true });
}));
app.get("/api/pengaturan_sekolah", asyncHandler(async (req, res) => {
  try {
    const [rows] = await getPool().execute("SELECT * FROM pengaturan_sekolah WHERE id = 1");
    if (rows && rows.length > 0) {
      res.json(rows[0]);
    } else {
      throw new Error("Settings not found");
    }
  } catch (err) {
    console.error("Failed to fetch settings, returning defaults:", err);
    res.json({
      school_name: "SDN Tanah Tinggi 1",
      npsn: "20222830",
      akreditasi: "A",
      hero_title: "Selamat Datang di SDN Tanah Tinggi 1",
      hero_subtitle: "Mewujudkan generasi cerdas, berkarakter, dan berdaya saing.",
      hero_image_url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop",
      visi: "Terwujudnya sekolah yang unggul dalam prestasi dan berakhlak mulia.",
      misi: "[]",
      stats_students: "0",
      stats_teachers: "0",
      stats_rooms: "0",
      stats_extracurriculars: "0",
      provinsi: "",
      kota: "",
      kecamatan: "",
      kelurahan: "",
      contact_address: "Lokasi belum diatur",
      contact_phone: "-",
      contact_email: "-",
      bentuk_pendidikan: "Sekolah Dasar (SD)",
      status_sekolah: "Negeri",
      kurikulum: "Kurikulum Merdeka",
      gallery_slide_interval: 2,
      headmaster_name: "Hj. NENI HERAWATI, S.Pd",
      headmaster_nip: "197003181992032007",
      schedule_date: "Tangerang, ......................... 20...",
      spmb_config: "{}",
      social_links: "[]",
      seo_title: "SDN Tanah Tinggi 1",
      seo_description: "Website Resmi SDN Tanah Tinggi 1",
      seo_keywords: "sekolah, sdn, tanah tinggi 1",
      sitemap_enabled: 1
    });
  }
}));
app.post("/api/pengaturan_sekolah", authenticate, asyncHandler(async (req, res) => {
  const {
    school_name,
    npsn,
    akreditasi,
    logo_url,
    hero_image_url,
    hero_title,
    hero_subtitle,
    visi,
    misi,
    stats_students,
    stats_teachers,
    stats_rooms,
    stats_extracurriculars,
    provinsi,
    kota,
    kecamatan,
    kelurahan,
    contact_address,
    contact_phone,
    contact_email,
    bentuk_pendidikan,
    status_sekolah,
    kurikulum,
    gallery_slide_interval,
    headmaster_name,
    headmaster_nip,
    schedule_date,
    spmb_config,
    social_links,
    seo_title,
    seo_description,
    seo_keywords,
    sitemap_enabled,
    sync_token,
    active_template,
    theme_color
  } = req.body;
  try {
    const [result] = await getPool().execute(
      `UPDATE pengaturan_sekolah SET 
        school_name = ?, npsn = ?, akreditasi = ?, logo_url = ?, hero_image_url = ?,
        hero_title = ?, hero_subtitle = ?, visi = ?, misi = ?, 
        stats_students = ?, stats_teachers = ?, stats_rooms = ?, stats_extracurriculars = ?, 
        provinsi = ?, kota = ?, kecamatan = ?, kelurahan = ?,
        contact_address = ?, contact_phone = ?, contact_email = ?,
        bentuk_pendidikan = ?, status_sekolah = ?, kurikulum = ?, gallery_slide_interval = ?,
        headmaster_name = ?, headmaster_nip = ?, schedule_date = ?, spmb_config = ?, social_links = ?,
        seo_title = ?, seo_description = ?, seo_keywords = ?, sitemap_enabled = ?, sync_token = ?,
        active_template = ?, theme_color = ?
      WHERE id = 1`,
      [
        school_name,
        npsn,
        akreditasi,
        logo_url,
        hero_image_url,
        hero_title,
        hero_subtitle,
        typeof visi === "string" ? visi : JSON.stringify(visi),
        typeof misi === "string" ? misi : JSON.stringify(misi),
        stats_students,
        stats_teachers,
        stats_rooms,
        stats_extracurriculars,
        provinsi,
        kota,
        kecamatan,
        kelurahan,
        contact_address,
        contact_phone,
        contact_email,
        bentuk_pendidikan,
        status_sekolah,
        kurikulum,
        gallery_slide_interval,
        headmaster_name,
        headmaster_nip,
        schedule_date,
        typeof spmb_config === "string" ? spmb_config : spmb_config ? JSON.stringify(spmb_config) : "{}",
        typeof social_links === "string" ? social_links : social_links ? JSON.stringify(social_links) : "{}",
        seo_title,
        seo_description,
        seo_keywords,
        sitemap_enabled,
        sync_token || null,
        active_template || "template1",
        theme_color || "#2563eb"
      ]
    );
    if (result.affectedRows === 0) {
      await getPool().execute(
        `INSERT INTO pengaturan_sekolah (id, school_name, npsn, akreditasi, logo_url, hero_image_url, hero_title, hero_subtitle, visi, misi, stats_students, stats_teachers, stats_rooms, stats_extracurriculars, provinsi, kota, kecamatan, kelurahan, contact_address, contact_phone, contact_email, bentuk_pendidikan, status_sekolah, kurikulum, gallery_slide_interval, headmaster_name, headmaster_nip, schedule_date, spmb_config, social_links, seo_title, seo_description, seo_keywords, sitemap_enabled, sync_token, active_template, theme_color)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          school_name,
          npsn,
          akreditasi,
          logo_url,
          hero_image_url,
          hero_title,
          hero_subtitle,
          typeof visi === "string" ? visi : JSON.stringify(visi),
          typeof misi === "string" ? misi : JSON.stringify(misi),
          stats_students,
          stats_teachers,
          stats_rooms,
          stats_extracurriculars,
          provinsi,
          kota,
          kecamatan,
          kelurahan,
          contact_address,
          contact_phone,
          contact_email,
          bentuk_pendidikan,
          status_sekolah,
          kurikulum,
          gallery_slide_interval,
          headmaster_name,
          headmaster_nip,
          schedule_date,
          typeof spmb_config === "string" ? spmb_config : spmb_config ? JSON.stringify(spmb_config) : "{}",
          typeof social_links === "string" ? social_links : social_links ? JSON.stringify(social_links) : "{}",
          seo_title,
          seo_description,
          seo_keywords,
          sitemap_enabled,
          sync_token || null,
          active_template || "template1",
          theme_color || "#2563eb"
        ]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to update settings:", err);
    res.status(500).json({ error: "Gagal menyimpan pengaturan: " + err.message });
  }
}));
app.get("/api/rombongan_belajar/public", asyncHandler(async (req, res) => {
  const [rows] = await getPool().execute(`
        SELECT r.*, s.nama_lengkap as wali_kelas_name, s.nip as wali_kelas_nip
        FROM rombongan_belajar r
        LEFT JOIN pegawai s ON r.wali_kelas_id = s.pegawai_id
        ORDER BY r.tingkat, r.name
    `);
  res.json(rows);
}));
app.get("/api/rombongan_belajar", authenticate, asyncHandler(async (req, res) => {
  let whereClause = "";
  const params = [];
  if (req.user.type === "staff") {
    const perms = req.user.permissions || [];
    if (!perms.includes("all")) {
      const [rombelCheck] = await getPool().execute(
        "SELECT COUNT(*) as count FROM rombongan_belajar WHERE wali_kelas_id = ?",
        [req.user.staff_id]
      );
      if (rombelCheck[0].count > 0) {
        whereClause = "WHERE r.wali_kelas_id = ?";
        params.push(req.user.staff_id);
      }
    }
  }
  const [rows] = await getPool().execute(`
        SELECT r.*, s.nama_lengkap as wali_kelas_name, s.nip as wali_kelas_nip,
               (SELECT COUNT(*) FROM siswa WHERE rombel = r.name) as student_count
        FROM rombongan_belajar r
        LEFT JOIN pegawai s ON r.wali_kelas_id = s.pegawai_id
        ${whereClause}
    `, params);
  res.json(rows);
}));
app.post("/api/rombongan_belajar", authenticate, asyncHandler(async (req, res) => {
  const { name, wali_kelas_id, tingkat } = req.body;
  console.log(`[Rombels] Creating: name=${name}, wali=${wali_kelas_id}, tingkat=${tingkat}`);
  try {
    await getPool().execute("INSERT INTO rombongan_belajar (name, wali_kelas_id, tingkat) VALUES (?, ?, ?)", [name, wali_kelas_id || null, tingkat || null].map(clean));
    res.json({ success: true });
  } catch (err) {
    console.error("[Rombels] Create error:", err);
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Nama rombel sudah ada" });
    throw err;
  }
}));
app.delete("/api/rombongan_belajar/:id", authenticate, asyncHandler(async (req, res) => {
  const id = req.params.id;
  console.log(`[Rombels] Deleting id=${id}`);
  try {
    const [result] = await getPool().execute("DELETE FROM rombongan_belajar WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Rombel tidak ditemukan" });
    }
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error(`[Rombels] Delete error for id=${id}:`, err);
    res.status(500).json({ error: "Gagal menghapus rombel. Mungkin rombel ini masih digunakan di tabel lain.", detail: err.message });
  }
}));
app.put("/api/rombongan_belajar/:id", authenticate, asyncHandler(async (req, res) => {
  const { name, wali_kelas_id, tingkat } = req.body;
  const id = req.params.id;
  console.log(`[Rombels] Updating id=${id}: name=${name}, wali=${wali_kelas_id}, tingkat=${tingkat}`);
  try {
    await getPool().execute("UPDATE rombongan_belajar SET name = ?, wali_kelas_id = ?, tingkat = ? WHERE id = ?", [name, wali_kelas_id || null, tingkat || null, id].map(clean));
    res.json({ success: true });
  } catch (err) {
    console.error(`[Rombels] Update error for id=${id}:`, err);
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Nama rombel sudah ada" });
    throw err;
  }
}));
app.get("/api/dashboard-stats", authenticate, asyncHandler(async (req, res) => {
  try {
    const stats = {};
    let whereClause = "";
    const params = [];
    if (req.user.type === "staff") {
      const perms = req.user.permissions || [];
      if (!perms.includes("all")) {
        const [rombelRows] = await getPool().execute("SELECT name FROM rombongan_belajar WHERE wali_kelas_id = ?", [req.user.staff_id]);
        if (rombelRows.length > 0) {
          const names = rombelRows.map((r) => r.name);
          whereClause = `WHERE rombel IN (${names.map(() => "?").join(",")})`;
          params.push(...names);
        }
      }
    }
    const [rombongan_belajar] = await getPool().execute(`SELECT rombel as name, COUNT(*) as value FROM siswa ${whereClause} GROUP BY rombel`, params);
    stats.student_by_rombel = rombongan_belajar.map((r) => ({ rombel_name: r.name || "N/A", total: Number(r.value) }));
    const [gender] = await getPool().execute(`SELECT jenis_kelamin as name, COUNT(*) as value FROM siswa ${whereClause} GROUP BY jenis_kelamin`, params);
    stats.student_by_gender = gender.map((g) => ({ gender: g.name || "N/A", total: Number(g.value) }));
    const [agama] = await getPool().execute(`SELECT agama as name, COUNT(*) as value FROM siswa ${whereClause} GROUP BY agama`, params);
    stats.student_by_religion = agama.map((r) => ({ agama: r.name || "Islam", total: Number(r.value) }));
    const [staffStatus] = await getPool().execute("SELECT status_kepegawaian as name, COUNT(*) as value FROM pegawai GROUP BY status_kepegawaian");
    stats.staff_by_status = staffStatus.map((s) => ({ status_kepegawaian: s.name || "Belum Diatur", total: Number(s.value) }));
    const [jabatan] = await getPool().execute("SELECT jabatan_ptk as name, COUNT(*) as value FROM pegawai GROUP BY jabatan_ptk");
    stats.staff_by_position = jabatan.map((j) => ({ jabatan: j.name || "N/A", total: Number(j.value) }));
    console.log("[DEBUG] Dashboard stats compiled:", Object.keys(stats));
    res.json(stats);
  } catch (error) {
    console.error("[ERROR] Failed to fetch dashboard stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}));
app.get("/api/riwayat_masuk", authenticate, asyncHandler(async (req, res) => {
  const [rows] = await getPool().execute("SELECT * FROM riwayat_masuk ORDER BY created_at DESC LIMIT 50");
  res.json(rows);
}));
app.post("/api/pengguna_web/:id/toggle-status", authenticate, asyncHandler(async (req, res) => {
  await getPool().execute("UPDATE pengguna_web SET status_aktif = NOT status_aktif WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.get("/api/kalender_akademik", asyncHandler(async (req, res) => {
  const [rows] = await getPool().execute("SELECT * FROM kalender_akademik ORDER BY event_date ASC");
  res.json(rows);
}));
app.post("/api/kalender_akademik", authenticate, asyncHandler(async (req, res) => {
  const { title, event_date, description, category } = req.body;
  await getPool().execute(
    "INSERT INTO kalender_akademik (title, event_date, description, category) VALUES (?, ?, ?, ?)",
    [title, event_date, description, category].map(clean)
  );
  res.json({ success: true });
}));
app.delete("/api/kalender_akademik/:id", authenticate, asyncHandler(async (req, res) => {
  await getPool().execute("DELETE FROM kalender_akademik WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.get("/api/jadwal_pelajaran", authenticate, asyncHandler(async (req, res) => {
  const { class_name } = req.query;
  let query = "SELECT jp.* FROM jadwal_pelajaran jp";
  let params = [];
  let whereConditions = [];
  if (class_name) {
    whereConditions.push("jp.class_name = ?");
    params.push(class_name);
  }
  if (req.user.type === "staff") {
    const perms = req.user.permissions || [];
    if (!perms.includes("all")) {
      query += " JOIN rombongan_belajar r ON jp.class_name = r.name";
      const [rombelCheck] = await getPool().execute(
        "SELECT COUNT(*) as count FROM rombongan_belajar WHERE wali_kelas_id = ?",
        [req.user.staff_id]
      );
      if (rombelCheck[0].count > 0) {
        whereConditions.push("r.wali_kelas_id = ?");
        params.push(req.user.staff_id);
      }
    }
  }
  if (whereConditions.length > 0) {
    query += " WHERE " + whereConditions.join(" AND ");
  }
  query += " ORDER BY jp.day_name, jp.start_time";
  const [rows] = await getPool().execute(query, params);
  res.json(rows);
}));
app.post("/api/jadwal_pelajaran", authenticate, asyncHandler(async (req, res) => {
  const { class_name, day_name, subject, start_time, end_time, teacher_name } = req.body;
  await getPool().execute(
    "INSERT INTO jadwal_pelajaran (class_name, day_name, subject, start_time, end_time, teacher_name) VALUES (?, ?, ?, ?, ?, ?)",
    [class_name, day_name, subject, start_time, end_time, teacher_name]
  );
  res.json({ success: true });
}));
app.delete("/api/jadwal_pelajaran/:id", authenticate, asyncHandler(async (req, res) => {
  await getPool().execute("DELETE FROM jadwal_pelajaran WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.get("/api/ekstrakurikuler", asyncHandler(async (req, res) => {
  const [rows] = await getPool().execute("SELECT * FROM ekstrakurikuler");
  res.json(rows);
}));
app.post("/api/ekstrakurikuler", authenticate, asyncHandler(async (req, res) => {
  const { name, description, image_url, schedule_info } = req.body;
  await getPool().execute(
    "INSERT INTO ekstrakurikuler (name, description, image_url, schedule_info) VALUES (?, ?, ?, ?)",
    [name, description, image_url, schedule_info]
  );
  res.json({ success: true });
}));
app.delete("/api/ekstrakurikuler/:id", authenticate, asyncHandler(async (req, res) => {
  await getPool().execute("DELETE FROM ekstrakurikuler WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.put("/api/kalender_akademik/:id", authenticate, asyncHandler(async (req, res) => {
  const { title, event_date, description, category } = req.body;
  await getPool().execute(
    "UPDATE kalender_akademik SET title = ?, event_date = ?, description = ?, category = ? WHERE id = ?",
    [title, event_date, description, category, req.params.id].map(clean)
  );
  res.json({ success: true });
}));
app.put("/api/jadwal_pelajaran/:id", authenticate, asyncHandler(async (req, res) => {
  const { class_name, day_name, subject, start_time, end_time, teacher_name } = req.body;
  await getPool().execute(
    "UPDATE jadwal_pelajaran SET class_name = ?, day_name = ?, subject = ?, start_time = ?, end_time = ?, teacher_name = ? WHERE id = ?",
    [class_name, day_name, subject, start_time, end_time, teacher_name, req.params.id]
  );
  res.json({ success: true });
}));
app.put("/api/ekstrakurikuler/:id", authenticate, asyncHandler(async (req, res) => {
  const { name, description, image_url, schedule_info } = req.body;
  await getPool().execute(
    "UPDATE ekstrakurikuler SET name = ?, description = ?, image_url = ?, schedule_info = ? WHERE id = ?",
    [name, description, image_url, schedule_info, req.params.id]
  );
  res.json({ success: true });
}));
app.post("/api/siswa/:id/toggle-status", authenticate, asyncHandler(async (req, res) => {
  await getPool().execute("UPDATE siswa SET status_aktif = NOT status_aktif WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.get("/api/peran", authenticate, asyncHandler(async (req, res) => {
  const [rows] = await getPool().execute("SELECT * FROM peran");
  res.json(rows);
}));
app.post("/api/peran", authenticate, asyncHandler(async (req, res) => {
  const { name, permissions } = req.body;
  await getPool().execute("INSERT INTO peran (name, permissions) VALUES (?, ?)", [name, JSON.stringify(permissions)]);
  res.json({ success: true });
}));
app.put("/api/peran/:id", authenticate, asyncHandler(async (req, res) => {
  const [targetRoles] = await getPool().execute("SELECT name FROM peran WHERE id = ?", [req.params.id]);
  if (targetRoles.length > 0 && targetRoles[0].name.toLowerCase() === "superadmin") {
    return res.status(403).json({ error: "Role Superadmin tidak dapat dimodifikasi." });
  }
  const { name, permissions } = req.body;
  await getPool().execute("UPDATE peran SET name = ?, permissions = ? WHERE id = ?", [name, JSON.stringify(permissions), req.params.id]);
  res.json({ success: true });
}));
app.delete("/api/peran/:id", authenticate, asyncHandler(async (req, res) => {
  const [targetRoles] = await getPool().execute("SELECT name FROM peran WHERE id = ?", [req.params.id]);
  if (targetRoles.length > 0 && targetRoles[0].name.toLowerCase() === "superadmin") {
    return res.status(403).json({ error: "Role Superadmin tidak dapat dihapus." });
  }
  const [users] = await getPool().execute("SELECT id FROM pengguna_web WHERE role_id = ?", [req.params.id]);
  if (users.length > 0) {
    return res.status(400).json({ error: "Role cannot be deleted while it is assigned to users." });
  }
  await getPool().execute("DELETE FROM peran WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.get("/api/wilayah/search", authenticate, asyncHandler(async (req, res) => {
  const q = req.query.q;
  if (!q || typeof q !== "string" || q.length < 3) {
    return res.json([]);
  }
  const searchQuery = "%" + q + "%";
  const sql = `
        SELECT 
            kel.kode_wilayah as kelurahan_kode, kel.nama as kelurahan,
            kec.kode_wilayah as kecamatan_kode, kec.nama as kecamatan,
            kota.kode_wilayah as kota_kode, kota.nama as kota,
            prov.kode_wilayah as provinsi_kode, prov.nama as provinsi
        FROM ref_mst_wilayah kel
        LEFT JOIN ref_mst_wilayah kec ON kel.mst_kode_wilayah = kec.kode_wilayah
        LEFT JOIN ref_mst_wilayah kota ON kec.mst_kode_wilayah = kota.kode_wilayah
        LEFT JOIN ref_mst_wilayah prov ON kota.mst_kode_wilayah = prov.kode_wilayah
        WHERE kel.id_level_wilayah = '4' AND kel.nama LIKE ?
        LIMIT 20
    `;
  const [rows] = await getPool().query(sql, [searchQuery]);
  const results = rows.map((r) => ({
    kelurahan: r.kelurahan,
    kecamatan: r.kecamatan,
    kota: r.kota,
    provinsi: r.provinsi,
    full_text: `${r.kelurahan || ""}, ${r.kecamatan || ""}, ${r.kota || ""}, ${r.provinsi || ""}`
  }));
  res.json(results);
}));
app.get("/api/referensi/:column", (req, res, next) => {
  console.log("HIT API REFERENSI:", req.params.column);
  next();
}, authenticate, asyncHandler(async (req, res) => {
  const { column } = req.params;
  const allowedColumns = ["jenis_ptk", "bid_study", "mata_pelajaran", "status_kepegawaian", "jenjang_pendidikan", "jenis_sertifikasi", "jurusan"];
  if (!allowedColumns.includes(column)) {
    return res.status(400).json({ error: "Invalid column" });
  }
  const p = getPool();
  const [rows] = await p.query(`SELECT DISTINCT ?? as value FROM referensi WHERE ?? IS NOT NULL AND ?? != '' ORDER BY ?? ASC`, [column, column, column, column]);
  res.json(rows.map((r) => r.value));
}));
app.post("/api/pegawai/import", authenticate, asyncHandler(async (req, res) => {
  if (!req.user.permissions.includes("all") && !req.user.permissions.includes("staff:import")) {
    return res.status(403).json({ error: "Access denied" });
  }
  const data = req.body;
  if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ error: "Data is empty or invalid" });
  const conn = await getPool().getConnection();
  try {
    let imported = 0, updated = 0;
    for (const row of data) {
      if (!row.nama_lengkap) continue;
      const nip = String(row.nip || "");
      const nik = String(row.nik || "");
      const pegawai_id = import_crypto.default.randomUUID();
      const [result] = await conn.query(
        `INSERT INTO pegawai (pegawai_id, nama_lengkap, nuptk, jenis_kelamin, nip, nik, tempat_lahir, tanggal_lahir, status_kepegawaian, jenis_ptk, gelar_depan, gelar_belakang, jenjang_pendidikan, jurusan_prodi, sertifikasi, tmt_kerja, jabatan_ptk, tugas_tambahan, mengajar, jam_tugas_tambahan, jjm, total_jjm, siswa, kompetensi)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE
                    nama_lengkap=VALUES(nama_lengkap),
                    nuptk=VALUES(nuptk),
                    jenis_kelamin=VALUES(jenis_kelamin),
                    tempat_lahir=VALUES(tempat_lahir),
                    tanggal_lahir=VALUES(tanggal_lahir),
                    status_kepegawaian=VALUES(status_kepegawaian),
                    jenis_ptk=VALUES(jenis_ptk),
                    gelar_depan=VALUES(gelar_depan),
                    gelar_belakang=VALUES(gelar_belakang),
                    jenjang_pendidikan=VALUES(jenjang_pendidikan),
                    jurusan_prodi=VALUES(jurusan_prodi),
                    sertifikasi=VALUES(sertifikasi),
                    tmt_kerja=VALUES(tmt_kerja),
                    jabatan_ptk=VALUES(jabatan_ptk),
                    tugas_tambahan=VALUES(tugas_tambahan),
                    mengajar=VALUES(mengajar),
                    jam_tugas_tambahan=VALUES(jam_tugas_tambahan),
                    jjm=VALUES(jjm),
                    total_jjm=VALUES(total_jjm),
                    siswa=VALUES(siswa),
                    kompetensi=VALUES(kompetensi)`,
        [
          pegawai_id,
          String(row.nama_lengkap || ""),
          String(row.nuptk || "") || null,
          String(row.jenis_kelamin || "") || null,
          nip || null,
          nik || null,
          String(row.tempat_lahir || "") || null,
          row.tanggal_lahir || null,
          String(row.status_kepegawaian || "Honorer") || null,
          String(row.jenis_ptk || "") || null,
          String(row.gelar_depan || "") || null,
          String(row.gelar_belakang || "") || null,
          String(row.jenjang_pendidikan || "") || null,
          String(row.jurusan_prodi || "") || null,
          String(row.sertifikasi || "") || null,
          String(row.tmt_kerja || "") || null,
          String(row.jabatan_ptk || "") || null,
          String(row.tugas_tambahan || "") || null,
          String(row.mengajar || "") || null,
          String(row.jam_tugas_tambahan || "") || null,
          String(row.jjm || "") || null,
          String(row.total_jjm || "") || null,
          String(row.siswa || "") || null,
          String(row.kompetensi || "") || null
        ]
      );
      if (result.affectedRows <= 2) imported++;
      else updated++;
    }
    res.json({ success: true, message: `Impor selesai. ${imported} diproses, ${updated} diperbarui.` });
  } catch (error) {
    console.error("Import Staff Error:", error);
    res.status(500).json({ error: `Gagal impor: ${error.message}` });
  } finally {
    conn.release();
  }
}));
app.get("/api/pegawai", authenticate, asyncHandler(async (req, res) => {
  const [rows] = await getPool().execute(`SELECT *, pegawai_id as id FROM pegawai ORDER BY nama_lengkap ASC`);
  res.json(rows);
}));
app.post("/api/pegawai", authenticate, asyncHandler(async (req, res) => {
  const { nama_lengkap, nuptk, jenis_kelamin, nip, nik, tempat_lahir, tanggal_lahir, status_kepegawaian, jenis_ptk, gelar_depan, gelar_belakang, jenjang_pendidikan, jurusan_prodi, sertifikasi, tmt_kerja, jabatan_ptk, tugas_tambahan, mengajar, jam_tugas_tambahan, jjm, total_jjm, siswa, kompetensi } = req.body;
  if (!nama_lengkap) return res.status(400).json({ error: "Nama lengkap harus diisi" });
  const cleanPegawai = (v) => {
    if (typeof v === "string") {
      const t = v.trim();
      return t === "" || t === "-" ? null : t;
    }
    return v === void 0 || v === null ? null : v;
  };
  try {
    const pegawai_id = import_crypto.default.randomUUID();
    await getPool().execute(
      "INSERT INTO pegawai (pegawai_id, nama_lengkap, nuptk, jenis_kelamin, nip, nik, tempat_lahir, tanggal_lahir, status_kepegawaian, jenis_ptk, gelar_depan, gelar_belakang, jenjang_pendidikan, jurusan_prodi, sertifikasi, tmt_kerja, jabatan_ptk, tugas_tambahan, mengajar, jam_tugas_tambahan, jjm, total_jjm, siswa, kompetensi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [pegawai_id, nama_lengkap, nuptk || null, jenis_kelamin || null, nip || null, nik || null, tempat_lahir || null, tanggal_lahir || null, status_kepegawaian || "Honorer", jenis_ptk || null, gelar_depan || null, gelar_belakang || null, jenjang_pendidikan || null, jurusan_prodi || null, sertifikasi || null, tmt_kerja || null, jabatan_ptk || null, tugas_tambahan || null, mengajar || null, jam_tugas_tambahan || null, jjm || null, total_jjm || null, siswa || null, kompetensi || null].map(cleanPegawai)
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "NIK atau NIP sudah terdaftar" });
    throw err;
  }
}));
app.put("/api/pegawai/:id", authenticate, asyncHandler(async (req, res) => {
  const { nama_lengkap, nuptk, jenis_kelamin, nip, nik, tempat_lahir, tanggal_lahir, status_kepegawaian, jenis_ptk, gelar_depan, gelar_belakang, jenjang_pendidikan, jurusan_prodi, sertifikasi, tmt_kerja, jabatan_ptk, tugas_tambahan, mengajar, jam_tugas_tambahan, jjm, total_jjm, siswa, kompetensi } = req.body;
  const { id } = req.params;
  if (!nama_lengkap) return res.status(400).json({ error: "Nama lengkap harus diisi" });
  const cleanPegawai = (v) => {
    if (typeof v === "string") {
      const t = v.trim();
      return t === "" || t === "-" ? null : t;
    }
    return v === void 0 || v === null ? null : v;
  };
  try {
    await getPool().execute(
      `UPDATE pegawai SET 
                nama_lengkap = ?, nuptk = ?, jenis_kelamin = ?, nip = ?, nik = ?, tempat_lahir = ?, 
                tanggal_lahir = ?, status_kepegawaian = ?, jenis_ptk = ?, gelar_depan = ?, 
                gelar_belakang = ?, jenjang_pendidikan = ?, jurusan_prodi = ?, sertifikasi = ?, 
                tmt_kerja = ?, jabatan_ptk = ?, tugas_tambahan = ?, mengajar = ?, 
                jam_tugas_tambahan = ?, jjm = ?, total_jjm = ?, siswa = ?, kompetensi = ?
            WHERE pegawai_id = ?`,
      [nama_lengkap, nuptk || null, jenis_kelamin || null, nip || null, nik || null, tempat_lahir || null, tanggal_lahir || null, status_kepegawaian || "Honorer", jenis_ptk || null, gelar_depan || null, gelar_belakang || null, jenjang_pendidikan || null, jurusan_prodi || null, sertifikasi || null, tmt_kerja || null, jabatan_ptk || null, tugas_tambahan || null, mengajar || null, jam_tugas_tambahan || null, jjm || null, total_jjm || null, siswa || null, kompetensi || null, id].map(cleanPegawai)
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "NIK atau NIP sudah terdaftar" });
    throw err;
  }
}));
app.delete("/api/pegawai/:id", authenticate, asyncHandler(async (req, res) => {
  await getPool().execute("DELETE FROM pegawai WHERE pegawai_id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.get("/api/pegawai/search", authenticate, asyncHandler(async (req, res) => {
  const q = req.query.q;
  const [rows] = await getPool().execute(
    "SELECT pegawai_id as id, nama_lengkap, nip, nik FROM pegawai WHERE nama_lengkap LIKE ? OR nip LIKE ? OR nik LIKE ? LIMIT 10",
    [`%${q}%`, `%${q}%`, `%${q}%`]
  );
  res.json(rows);
}));
app.get("/api/pengguna_web", authenticate, asyncHandler(async (req, res) => {
  const [rows] = await getPool().execute(`
        SELECT wu.*, s.nama_lengkap, r.name as role_name 
        FROM pengguna_web wu
        LEFT JOIN pegawai s ON wu.staff_id = s.pegawai_id
        LEFT JOIN peran r ON wu.role_id = r.id
    `);
  res.json(rows);
}));
app.post("/api/pengguna_web", authenticate, asyncHandler(async (req, res) => {
  const { staff_id, role_id, username, password } = req.body;
  const hashedPassword = await import_bcryptjs.default.hash(password, 10);
  await getPool().execute(
    "INSERT INTO pengguna_web (staff_id, role_id, username, password) VALUES (?, ?, ?, ?)",
    [clean(staff_id), clean(role_id), clean(username), hashedPassword]
  );
  res.json({ success: true });
}));
app.delete("/api/pengguna_web/:id", authenticate, asyncHandler(async (req, res) => {
  const [user] = await getPool().execute(
    "SELECT r.name FROM pengguna_web pw LEFT JOIN peran r ON pw.role_id = r.id WHERE pw.id = ?",
    [req.params.id]
  );
  if (user.length > 0 && user[0].name && user[0].name.toLowerCase() === "superadmin") {
    return res.status(403).json({ error: "Tidak dapat menghapus Superadmin" });
  }
  await getPool().execute("DELETE FROM pengguna_web WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.post("/api/pengguna_web/:id/reset-password", authenticate, asyncHandler(async (req, res) => {
  const { password, useNik } = req.body;
  let newPassword = password;
  const [user] = await getPool().execute(
    "SELECT pw.username, pw.staff_id, r.name, s.nik FROM pengguna_web pw LEFT JOIN peran r ON pw.role_id = r.id LEFT JOIN pegawai s ON pw.staff_id = s.pegawai_id WHERE pw.id = ?",
    [req.params.id]
  );
  if (user.length === 0) return res.status(404).json({ error: "User tidak ditemukan" });
  if (user[0].name && user[0].name.toLowerCase() === "superadmin" && !user[0].staff_id) {
    return res.status(403).json({ error: "Tidak dapat mereset password Superadmin Utama" });
  }
  if (useNik) {
    if (!user[0].nik) return res.status(400).json({ error: "User ini tidak memiliki NIK yang valid" });
    newPassword = user[0].nik;
  }
  if (!newPassword) return res.status(400).json({ error: "Password diperlukan" });
  const hashedPassword = await import_bcryptjs.default.hash(newPassword, 10);
  await getPool().execute("UPDATE pengguna_web SET password = ? WHERE id = ?", [hashedPassword, req.params.id]);
  res.json({ success: true });
}));
app.post("/api/siswa/import", authenticate, asyncHandler(async (req, res) => {
  const perms = req.user?.permissions || [];
  if (!perms.includes("all") && !perms.includes("students:import")) {
    return res.status(403).json({ error: "Access denied" });
  }
  const data = req.body;
  if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ error: "Data kosong atau tidak valid." });
  const conn = await getPool().getConnection();
  try {
    const [existingRows] = await conn.execute("SELECT id, nipd, nisn, nik, tahun_pelajaran, semester, rombel FROM siswa");
    const existingMap = /* @__PURE__ */ new Map();
    const existingByNIPD = /* @__PURE__ */ new Map();
    const existingByNISN = /* @__PURE__ */ new Map();
    const existingByNIK = /* @__PURE__ */ new Map();
    for (const r of existingRows) {
      existingMap.set(r.id, r);
      if (r.nipd && r.nipd.trim() && r.nipd.trim() !== "-") existingByNIPD.set(r.nipd.trim(), r.id);
      if (r.nisn && r.nisn.trim() && r.nisn.trim() !== "-") existingByNISN.set(r.nisn.trim(), r.id);
      if (r.nik && r.nik.trim() && r.nik.trim() !== "-") existingByNIK.set(r.nik.trim(), r.id);
    }
    await conn.beginTransaction();
    try {
      let processed = 0, skipped = 0, inserted = 0, updated = 0;
      const extractFields = (row, map) => {
        const obj = {};
        for (const [excelKey, dbKey] of Object.entries(map)) {
          const foundKey = Object.keys(row).find((k) => k.trim().toLowerCase() === excelKey.toLowerCase());
          if (foundKey && row[foundKey] !== void 0 && row[foundKey] !== "") {
            obj[dbKey] = row[foundKey];
          }
        }
        return obj;
      };
      for (const row of data) {
        const nipd = row.nipd ? String(row.nipd).trim() : null;
        const nisn = row.nisn ? String(row.nisn).trim() : null;
        if (!nipd && !nisn) {
          processed++;
          skipped++;
          continue;
        }
        const siswaMap = {
          "tahun_pelajaran": "tahun_pelajaran",
          "semester": "semester",
          "nipd": "nipd",
          "nisn": "nisn",
          "nik": "nik",
          "nama_lengkap": "nama_lengkap",
          "jenis_kelamin": "jenis_kelamin",
          "tempat_lahir": "tempat_lahir",
          "tanggal_lahir": "tanggal_lahir",
          "agama": "agama",
          "kewarganegaraan": "kewarganegaraan",
          "alamat_jalan": "alamat_jalan",
          "rt": "rt",
          "rw": "rw",
          "provinsi": "provinsi",
          "kota": "kota",
          "kecamatan": "kecamatan",
          "kelurahan": "kelurahan",
          "kode_pos": "kode_pos",
          "lintang": "lintang",
          "bujur": "bujur",
          "nomor_kk": "nomor_kk",
          "tempat_tinggal": "tempat_tinggal",
          "moda_transportasi": "moda_transportasi",
          "rombel": "rombel",
          "tk_paud": "tk_paud",
          "nama_tk_paud": "nama_tk_paud",
          "nomor_akte_lahir": "nomor_akte_lahir",
          "skhun": "skhun",
          "no_peserta_ujian_nasioal": "no_peserta_ujian_nasioal",
          "no_seri_ijazah": "no_seri_ijazah",
          "sekolah_asal": "sekolah_asal",
          "kebutuhan_khusus": "kebutuhan_khusus"
        };
        const siswaData = extractFields(row, siswaMap);
        if (siswaData.rombel && typeof siswaData.rombel === "string") {
          siswaData.rombel = siswaData.rombel.replace(/^Kelas\s+/i, "").trim();
        }
        if (row.status_aktif !== void 0) {
          siswaData.status_aktif = row.status_aktif === true || row.status_aktif === 1 || String(row.status_aktif).toLowerCase() === "true" || String(row.status_aktif).toLowerCase() === "1" ? 1 : 0;
        }
        let siswaId = null;
        let resolvedOldStudent = null;
        const nikVal = row.nik ? String(row.nik).trim() : null;
        if (nipd && existingByNIPD.has(nipd)) resolvedOldStudent = existingMap.get(existingByNIPD.get(nipd));
        else if (nisn && existingByNISN.has(nisn)) resolvedOldStudent = existingMap.get(existingByNISN.get(nisn));
        else if (nikVal && existingByNIK.has(nikVal)) resolvedOldStudent = existingMap.get(existingByNIK.get(nikVal));
        if (resolvedOldStudent) {
          siswaId = resolvedOldStudent.id;
          const isDifferentYear = siswaData.tahun_pelajaran && resolvedOldStudent.tahun_pelajaran !== siswaData.tahun_pelajaran;
          const isDifferentSemester = siswaData.semester && resolvedOldStudent.semester !== siswaData.semester;
          if (isDifferentYear || isDifferentSemester) {
            await conn.execute(`INSERT INTO arsip_siswa (siswa_id, tahun_pelajaran, semester, rombel) VALUES (?,?,?,?)`, [
              siswaId,
              resolvedOldStudent.tahun_pelajaran,
              resolvedOldStudent.semester,
              resolvedOldStudent.rombel
            ]);
          }
          const fields = Object.keys(siswaData);
          if (fields.length > 0) {
            const setPairs = fields.map((f) => `${f}=?`);
            const values = fields.map((f) => siswaData[f]);
            await conn.execute(`UPDATE siswa SET ${setPairs.join(",")} WHERE id=?`, [...values, siswaId]);
          }
          updated++;
        } else {
          siswaId = import_crypto.default.randomUUID();
          siswaData.id = siswaId;
          const fields = Object.keys(siswaData);
          const values = fields.map((f) => siswaData[f]);
          const [res2] = await conn.execute(
            `INSERT INTO siswa (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`,
            values
          );
          if (nipd) existingByNIPD.set(nipd, siswaId);
          if (nisn) existingByNISN.set(nisn, siswaId);
          if (nikVal) existingByNIK.set(nikVal, siswaId);
          existingMap.set(siswaId, { id: siswaId, nipd, nisn, nik: nikVal, tahun_pelajaran: siswaData.tahun_pelajaran, semester: siswaData.semester, rombel: siswaData.rombel });
          inserted++;
        }
        const upsertRelation = async (table, uniqueCol, uniqueVal, extraMatch, dataObj) => {
          if (Object.keys(dataObj).length === 0) return;
          let query = `SELECT id FROM ${table} WHERE ${uniqueCol} = ?`;
          let params = [uniqueVal];
          if (extraMatch) query += ` AND ${extraMatch}`;
          const [rows] = await conn.execute(query, params);
          if (rows.length > 0) {
            const id = rows[0].id;
            const fields = Object.keys(dataObj);
            const setPairs = fields.map((f) => `${f}=?`);
            const values = fields.map((f) => dataObj[f]);
            await conn.execute(`UPDATE ${table} SET ${setPairs.join(",")} WHERE id=?`, [...values, id]);
          } else {
            dataObj[uniqueCol] = uniqueVal;
            if (extraMatch && extraMatch.includes("tipe = 'ayah'")) dataObj["tipe"] = "ayah";
            if (extraMatch && extraMatch.includes("tipe = 'ibu'")) dataObj["tipe"] = "ibu";
            const fields = Object.keys(dataObj);
            const values = fields.map((f) => dataObj[f]);
            await conn.execute(
              `INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`,
              values
            );
          }
        };
        const ayahMap = { "nama_ayah": "nama", "nik_ayah": "nik", "tahun_lahir_ayah": "tahun_lahir", "pendidikan_ayah": "pendidikan", "pekerjaan_ayah": "pekerjaan", "penghasilan_ayah": "penghasilan", "kebutuhan_khusus_ayah": "kebutuhan_khusus" };
        await upsertRelation("data_orang_tua", "siswa_id", siswaId, "tipe = 'ayah'", extractFields(row, ayahMap));
        const ibuMap = { "nama_ibu": "nama", "nik_ibu": "nik", "tahun_lahir_ibu": "tahun_lahir", "pendidikan_ibu": "pendidikan", "pekerjaan_ibu": "pekerjaan", "penghasilan_ibu": "penghasilan", "kebutuhan_khusus_ibu": "kebutuhan_khusus" };
        await upsertRelation("data_orang_tua", "siswa_id", siswaId, "tipe = 'ibu'", extractFields(row, ibuMap));
        const waliMap = { "nama_wali": "nama", "nik_wali": "nik", "tahun_lahir_wali": "tahun_lahir", "pendidikan_wali": "pendidikan", "pekerjaan_wali": "pekerjaan", "penghasilan_wali": "penghasilan" };
        await upsertRelation("data_wali", "siswa_id", siswaId, null, extractFields(row, waliMap));
        const kontakMap = { "telepon_rumah": "telepon_rumah", "hp_orang_tua": "nomor_hp", "email_orang_tua": "email" };
        await upsertRelation("data_kontak", "siswa_id", siswaId, null, extractFields(row, kontakMap));
        const periodikMap = { "tinggi_badan": "tinggi_badan", "berat_badan": "berat_badan", "jarak_rumah": "jarak_rumah", "waktu_tempuh": "waktu_tempuh", "anak_keberapa": "anak_keberapa", "jumlah_saudara_kandung": "jumlah_saudara_kandung", "lingkar_kepala": "lingkar_kepala" };
        await upsertRelation("data_periodik", "siswa_id", siswaId, null, extractFields(row, periodikMap));
        const afirmasiMap = { "penerima_kps_pkh": "penerima_kps_pkh", "nomor_kks": "nomor_kks", "penerima_kip": "penerima_kip", "nomor_kip": "nomor_kip", "nama_sesuai_kip": "nama_sesuai_kip", "nomor_kps": "nomor_kps", "bank_pip": "bank_pip", "nomor_rek_pip": "nomor_rek_pip", "atasnama_rek_pip": "atasnama_rek_pip", "layak_pip": "layak_pip", "alasan_layak_pip": "alasan_layak_pip" };
        await upsertRelation("data_afirmasi", "siswa_id", siswaId, null, extractFields(row, afirmasiMap));
        processed++;
      }
      await conn.commit();
      res.json({ success: true, message: `Impor selesai. ${processed} diproses (${inserted} baru, ${updated} diperbarui, ${skipped} dilewati - tanpa NIPD/NISN).` });
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Import Students Error:", error);
    res.status(500).json({ error: `Gagal impor: ${error.message}` });
  } finally {
    conn.release();
  }
}));
app.get("/api/siswa", authenticate, asyncHandler(async (req, res) => {
  let whereClause = "";
  const params = [];
  if (req.user.type === "staff") {
    const perms = req.user.permissions || [];
    if (!perms.includes("all")) {
      const [rombelRows] = await getPool().execute("SELECT name FROM rombongan_belajar WHERE wali_kelas_id = ?", [req.user.staff_id]);
      if (rombelRows.length > 0) {
        const names = rombelRows.map((r) => r.name);
        whereClause = `WHERE s.rombel IN (${names.map(() => "?").join(",")})`;
        params.push(...names);
      }
    }
  }
  const [rows] = await getPool().execute(`
        SELECT 
            s.*,
            dot_ayah.nama as nama_ayah, dot_ayah.nik as nik_ayah, dot_ayah.tahun_lahir as tahun_lahir_ayah, dot_ayah.pendidikan as pendidikan_ayah, dot_ayah.pekerjaan as pekerjaan_ayah, dot_ayah.penghasilan as penghasilan_ayah, dot_ayah.kebutuhan_khusus as kebutuhan_khusus_ayah,
            dot_ibu.nama as nama_ibu, dot_ibu.nik as nik_ibu, dot_ibu.tahun_lahir as tahun_lahir_ibu, dot_ibu.pendidikan as pendidikan_ibu, dot_ibu.pekerjaan as pekerjaan_ibu, dot_ibu.penghasilan as penghasilan_ibu, dot_ibu.kebutuhan_khusus as kebutuhan_khusus_ibu,
            dw.nama as nama_wali, dw.nik as nik_wali, dw.tahun_lahir as tahun_lahir_wali, dw.pendidikan as pendidikan_wali, dw.pekerjaan as pekerjaan_wali, dw.penghasilan as penghasilan_wali,
            dk.telepon_rumah as telepon_rumah, dk.nomor_hp as hp_orang_tua, dk.email as email_orang_tua,
            dp.tinggi_badan, dp.berat_badan, dp.lingkar_kepala, dp.jarak_rumah, dp.waktu_tempuh, dp.anak_keberapa, dp.jumlah_saudara_kandung,
            da.nomor_kks, da.penerima_kps_pkh, da.penerima_kip, da.nomor_kip, da.nama_sesuai_kip, da.nomor_kps, da.bank_pip, da.nomor_rek_pip, da.atasnama_rek_pip, da.layak_pip, da.alasan_layak_pip
         FROM siswa s
        LEFT JOIN data_orang_tua dot_ayah ON s.id = dot_ayah.siswa_id AND dot_ayah.tipe = 'ayah'
        LEFT JOIN data_orang_tua dot_ibu ON s.id = dot_ibu.siswa_id AND dot_ibu.tipe = 'ibu'
        LEFT JOIN data_wali dw ON s.id = dw.siswa_id
        LEFT JOIN data_kontak dk ON s.id = dk.siswa_id
        LEFT JOIN data_periodik dp ON s.id = dp.siswa_id
        LEFT JOIN data_afirmasi da ON s.id = da.siswa_id
        ${whereClause}
    `, params);
  res.json(rows);
}));
app.get("/api/siswa/search", authenticate, asyncHandler(async (req, res) => {
  const q = req.query.q;
  const [rows] = await getPool().execute(
    "SELECT id, nama_lengkap, nisn, nik, nipd FROM siswa WHERE nisn LIKE ? OR nik LIKE ? LIMIT 5",
    [`%${q}%`, `%${q}%`]
  );
  res.json(rows);
}));
app.post("/api/siswa", authenticate, asyncHandler(async (req, res) => {
  const s = req.body;
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const clean2 = (val) => val === "" ? null : val;
    const siswaId = import_crypto.default.randomUUID();
    await conn.execute(
      `INSERT INTO siswa (id, tahun_pelajaran, semester, nipd, nisn, nik, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, kewarganegaraan, alamat_jalan, rt, rw, provinsi, kota, kecamatan, kelurahan, kode_pos, lintang, bujur, nomor_kk, tempat_tinggal, moda_transportasi, rombel, tk_paud, nama_tk_paud, nomor_akte_lahir, skhun, no_peserta_ujian_nasioal, no_seri_ijazah, sekolah_asal, kebutuhan_khusus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [siswaId, s.tahun_pelajaran, s.semester, s.nipd, s.nisn, s.nik, s.nama_lengkap, s.jenis_kelamin, s.tempat_lahir, s.tanggal_lahir, s.agama, s.kewarganegaraan || "Indonesia", s.alamat_jalan, s.rt, s.rw, s.provinsi, s.kota, s.kecamatan, s.kelurahan, s.kode_pos, s.lintang, s.bujur, s.nomor_kk, s.tempat_tinggal, s.moda_transportasi, s.rombel, s.tk_paud || "Tidak", s.nama_tk_paud, s.nomor_akte_lahir, s.skhun, s.no_peserta_ujian_nasioal, s.no_seri_ijazah, s.sekolah_asal, s.kebutuhan_khusus || "Tidak"].map(clean2)
    );
    await conn.execute(
      `INSERT INTO data_orang_tua (siswa_id, tipe, nama, nik, tahun_lahir, pendidikan, pekerjaan, penghasilan, kebutuhan_khusus) VALUES (?, 'ayah', ?, ?, ?, ?, ?, ?, ?)`,
      [siswaId, s.nama_ayah, s.nik_ayah, s.tahun_lahir_ayah, s.pendidikan_ayah, s.pekerjaan_ayah, s.penghasilan_ayah, s.kebutuhan_khusus_ayah || "Tidak"].map(clean2)
    );
    await conn.execute(
      `INSERT INTO data_orang_tua (siswa_id, tipe, nama, nik, tahun_lahir, pendidikan, pekerjaan, penghasilan, kebutuhan_khusus) VALUES (?, 'ibu', ?, ?, ?, ?, ?, ?, ?)`,
      [siswaId, s.nama_ibu, s.nik_ibu, s.tahun_lahir_ibu, s.pendidikan_ibu, s.pekerjaan_ibu, s.penghasilan_ibu, s.kebutuhan_khusus_ibu || "Tidak"].map(clean2)
    );
    if (s.nama_wali) {
      await conn.execute(
        `INSERT INTO data_wali (siswa_id, nama, nik, tahun_lahir, pendidikan, pekerjaan, penghasilan) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [siswaId, s.nama_wali, s.nik_wali, s.tahun_lahir_wali, s.pendidikan_wali, s.pekerjaan_wali, s.penghasilan_wali].map(clean2)
      );
    }
    await conn.execute(
      `INSERT INTO data_kontak (siswa_id, telepon_rumah, nomor_hp, email) VALUES (?, ?, ?, ?)`,
      [siswaId, s.telepon_rumah, s.hp_orang_tua, s.email_orang_tua].map(clean2)
    );
    await conn.execute(
      `INSERT INTO data_periodik (siswa_id, tinggi_badan, berat_badan, lingkar_kepala, jarak_rumah, waktu_tempuh, anak_keberapa, jumlah_saudara_kandung) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [siswaId, s.tinggi_badan, s.berat_badan, s.lingkar_kepala, s.jarak_rumah, s.waktu_tempuh, s.anak_keberapa, s.jumlah_saudara_kandung].map(clean2)
    );
    await conn.execute(
      `INSERT INTO data_afirmasi (siswa_id, nomor_kks, penerima_kps_pkh, nomor_kps, penerima_kip, nomor_kip, nama_sesuai_kip, bank_pip, nomor_rek_pip, atasnama_rek_pip, layak_pip, alasan_layak_pip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [siswaId, s.nomor_kks, s.penerima_kps_pkh || "Tidak", s.nomor_kps, s.penerima_kip || "Tidak", s.nomor_kip, s.nama_sesuai_kip, s.bank_pip, s.nomor_rek_pip, s.atasnama_rek_pip, s.layak_pip || "Tidak", s.alasan_layak_pip].map(clean2)
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Error creating student:", err);
    res.status(500).json({ error: "Failed to create student: " + err.message });
  } finally {
    conn.release();
  }
}));
app.put("/api/siswa/:id", authenticate, asyncHandler(async (req, res) => {
  const s = req.body;
  const siswaId = req.params.id;
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const clean2 = (val) => val === "" ? null : val;
    await conn.execute(
      `UPDATE siswa SET tahun_pelajaran = ?, semester = ?, nipd = ?, nisn = ?, nik = ?, nama_lengkap = ?, jenis_kelamin = ?, tempat_lahir = ?, tanggal_lahir = ?, agama = ?, kewarganegaraan = ?, alamat_jalan = ?, rt = ?, rw = ?, provinsi = ?, kota = ?, kecamatan = ?, kelurahan = ?, kode_pos = ?, lintang = ?, bujur = ?, nomor_kk = ?, tempat_tinggal = ?, moda_transportasi = ?, rombel = ?, tk_paud = ?, nama_tk_paud = ?, nomor_akte_lahir = ?, skhun = ?, no_peserta_ujian_nasioal = ?, no_seri_ijazah = ?, sekolah_asal = ?, kebutuhan_khusus = ? WHERE id = ?`,
      [s.tahun_pelajaran, s.semester, s.nipd, s.nisn, s.nik, s.nama_lengkap, s.jenis_kelamin, s.tempat_lahir, s.tanggal_lahir, s.agama, s.kewarganegaraan || "Indonesia", s.alamat_jalan, s.rt, s.rw, s.provinsi, s.kota, s.kecamatan, s.kelurahan, s.kode_pos, s.lintang, s.bujur, s.nomor_kk, s.tempat_tinggal, s.moda_transportasi, s.rombel, s.tk_paud || "Tidak", s.nama_tk_paud, s.nomor_akte_lahir, s.skhun, s.no_peserta_ujian_nasioal, s.no_seri_ijazah, s.sekolah_asal, s.kebutuhan_khusus || "Tidak", siswaId].map(clean2)
    );
    const [ayahRows] = await conn.execute("SELECT id FROM data_orang_tua WHERE siswa_id = ? AND tipe = 'ayah'", [siswaId]);
    if (ayahRows.length > 0) {
      await conn.execute(
        `UPDATE data_orang_tua SET nama = ?, nik = ?, tahun_lahir = ?, pendidikan = ?, pekerjaan = ?, penghasilan = ?, kebutuhan_khusus = ? WHERE siswa_id = ? AND tipe = 'ayah'`,
        [s.nama_ayah, s.nik_ayah, s.tahun_lahir_ayah, s.pendidikan_ayah, s.pekerjaan_ayah, s.penghasilan_ayah, s.kebutuhan_khusus_ayah || "Tidak", siswaId].map(clean2)
      );
    } else {
      await conn.execute(
        `INSERT INTO data_orang_tua (siswa_id, tipe, nama, nik, tahun_lahir, pendidikan, pekerjaan, penghasilan, kebutuhan_khusus) VALUES (?, 'ayah', ?, ?, ?, ?, ?, ?, ?)`,
        [siswaId, s.nama_ayah, s.nik_ayah, s.tahun_lahir_ayah, s.pendidikan_ayah, s.pekerjaan_ayah, s.penghasilan_ayah, s.kebutuhan_khusus_ayah || "Tidak"].map(clean2)
      );
    }
    const [ibuRows] = await conn.execute("SELECT id FROM data_orang_tua WHERE siswa_id = ? AND tipe = 'ibu'", [siswaId]);
    if (ibuRows.length > 0) {
      await conn.execute(
        `UPDATE data_orang_tua SET nama = ?, nik = ?, tahun_lahir = ?, pendidikan = ?, pekerjaan = ?, penghasilan = ?, kebutuhan_khusus = ? WHERE siswa_id = ? AND tipe = 'ibu'`,
        [s.nama_ibu, s.nik_ibu, s.tahun_lahir_ibu, s.pendidikan_ibu, s.pekerjaan_ibu, s.penghasilan_ibu, s.kebutuhan_khusus_ibu || "Tidak", siswaId].map(clean2)
      );
    } else {
      await conn.execute(
        `INSERT INTO data_orang_tua (siswa_id, tipe, nama, nik, tahun_lahir, pendidikan, pekerjaan, penghasilan, kebutuhan_khusus) VALUES (?, 'ibu', ?, ?, ?, ?, ?, ?, ?)`,
        [siswaId, s.nama_ibu, s.nik_ibu, s.tahun_lahir_ibu, s.pendidikan_ibu, s.pekerjaan_ibu, s.penghasilan_ibu, s.kebutuhan_khusus_ibu || "Tidak"].map(clean2)
      );
    }
    const [waliRows] = await conn.execute("SELECT id FROM data_wali WHERE siswa_id = ?", [siswaId]);
    if (waliRows.length > 0) {
      await conn.execute(
        `UPDATE data_wali SET nama = ?, nik = ?, tahun_lahir = ?, pendidikan = ?, pekerjaan = ?, penghasilan = ? WHERE siswa_id = ?`,
        [s.nama_wali, s.nik_wali, s.tahun_lahir_wali, s.pendidikan_wali, s.pekerjaan_wali, s.penghasilan_wali, siswaId].map(clean2)
      );
    } else if (s.nama_wali) {
      await conn.execute(
        `INSERT INTO data_wali (siswa_id, nama, nik, tahun_lahir, pendidikan, pekerjaan, penghasilan) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [siswaId, s.nama_wali, s.nik_wali, s.tahun_lahir_wali, s.pendidikan_wali, s.pekerjaan_wali, s.penghasilan_wali].map(clean2)
      );
    }
    const [kontakRows] = await conn.execute("SELECT id FROM data_kontak WHERE siswa_id = ?", [siswaId]);
    if (kontakRows.length > 0) {
      await conn.execute(
        `UPDATE data_kontak SET telepon_rumah = ?, nomor_hp = ?, email = ? WHERE siswa_id = ?`,
        [s.telepon_rumah, s.hp_orang_tua, s.email_orang_tua, siswaId].map(clean2)
      );
    } else {
      await conn.execute(
        `INSERT INTO data_kontak (siswa_id, telepon_rumah, nomor_hp, email) VALUES (?, ?, ?, ?)`,
        [siswaId, s.telepon_rumah, s.hp_orang_tua, s.email_orang_tua].map(clean2)
      );
    }
    const [periodikRows] = await conn.execute("SELECT id FROM data_periodik WHERE siswa_id = ?", [siswaId]);
    if (periodikRows.length > 0) {
      await conn.execute(
        `UPDATE data_periodik SET tinggi_badan = ?, berat_badan = ?, lingkar_kepala = ?, jarak_rumah = ?, waktu_tempuh = ?, anak_keberapa = ?, jumlah_saudara_kandung = ? WHERE siswa_id = ?`,
        [s.tinggi_badan, s.berat_badan, s.lingkar_kepala, s.jarak_rumah, s.waktu_tempuh, s.anak_keberapa, s.jumlah_saudara_kandung, siswaId].map(clean2)
      );
    } else {
      await conn.execute(
        `INSERT INTO data_periodik (siswa_id, tinggi_badan, berat_badan, lingkar_kepala, jarak_rumah, waktu_tempuh, anak_keberapa, jumlah_saudara_kandung) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [siswaId, s.tinggi_badan, s.berat_badan, s.lingkar_kepala, s.jarak_rumah, s.waktu_tempuh, s.anak_keberapa, s.jumlah_saudara_kandung].map(clean2)
      );
    }
    const [afirmasiRows] = await conn.execute("SELECT id FROM data_afirmasi WHERE siswa_id = ?", [siswaId]);
    if (afirmasiRows.length > 0) {
      await conn.execute(
        `UPDATE data_afirmasi SET nomor_kks = ?, penerima_kps_pkh = ?, nomor_kps = ?, penerima_kip = ?, nomor_kip = ?, nama_sesuai_kip = ?, bank_pip = ?, nomor_rek_pip = ?, atasnama_rek_pip = ?, layak_pip = ?, alasan_layak_pip = ? WHERE siswa_id = ?`,
        [s.nomor_kks, s.penerima_kps_pkh || "Tidak", s.nomor_kps, s.penerima_kip || "Tidak", s.nomor_kip, s.nama_sesuai_kip, s.bank_pip, s.nomor_rek_pip, s.atasnama_rek_pip, s.layak_pip || "Tidak", s.alasan_layak_pip, siswaId].map(clean2)
      );
    } else {
      await conn.execute(
        `INSERT INTO data_afirmasi (siswa_id, nomor_kks, penerima_kps_pkh, nomor_kps, penerima_kip, nomor_kip, nama_sesuai_kip, bank_pip, nomor_rek_pip, atasnama_rek_pip, layak_pip, alasan_layak_pip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [siswaId, s.nomor_kks, s.penerima_kps_pkh || "Tidak", s.nomor_kps, s.penerima_kip || "Tidak", s.nomor_kip, s.nama_sesuai_kip, s.bank_pip, s.nomor_rek_pip, s.atasnama_rek_pip, s.layak_pip || "Tidak", s.alasan_layak_pip].map(clean2)
      );
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Error updating student:", err);
    res.status(500).json({ error: "Failed to update student: " + err.message });
  } finally {
    conn.release();
  }
}));
app.delete("/api/siswa/:id", authenticate, asyncHandler(async (req, res) => {
  await getPool().execute("DELETE FROM siswa WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.get("/api/me", authenticate, asyncHandler(async (req, res) => {
  if (req.user.type === "staff") {
    const [rows] = await getPool().execute(`
            SELECT wu.*, s.nama_lengkap, r.name as role_name, r.permissions 
            FROM pengguna_web wu
            LEFT JOIN pegawai s ON wu.staff_id = s.pegawai_id
            LEFT JOIN peran r ON wu.role_id = r.id 
            WHERE wu.username = ?
        `, [req.user.username]);
    if (rows.length > 0) return res.json({ ...rows[0], type: "pegawai" });
    if (req.user.username === process.env.ADMIN_USERNAME && req.user.role === "Admin") {
      return res.json({ nama_lengkap: "System Admin", role_name: "Admin", permissions: '["all"]', type: "pegawai" });
    }
  } else if (req.user.type === "student") {
    const id = req.user.id || "not-found";
    const nisn = req.user.nisn || req.user.username || "not-found";
    const [rows] = await getPool().execute("SELECT * FROM siswa WHERE id = ? OR nisn = ?", [id, nisn]);
    if (rows.length > 0) return res.json({ ...rows[0], type: "student", role_name: "Student", permissions: "[]" });
  }
  res.status(404).json({ error: "User not found" });
}));
app.post("/api/staff/profile/photo", authenticate, uploadProfile.single("photo"), asyncHandler(async (req, res) => {
  if (req.user.type !== "staff") return res.status(403).json({ error: "Access denied" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const [userRows] = await getPool().execute(
    "SELECT pw.staff_id, p.nik FROM pengguna_web pw LEFT JOIN pegawai p ON pw.staff_id = p.pegawai_id WHERE pw.username = ?",
    [req.user.username]
  );
  if (userRows.length === 0 || !userRows[0].staff_id) return res.status(404).json({ error: "Staff profile not found" });
  const staffId = userRows[0].staff_id;
  const nik = userRows[0].nik || `staff_${staffId}`;
  const ext = import_path.default.extname(req.file.originalname);
  const newFileName = `${nik}${ext}`;
  const newPath = import_path.default.join(uploadDir, "profiles", "pegawai", newFileName);
  import_fs.default.renameSync(req.file.path, newPath);
  const photoUrl = `/uploads/profiles/pegawai/${newFileName}`;
  await getPool().execute("UPDATE pegawai SET foto_profil = ? WHERE pegawai_id = ?", [photoUrl, staffId]);
  res.json({ message: "Photo uploaded successfully", photo_url: photoUrl });
}));
app.get("/api/student/profile", authenticate, asyncHandler(async (req, res) => {
  if (req.user.type !== "student") return res.status(403).json({ error: "Access denied" });
  const id = req.user.id || "not-found";
  const nisn = req.user.nisn || req.user.username || "not-found";
  const [rows] = await getPool().execute(`
        SELECT 
            s.*,
            dot_ayah.nama as nama_ayah, dot_ayah.nik as nik_ayah, dot_ayah.pekerjaan as pekerjaan_ayah,
            dot_ibu.nama as nama_ibu, dot_ibu.nik as nik_ibu, dot_ibu.pekerjaan as pekerjaan_ibu,
            dw.nama as nama_wali, dw.nik as nik_wali, dw.pekerjaan as pekerjaan_wali,
            dk.nomor_hp as hp_orang_tua, dk.email as email_orang_tua
         FROM siswa s
        LEFT JOIN data_orang_tua dot_ayah ON s.id = dot_ayah.siswa_id AND dot_ayah.tipe = 'ayah'
        LEFT JOIN data_orang_tua dot_ibu ON s.id = dot_ibu.siswa_id AND dot_ibu.tipe = 'ibu'
        LEFT JOIN data_wali dw ON s.id = dw.siswa_id
        LEFT JOIN data_kontak dk ON s.id = dk.siswa_id
        LEFT JOIN data_periodik dp ON s.id = dp.siswa_id
        LEFT JOIN data_afirmasi da ON s.id = da.siswa_id
        WHERE s.id = ? OR s.nisn = ?`, [id, nisn]);
  res.json(rows[0] || null);
}));
app.post("/api/student/profile/photo", authenticate, uploadProfile.single("photo"), asyncHandler(async (req, res) => {
  if (req.user.type !== "student") return res.status(403).json({ error: "Access denied" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const id = req.user.id || null;
  const nisn = req.user.nisn || req.user.username || null;
  const [rows] = await getPool().execute("SELECT id, nipd FROM siswa WHERE id = ? OR nisn = ?", [id, nisn]);
  if (rows.length === 0) return res.status(404).json({ error: "Siswa not found" });
  const actualId = rows[0].id;
  const nipd = rows[0].nipd || `siswa_${actualId}`;
  const safeNipd = nipd.toString().replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = import_path.default.extname(req.file.originalname);
  const newFileName = `${safeNipd}${ext}`;
  const newPath = import_path.default.join(uploadDir, "profiles", "siswa", newFileName);
  import_fs.default.renameSync(req.file.path, newPath);
  const photoUrl = `/uploads/profiles/siswa/${newFileName}`;
  await getPool().execute("UPDATE siswa SET foto_profil = ? WHERE id = ?", [photoUrl, actualId]);
  res.json({ message: "Photo uploaded successfully", photo_url: photoUrl });
}));
app.get("/api/student/absensi", authenticate, asyncHandler(async (req, res) => {
  if (req.user.type !== "student") return res.status(403).json({ error: "Access denied" });
  const id = req.user.id || "not-found";
  const { start_date, end_date } = req.query;
  let dateFilter = "";
  const params = [id];
  if (start_date && end_date) {
    dateFilter = "AND tanggal >= ? AND tanggal <= ?";
    params.push(start_date, end_date);
  }
  const [rows] = await getPool().execute(`
        SELECT status, COUNT(*) as count 
        FROM absensi_siswa 
        WHERE student_id = ? ${dateFilter}
        GROUP BY status
    `, params);
  const [records] = await getPool().execute(`
        SELECT tanggal, status, keterangan 
        FROM absensi_siswa 
        WHERE student_id = ? ${dateFilter}
        ORDER BY tanggal DESC
    `, params);
  res.json({ summary: rows, records });
}));
app.get("/api/pengajuan_ubah_data", authenticate, asyncHandler(async (req, res) => {
  const [rows] = await getPool().execute(`
        SELECT dcr.*, s.nama_lengkap, s.nisn 
        FROM pengajuan_ubah_data dcr
        LEFT JOIN siswa s ON dcr.student_id = s.id
        ORDER BY dcr.created_at DESC
    `);
  res.json(rows);
}));
app.post("/api/pengajuan_ubah_data", authenticate, asyncHandler(async (req, res) => {
  if (req.user.type !== "student") return res.status(403).json({ error: "Only students can submit change requests" });
  const { proposed_data, document_url } = req.body;
  await getPool().execute(
    "INSERT INTO pengajuan_ubah_data (student_id, proposed_data, document_url) VALUES (?, ?, ?)",
    [req.user.id, JSON.stringify(proposed_data), document_url || null]
  );
  res.json({ success: true });
}));
app.post("/api/penerima/laporan", authenticate, asyncHandler(async (req, res) => {
  if (req.user.type !== "student") return res.status(403).json({ error: "Hanya siswa yang dapat mengirim laporan" });
  const { penerimaan_id, type, tgl_pencairan, tgl_penarikan, selfie_url, buku_tabungan_url, surat_pernyataan_url } = req.body;
  await getPool().execute(
    `INSERT INTO penerima_laporan 
        (student_id, penerimaan_id, type, tgl_pencairan, tgl_penarikan, selfie_url, buku_tabungan_url, surat_pernyataan_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, penerimaan_id, type, tgl_pencairan, tgl_penarikan, selfie_url, buku_tabungan_url, surat_pernyataan_url || null]
  );
  res.json({ success: true });
}));
app.get("/api/penerima/laporan/:type/:penerimaan_id", authenticate, asyncHandler(async (req, res) => {
  const { type, penerimaan_id } = req.params;
  const [rows] = await getPool().execute(
    "SELECT * FROM penerima_laporan WHERE type = ? AND penerimaan_id = ?",
    [type, penerimaan_id]
  );
  res.json(rows);
}));
app.post("/api/pengajuan_ubah_data/:id/approve", authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [requestRows] = await getPool().execute("SELECT * FROM pengajuan_ubah_data WHERE id = ?", [id]);
  if (requestRows.length === 0) return res.status(404).json({ error: "Request not found" });
  const request = requestRows[0];
  const proposedData = JSON.parse(request.proposed_data);
  const fields = Object.keys(proposedData);
  const values = Object.values(proposedData);
  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  await getPool().execute(
    `UPDATE siswa SET ${setClause} WHERE id = ?`,
    [...values, request.student_id]
  );
  await getPool().execute(
    "UPDATE pengajuan_ubah_data SET status = 'approved' WHERE id = ?",
    [id]
  );
  res.json({ success: true });
}));
app.post("/api/pengajuan_ubah_data/:id/reject", authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { admin_note } = req.body;
  await getPool().execute(
    "UPDATE pengajuan_ubah_data SET status = 'rejected', admin_note = ? WHERE id = ?",
    [admin_note, id]
  );
  res.json({ success: true });
}));
app.post("/api/login", asyncHandler(async (req, res) => {
  const { username, password, type } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const ua = req.headers["user-agent"];
  if (type === "staff") {
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = import_jsonwebtoken.default.sign({ username, role: "Admin", type: "staff", permissions: ["all"] }, JWT_SECRET, { expiresIn: "24h" });
      await getPool().execute(
        "INSERT INTO riwayat_masuk (type, username, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?)",
        ["staff", username, ip, ua, "success"]
      );
      return res.json({ success: true, token, role: "Admin", type: "staff" });
    }
    const [rows] = await getPool().execute(`
            SELECT wu.*, r.name as role_name, r.permissions
            FROM pengguna_web wu
            JOIN peran r ON wu.role_id = r.id
            WHERE wu.username = ?
        `, [username]);
    if (rows.length > 0) {
      const user = rows[0];
      const isMatch = await import_bcryptjs.default.compare(password, user.password);
      if (!isMatch) {
        await getPool().execute(
          "INSERT INTO riwayat_masuk (type, username, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?)",
          [type, username, ip, ua, "failed"]
        );
        return res.status(401).json({ error: "User tidak ditemukan atau password salah" });
      }
      if (!user.status_aktif) {
        await getPool().execute(
          "INSERT INTO riwayat_masuk (user_id, type, username, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?, ?)",
          [user.id, "staff", username, ip, ua, "failed"]
        );
        return res.status(403).json({ error: "Akun Anda telah dinonaktifkan. Silakan hubungi operator." });
      }
      const perms = (() => {
        try {
          return JSON.parse(user.permissions);
        } catch {
          return ["all"];
        }
      })();
      const token = import_jsonwebtoken.default.sign({ id: user.id, username: user.username, role: user.role_name, type: "staff", permissions: perms }, JWT_SECRET, { expiresIn: "24h" });
      await getPool().execute(
        "INSERT INTO riwayat_masuk (user_id, type, username, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?, ?)",
        [user.id, "staff", username, ip, ua, "success"]
      );
      return res.json({ success: true, token, role: user.role_name, type: "staff" });
    }
  } else if (type === "student") {
    const queryUsername = username || null;
    const queryPassword = password || null;
    const [rows] = await getPool().execute("SELECT * FROM siswa WHERE nisn = ? AND nipd = ?", [queryUsername, queryPassword]);
    if (rows.length > 0) {
      const student = rows[0];
      if (!student.status_aktif) {
        await getPool().execute(
          "INSERT INTO riwayat_masuk (student_id, type, username, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?, ?)",
          [student.id, "student", username, ip, ua, "failed"]
        );
        return res.status(403).json({ error: "Login siswa ditangguhkan. Silakan hubungi wali kelas." });
      }
      const token = import_jsonwebtoken.default.sign({ id: student.id, nisn: student.nisn, type: "student", permissions: [] }, JWT_SECRET, { expiresIn: "24h" });
      await getPool().execute(
        "INSERT INTO riwayat_masuk (student_id, type, username, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?, ?)",
        [student.id, "student", username, ip, ua, "success"]
      );
      return res.json({ success: true, token, type: "student" });
    }
  }
  await getPool().execute(
    "INSERT INTO riwayat_masuk (type, username, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?)",
    [type, username, ip, ua, "failed"]
  );
  res.status(401).json({ error: "User tidak ditemukan atau password salah" });
}));
app.get("/api/quick_links", authenticate, asyncHandler(async (req, res) => {
  let query = "SELECT * FROM quick_links ORDER BY created_at ASC";
  let params = [];
  if (req.user.type === "student") {
    query = "SELECT * FROM quick_links WHERE target_audience IN ('student', 'all') ORDER BY created_at ASC";
  } else if (req.user.type === "staff") {
    if (req.query.admin === "true") {
      query = "SELECT * FROM quick_links ORDER BY created_at ASC";
    } else {
      query = "SELECT * FROM quick_links WHERE target_audience IN ('staff', 'all') ORDER BY created_at ASC";
    }
  }
  const [rows] = await getPool().execute(query, params);
  res.json(rows);
}));
app.post("/api/quick_links", authenticate, asyncHandler(async (req, res) => {
  if (!req.user.permissions?.includes("all") && req.user.role !== "Admin") return res.status(403).json({ error: "Access denied" });
  const { title, url, target_audience, icon_name } = req.body;
  const [result] = await getPool().execute(
    "INSERT INTO quick_links (title, url, target_audience, icon_name) VALUES (?, ?, ?, ?)",
    [title, url, target_audience || "all", icon_name || "Link"]
  );
  const [rows] = await getPool().execute("SELECT * FROM quick_links WHERE id = ?", [result.insertId]);
  res.json(rows[0]);
}));
app.put("/api/quick_links/:id", authenticate, asyncHandler(async (req, res) => {
  if (!req.user.permissions?.includes("all") && req.user.role !== "Admin") return res.status(403).json({ error: "Access denied" });
  const { title, url, target_audience, icon_name } = req.body;
  await getPool().execute(
    "UPDATE quick_links SET title = ?, url = ?, target_audience = ?, icon_name = ? WHERE id = ?",
    [title, url, target_audience, icon_name, req.params.id]
  );
  const [rows] = await getPool().execute("SELECT * FROM quick_links WHERE id = ?", [req.params.id]);
  res.json(rows[0]);
}));
app.delete("/api/quick_links/:id", authenticate, asyncHandler(async (req, res) => {
  if (!req.user.permissions?.includes("all") && req.user.role !== "Admin") return res.status(403).json({ error: "Access denied" });
  await getPool().execute("DELETE FROM quick_links WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.get("/api/artikel_blog", asyncHandler(async (req, res) => {
  try {
    const [rows] = await getPool().execute("SELECT * FROM artikel_blog ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    if (err.message.includes("Table") && err.message.includes("doesn't exist")) {
      console.log("[DB] Blog table missing, creating now...");
      await getPool().query(`
                CREATE TABLE IF NOT EXISTS artikel_blog (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    image_url TEXT,
                    author_id INT,
                    author_name VARCHAR(255),
                    category VARCHAR(100) DEFAULT 'Kegiatan',
                    status VARCHAR(20) DEFAULT 'draft',
                    seo_tags TEXT,
                    created_at DATETIME DEFAULT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
      const [rows] = await getPool().execute("SELECT * FROM artikel_blog ORDER BY created_at DESC");
      return res.json(rows);
    }
    throw err;
  }
}));
app.get("/api/artikel_blog/:id", asyncHandler(async (req, res) => {
  const [rows] = await getPool().execute("SELECT * FROM artikel_blog WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Post tidak ditemukan" });
  res.json(rows[0]);
}));
app.post("/api/artikel_blog", authenticate, asyncHandler(async (req, res) => {
  const { title, content, image_url, category, status } = req.body;
  let { seo_tags } = req.body;
  if (!seo_tags) seo_tags = generateSEOTags(title, content);
  const author_id = req.user?.id || req.body.author_id;
  const author_name = req.user?.username || req.body.author_name;
  await getPool().execute(
    "INSERT INTO artikel_blog (title, content, image_url, author_id, author_name, category, status, seo_tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
    [title, content, image_url, author_id, author_name, category, status || "draft", seo_tags]
  );
  res.json({ success: true });
}));
app.put("/api/artikel_blog/:id", authenticate, asyncHandler(async (req, res) => {
  const { title, content, image_url, category, status } = req.body;
  let { seo_tags } = req.body;
  if (!seo_tags) seo_tags = generateSEOTags(title, content);
  await getPool().execute(
    "UPDATE artikel_blog SET title = ?, content = ?, image_url = ?, category = ?, status = ?, seo_tags = ? WHERE id = ?",
    [title, content, image_url, category, status || "draft", seo_tags, req.params.id]
  );
  res.json({ success: true });
}));
app.delete("/api/artikel_blog/:id", authenticate, asyncHandler(async (req, res) => {
  await getPool().execute("DELETE FROM artikel_blog WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.get("/api/galeri", asyncHandler(async (req, res) => {
  const [rows] = await getPool().execute("SELECT * FROM galeri ORDER BY created_at DESC");
  res.json(rows);
}));
app.post("/api/galeri", authenticate, asyncHandler(async (req, res) => {
  const { title, description, image_url } = req.body;
  let { seo_tags } = req.body;
  if (!image_url) return res.status(400).json({ error: "URL Gambar harus diisi" });
  if (!seo_tags) seo_tags = generateSEOTags(title || "", description || "");
  await getPool().execute(
    "INSERT INTO galeri (title, description, image_url, seo_tags) VALUES (?, ?, ?, ?)",
    [title || null, description || null, image_url, seo_tags]
  );
  res.json({ success: true });
}));
app.delete("/api/galeri/:id", authenticate, asyncHandler(async (req, res) => {
  await getPool().execute("DELETE FROM galeri WHERE id = ?", [req.params.id]);
  res.json({ success: true });
}));
app.get("/api/absensi", authenticate, asyncHandler(async (req, res) => {
  const { tanggal, rombel } = req.query;
  if (!tanggal || !rombel) return res.status(400).json({ error: "Tanggal dan rombel harus diisi" });
  const reqDate = new Date(tanggal);
  if (reqDate.getDay() === 0 || reqDate.getDay() === 6) {
    return res.json({ isHoliday: true, holidayName: "Libur Akhir Pekan" });
  }
  const [holidays] = await getPool().execute(
    "SELECT title FROM kalender_akademik WHERE category = 'Holiday' AND event_date = ?",
    [tanggal]
  );
  if (holidays.length > 0) {
    return res.json({ isHoliday: true, holidayName: holidays[0].title });
  }
  const [students] = await getPool().execute(
    "SELECT id, nisn, nama_lengkap FROM siswa WHERE rombel = ? ORDER BY nama_lengkap ASC",
    [rombel]
  );
  const [attendance] = await getPool().execute(
    "SELECT student_id, status, keterangan FROM absensi_siswa WHERE tanggal = ?",
    [tanggal]
  );
  const attMap = /* @__PURE__ */ new Map();
  attendance.forEach((a) => attMap.set(a.student_id, a));
  const result = students.map((s) => {
    const record = attMap.get(s.id);
    return {
      ...s,
      status: record ? record.status : "Hadir",
      keterangan: record ? record.keterangan : ""
    };
  });
  res.json(result);
}));
app.post("/api/absensi", authenticate, asyncHandler(async (req, res) => {
  const { tanggal, rombel, records } = req.body;
  if (!tanggal || !rombel || !Array.isArray(records)) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }
  const reqDate = new Date(tanggal);
  if (reqDate.getDay() === 0 || reqDate.getDay() === 6) {
    return res.status(400).json({ error: "Libur Akhir Pekan" });
  }
  const [holidays] = await getPool().execute(
    "SELECT title FROM kalender_akademik WHERE category = 'Holiday' AND event_date = ?",
    [tanggal]
  );
  if (holidays.length > 0) {
    return res.status(400).json({ error: `Hari Libur: ${holidays[0].title}` });
  }
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    for (const rec of records) {
      if (rec.status === "Hadir" && !rec.keterangan) {
        await conn.execute(
          "DELETE FROM absensi_siswa WHERE student_id = ? AND tanggal = ?",
          [rec.student_id, tanggal]
        );
      } else {
        await conn.execute(
          `INSERT INTO absensi_siswa (student_id, tanggal, status, keterangan, recorded_by)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE status = VALUES(status), keterangan = VALUES(keterangan), recorded_by = VALUES(recorded_by)`,
          [rec.student_id, tanggal, rec.status, rec.keterangan || null, req.user.staff_id || null]
        );
      }
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));
app.get("/api/absensi/report", authenticate, asyncHandler(async (req, res) => {
  const { start_date, end_date, rombel } = req.query;
  if (!start_date || !end_date || !rombel) return res.status(400).json({ error: "Parameter tidak lengkap" });
  const [holidays] = await getPool().execute(
    "SELECT event_date FROM kalender_akademik WHERE category = 'Holiday' AND event_date >= ? AND event_date <= ?",
    [start_date, end_date]
  );
  const holidayStrs = holidays.map((h) => {
    const d = new Date(h.event_date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  });
  let workingDays = 0;
  const sDate = new Date(start_date);
  const eDate = new Date(end_date);
  for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      const dLocal = new Date(d);
      dLocal.setMinutes(dLocal.getMinutes() - dLocal.getTimezoneOffset());
      const dStr = dLocal.toISOString().split("T")[0];
      if (!holidayStrs.includes(dStr)) {
        workingDays++;
      }
    }
  }
  const [students] = await getPool().execute(
    "SELECT id, nisn, nama_lengkap FROM siswa WHERE rombel = ? ORDER BY nama_lengkap ASC",
    [rombel]
  );
  const [attendance] = await getPool().execute(
    `SELECT a.student_id, a.status, COUNT(*) as count
         FROM absensi_siswa a
         JOIN siswa s ON a.student_id = s.id
         WHERE s.rombel = ? AND a.tanggal >= ? AND a.tanggal <= ?
         GROUP BY a.student_id, a.status`,
    [rombel, start_date, end_date]
  );
  const reportMap = /* @__PURE__ */ new Map();
  students.forEach((s) => {
    reportMap.set(s.id, {
      ...s,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpa: 0
    });
  });
  attendance.forEach((a) => {
    const rec = reportMap.get(a.student_id);
    if (rec) {
      if (a.status === "Sakit") rec.sakit = a.count;
      else if (a.status === "Izin") rec.izin = a.count;
      else if (a.status === "Tanpa Keterangan") rec.alpa = a.count;
    }
  });
  const reportArray = Array.from(reportMap.values()).map((rec) => {
    rec.hadir = Math.max(0, workingDays - rec.sakit - rec.izin - rec.alpa);
    return rec;
  });
  res.json({ workingDays, report: reportArray });
}));
app.get("/sitemap.xml", asyncHandler(async (req, res) => {
  const [settingsRows] = await getPool().execute("SELECT sitemap_enabled FROM pengaturan_sekolah WHERE id = 1");
  const sitemapEnabled = settingsRows.length > 0 ? settingsRows[0].sitemap_enabled : 1;
  if (!sitemapEnabled) {
    return res.status(404).send("Sitemap is disabled by administrator.");
  }
  const baseUrl = req.protocol + "://" + req.get("host");
  const staticRoutes = ["/", "/login", "/spmb", "/academic", "/blog"];
  let blogRoutes = [];
  try {
    const [blogs] = await getPool().execute("SELECT id FROM artikel_blog WHERE status = 'published'");
    blogRoutes = blogs.map((b) => `/blog/${b.id}`);
  } catch (err) {
    console.error("Sitemap: Failed to fetch blogs", err);
  }
  const allRoutes = [...staticRoutes, ...blogRoutes];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map((route) => `  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === "/" ? "1.0" : "0.8"}</priority>
  </url>`).join("\n")}
</urlset>`;
  res.header("Content-Type", "application/xml");
  res.send(sitemapXml);
}));
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : void 0
  });
});
async function startServer() {
  try {
    try {
      await initDb().catch((err) => {
        console.error("Database initialization failed (non-fatal):", err);
      });
    } catch (dbErr) {
      console.error("Error during initDb call:", dbErr);
    }
    try {
      const [tables] = await getPool().execute("SHOW TABLES LIKE 'el_student_pins'");
      if (tables.length > 0) {
        await getPool().execute(`
          INSERT IGNORE INTO el_student_pins (student_id, pin)
          SELECT id, '123456' FROM siswa WHERE id NOT IN (SELECT student_id FROM el_student_pins WHERE student_id IS NOT NULL)
        `);
        await getPool().execute(`
          INSERT IGNORE INTO el_parent_pins (student_id, pin, parent_name, parent_phone)
          SELECT s.id, '123456', COALESCE(s.nama_ayah, 'Orang Tua'), s.hp_orang_tua
           FROM siswa s
          WHERE s.hp_orang_tua IS NOT NULL AND s.hp_orang_tua != ''
          AND s.id NOT IN (SELECT student_id FROM el_parent_pins WHERE student_id IS NOT NULL)
        `);
      }
    } catch (seedErr) {
      console.error("E-Learning seed skipped:", seedErr);
    }
    if (process.env.NODE_ENV !== "production") {
      console.log("Starting in development mode with Vite middleware...");
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } else {
      const rootPath = process.cwd();
      const distPath = import_fs.default.existsSync(import_path.default.join(rootPath, "dist")) ? import_path.default.join(rootPath, "dist") : rootPath;
      const assetsPattern = /^\/(assets|favicon|vite.*\.js|vite.*\.css)\//;
      app.get(assetsPattern, (_req, res, next) => next());
      app.use("/assets", import_express.default.static(import_path.default.join(distPath, "assets")));
      app.use("/vite.svg", import_express.default.static(import_path.default.join(distPath, "vite.svg")));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(import_path.default.join(distPath, "index.html"));
      });
    }
    try {
      await getPool().execute(`
    INSERT IGNORE INTO el_student_pins (student_id, pin)
    SELECT s.id, '123456' FROM siswa s WHERE s.nisn IS NOT NULL AND s.nisn != ''
  `);
    } catch (e) {
    }
    app.post("/api/el/login/student", asyncHandler(async (req, res) => {
      const { nisn, pin } = req.body;
      if (!nisn || !pin) return res.status(400).json({ error: "NISN dan PIN wajib diisi." });
      const [students] = await getPool().execute(
        "SELECT s.*, esp.pin FROM siswa s, el_student_pins esp WHERE s.id = esp.student_id AND s.nisn = ?",
        [nisn]
      );
      if (!students.length) {
        const [byNisn] = await getPool().execute("SELECT id, nama_lengkap FROM siswa WHERE nisn = ?", [nisn]);
        if (!byNisn.length) {
          console.error("[EL] Student login failed: NISN not found:", nisn);
          return res.status(401).json({ error: "Akun tidak ditemukan. Pastikan NISN Anda benar." });
        } else {
          await getPool().execute("INSERT IGNORE INTO el_student_pins (student_id, pin) VALUES (?, '123456')", [byNisn[0].id]);
          const [retry] = await getPool().execute(
            "SELECT s.*, esp.pin FROM siswa s, el_student_pins esp WHERE s.id = esp.student_id AND s.nisn = ?",
            [nisn]
          );
          if (!retry.length) return res.status(401).json({ error: "Akun tidak ditemukan." });
          students[0] = retry[0];
        }
      }
      const student = students[0];
      if (student.pin !== pin) return res.status(401).json({ error: "PIN salah." });
      const [pointsRows] = await getPool().execute(
        "SELECT COALESCE(SUM(points),0) as total FROM el_points WHERE student_id = ?",
        [student.id]
      );
      const totalPoints = pointsRows[0]?.total || 0;
      const token = import_jsonwebtoken.default.sign(
        { id: student.id, nisn: student.nisn, type: "student", name: student.nama_lengkap, rombel: student.rombel },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({ success: true, token, student: { id: student.id, name: student.nama_lengkap, nisn: student.nisn, rombel: student.rombel, total_points: totalPoints } });
    }));
    app.post("/api/el/login/teacher", asyncHandler(async (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "Username dan password wajib diisi." });
      const [rows] = await getPool().execute(`
    SELECT wu.*, s.nama_lengkap as name, r.name as role_name, r.permissions
    FROM pengguna_web wu
    JOIN pegawai s ON wu.staff_id = s.pegawai_id
    JOIN peran r ON wu.role_id = r.id
    WHERE wu.username = ? AND wu.status_aktif = TRUE
  `, [username]);
      if (!rows.length) return res.status(401).json({ error: "Akun tidak ditemukan atau tidak aktif." });
      const user = rows[0];
      const isMatch = await import_bcryptjs.default.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: "Password salah." });
      const token = import_jsonwebtoken.default.sign(
        { id: user.id, username, type: "teacher", role: user.role_name, name: user.name, staff_id: user.staff_id },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({ success: true, token, teacher: { id: user.id, name: user.name, username, role: user.role_name } });
    }));
    app.post("/api/el/login/parent", asyncHandler(async (req, res) => {
      const { phone, pin } = req.body;
      if (!phone || !pin) return res.status(400).json({ error: "Nomor HP dan PIN wajib diisi." });
      const [rows] = await getPool().execute(
        "SELECT epp.*, s.nama_lengkap as student_name FROM el_parent_pins epp, siswa s WHERE epp.student_id = s.id AND epp.parent_phone = ?",
        [phone]
      );
      if (!rows.length) return res.status(401).json({ error: "Akun tidak ditemukan." });
      const parent = rows[0];
      if (parent.pin !== pin) return res.status(401).json({ error: "PIN salah." });
      const token = import_jsonwebtoken.default.sign(
        { id: parent.id, phone: parent.parent_phone, type: "parent", student_id: parent.student_id, student_name: parent.student_name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({ success: true, token, parent: { id: parent.id, name: parent.parent_name, student_id: parent.student_id, student_name: parent.student_name } });
    }));
    const elAuth = (req, res, next) => {
      console.log("[elAuth] path:", req.path, "auth:", req.headers.authorization?.substring(0, 20));
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "No token provided" });
      const token = authHeader.split(" ")[1];
      import_jsonwebtoken.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
      });
    };
    app.get("/api/debug/courses", (req, res) => {
      console.log("[DEBUG] /api/debug/courses hit!");
      res.json({ success: true, message: "Direct response OK" });
    });
    app.get("/api/el/courses", elAuth, asyncHandler(async (req, res) => {
      const { type } = req.user;
      let query = "SELECT c.*, s.nama_lengkap as teacher_name FROM el_courses c LEFT JOIN pegawai s ON c.teacher_id = s.pegawai_id WHERE c.status = 'published'";
      const params = [];
      if (type === "student") {
        query += " AND (c.rombel = ? OR c.rombel IS NULL OR c.rombel = '')";
        params.push(req.user.rombel);
      } else if (type === "teacher") {
        query = "SELECT c.*, s.nama_lengkap as teacher_name FROM el_courses c LEFT JOIN pegawai s ON c.teacher_id = s.pegawai_id WHERE c.teacher_id = ?";
        params.push(req.user.staff_id);
      }
      query += " ORDER BY c.id DESC";
      const [rows] = await getPool().execute(query, params);
      res.json(rows);
    }));
    app.get("/api/el/courses/:id", elAuth, asyncHandler(async (req, res) => {
      const [rows] = await getPool().execute(
        "SELECT c.*, s.nama_lengkap as teacher_name FROM el_courses c LEFT JOIN pegawai s ON c.teacher_id = s.pegawai_id WHERE c.id = ?",
        [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: "Kursus tidak ditemukan." });
      res.json(rows[0]);
    }));
    app.post("/api/el/courses", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru yang bisa membuat kursus." });
      const { name, description, cover_color, rombel, subject, semester, tahun_pelajaran, status } = req.body;
      const [result] = await getPool().execute(
        "INSERT INTO el_courses (name, description, cover_color, teacher_id, rombel, subject, semester, tahun_pelajaran, status) VALUES (?,?,?,?,?,?,?,?,?)",
        [name, description, cover_color || "#3B82F6", req.user.staff_id, rombel, subject, semester, tahun_pelajaran, status || "draft"]
      );
      res.json({ success: true, id: result.insertId });
    }));
    app.put("/api/el/courses/:id", elAuth, asyncHandler(async (req, res) => {
      const { name, description, cover_color, rombel, subject, semester, tahun_pelajaran, status } = req.body;
      await getPool().execute(
        "UPDATE el_courses SET name=?, description=?, cover_color=?, rombel=?, subject=?, semester=?, tahun_pelajaran=?, status=? WHERE id=?",
        [name, description, cover_color, rombel, subject, semester, tahun_pelajaran, status, req.params.id]
      );
      res.json({ success: true });
    }));
    app.delete("/api/el/courses/:id", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru yang bisa menghapus kursus." });
      await getPool().execute("DELETE FROM el_courses WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    }));
    app.get("/api/el/courses/:courseId/modules", elAuth, asyncHandler(async (req, res) => {
      const [rows] = await getPool().execute(
        "SELECT * FROM el_modules WHERE course_id = ? ORDER BY order_index ASC, id ASC",
        [req.params.courseId]
      );
      res.json(rows);
    }));
    app.post("/api/el/courses/:courseId/modules", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      const { title, content, video_url, order_index } = req.body;
      const [result] = await getPool().execute(
        "INSERT INTO el_modules (course_id, title, content, video_url, order_index) VALUES (?,?,?,?,?)",
        [req.params.courseId, title, content, video_url, order_index || 0]
      );
      res.json({ success: true, id: result.insertId });
    }));
    app.put("/api/el/modules/:id", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      const { title, content, video_url, order_index } = req.body;
      await getPool().execute(
        "UPDATE el_modules SET title=?, content=?, video_url=?, order_index=? WHERE id=?",
        [title, content, video_url, order_index, req.params.id]
      );
      res.json({ success: true });
    }));
    app.delete("/api/el/modules/:id", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      await getPool().execute("DELETE FROM el_modules WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    }));
    app.get("/api/el/courses/:courseId/quizzes", elAuth, asyncHandler(async (req, res) => {
      const [rows] = await getPool().execute(
        "SELECT * FROM el_quizzes WHERE course_id = ? AND status = 'published' ORDER BY id DESC",
        [req.params.courseId]
      );
      res.json(rows);
    }));
    app.post("/api/el/courses/:courseId/quizzes", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      const { title, module_id, passing_score, time_limit_minutes, status } = req.body;
      const [result] = await getPool().execute(
        "INSERT INTO el_quizzes (course_id, module_id, title, passing_score, time_limit_minutes, status) VALUES (?,?,?,?,?,?)",
        [req.params.courseId, module_id || null, title, passing_score || 70, time_limit_minutes || 30, status || "draft"]
      );
      res.json({ success: true, id: result.insertId });
    }));
    app.get("/api/el/quizzes/:id", elAuth, asyncHandler(async (req, res) => {
      const [rows] = await getPool().execute("SELECT * FROM el_quizzes WHERE id = ?", [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: "Kuis tidak ditemukan." });
      res.json(rows[0]);
    }));
    app.put("/api/el/quizzes/:id", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      const { title, module_id, passing_score, time_limit_minutes, status } = req.body;
      await getPool().execute(
        "UPDATE el_quizzes SET title=?, module_id=?, passing_score=?, time_limit_minutes=?, status=? WHERE id=?",
        [title, module_id || null, passing_score, time_limit_minutes, status, req.params.id]
      );
      res.json({ success: true });
    }));
    app.delete("/api/el/quizzes/:id", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      await getPool().execute("DELETE FROM el_quizzes WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    }));
    app.get("/api/el/quizzes/:quizId/questions", elAuth, asyncHandler(async (req, res) => {
      const [rows] = await getPool().execute(
        "SELECT * FROM el_quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC, id ASC",
        [req.params.quizId]
      );
      res.json(rows);
    }));
    app.post("/api/el/quizzes/:quizId/questions", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      const { question_text, question_image_url, option_a, option_a_image, option_b, option_b_image, option_c, option_c_image, option_d, option_d_image, correct_answer, points, order_index } = req.body;
      if (!question_text || !option_a || !correct_answer) return res.status(400).json({ error: "question_text, option_a, dan correct_answer wajib diisi." });
      const clean2 = (v) => v === "" || v === void 0 || v === null ? null : v;
      const [result] = await getPool().execute(
        `INSERT INTO el_quiz_questions (quiz_id, question_text, question_image_url, option_a, option_a_image, option_b, option_b_image, option_c, option_c_image, option_d, option_d_image, correct_answer, points, order_index) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [req.params.quizId, clean2(question_text), clean2(question_image_url), clean2(option_a), clean2(option_a_image), clean2(option_b), clean2(option_b_image), clean2(option_c), clean2(option_c_image), clean2(option_d), clean2(option_d_image), clean2(correct_answer), clean2(points) || 10, clean2(order_index) || 0]
      );
      res.json({ success: true, id: result.insertId });
    }));
    app.put("/api/el/quizzes/:quizId/questions/:qid", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      const { question_text, question_image_url, option_a, option_a_image, option_b, option_b_image, option_c, option_c_image, option_d, option_d_image, correct_answer, points, order_index } = req.body;
      await getPool().execute(
        `UPDATE el_quiz_questions SET question_text=?, question_image_url=?, option_a=?, option_a_image=?, option_b=?, option_b_image=?, option_c=?, option_c_image=?, option_d=?, option_d_image=?, correct_answer=?, points=?, order_index=? WHERE id=?`,
        [question_text, question_image_url, option_a, option_a_image, option_b, option_b_image, option_c, option_c_image, option_d, option_d_image, correct_answer, points, order_index, req.params.qid]
      );
      res.json({ success: true });
    }));
    app.delete("/api/el/quizzes/:quizId/questions/:qid", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      await getPool().execute("DELETE FROM el_quiz_questions WHERE id = ?", [req.params.qid]);
      res.json({ success: true });
    }));
    app.post("/api/el/quizzes/:id/start", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "student") return res.status(403).json({ error: "Hanya siswa." });
      const [quizzes] = await getPool().execute("SELECT * FROM el_quizzes WHERE id = ? AND status = 'published'", [req.params.id]);
      if (!quizzes.length) return res.status(404).json({ error: "Kuis tidak ditemukan." });
      const quiz = quizzes[0];
      const [questions] = await getPool().execute(
        "SELECT id, question_text, question_image_url, option_a, option_a_image, option_b, option_b_image, option_c, option_c_image, option_d, option_d_image, points, order_index FROM el_quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC, id ASC",
        [req.params.id]
      );
      const [result] = await getPool().execute(
        "INSERT INTO el_submissions (quiz_id, student_id, answers, status) VALUES (?,?,?,?)",
        [req.params.id, req.user.id, JSON.stringify([]), "submitted"]
      );
      res.json({ submission_id: result.insertId, questions, time_limit_minutes: quiz.time_limit_minutes });
    }));
    app.post("/api/el/quizzes/:id/submit", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "student") return res.status(403).json({ error: "Hanya siswa." });
      const { submission_id, answers } = req.body;
      const [questions] = await getPool().execute(
        "SELECT id, correct_answer, points FROM el_quiz_questions WHERE quiz_id = ?",
        [req.params.id]
      );
      const [quiz] = await getPool().execute("SELECT * FROM el_quizzes WHERE id = ?", [req.params.id]);
      let score = 0;
      let maxScore = 0;
      for (const q of questions) {
        maxScore += q.points;
        const answer = answers?.find((a) => a.question_id === q.id);
        if (answer && answer.answer === q.correct_answer) score += q.points;
      }
      const percentage = maxScore > 0 ? Math.round(score / maxScore * 100) : 0;
      const passed = percentage >= (quiz[0]?.passing_score || 70);
      await getPool().execute(
        "UPDATE el_submissions SET answers=?, score=?, max_score=?, percentage=?, status='graded' WHERE id=?",
        [JSON.stringify(answers), score, maxScore, percentage, submission_id]
      );
      let pointsEarned = 0;
      if (percentage >= 80) pointsEarned = 25;
      else if (percentage >= 50) pointsEarned = 15;
      else pointsEarned = 5;
      if (pointsEarned > 0) {
        await getPool().execute(
          "INSERT INTO el_points (student_id, points, source, source_id, description) VALUES (?,?,?,?,?)",
          [req.user.id, pointsEarned, "quiz", req.params.id, `Kuis: ${quiz[0]?.title || "Kuis"}`]
        );
      }
      if (quiz[0]?.module_id) {
        await getPool().execute(
          `INSERT INTO el_progress (student_id, module_id, completed, completed_at) VALUES (?,?,TRUE,NOW()) ON DUPLICATE KEY UPDATE completed=TRUE, completed_at=NOW()`,
          [req.user.id, quiz[0].module_id]
        );
      }
      const [pt] = await getPool().execute("SELECT COALESCE(SUM(points),0) as total FROM el_points WHERE student_id = ?", [req.user.id]);
      res.json({ score, max_score: maxScore, percentage, passed, points_earned: pointsEarned, total_points: pt[0]?.total || 0 });
    }));
    app.get("/api/el/students/:id/profile", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type === "student" && req.user.id !== parseInt(req.params.id)) {
        return res.status(403).json({ error: "Tidak punya akses." });
      }
      const [students] = await getPool().execute("SELECT id, nama_lengkap, nisn, rombel, jenis_kelamin FROM siswa WHERE id = ?", [req.params.id]);
      if (!students.length) return res.status(404).json({ error: "Siswa tidak ditemukan." });
      const student = students[0];
      const [pointsRows] = await getPool().execute("SELECT COALESCE(SUM(points),0) as total FROM el_points WHERE student_id = ?", [req.params.id]);
      const [completedRows] = await getPool().execute("SELECT COUNT(*) as total FROM el_progress WHERE student_id = ? AND completed = TRUE", [req.params.id]);
      const [courseRows] = await getPool().execute("SELECT COUNT(*) as total FROM el_courses WHERE status='published' AND (rombel = ? OR rombel IS NULL OR rombel = '')", [student.rombel]);
      res.json({
        id: student.id,
        name: student.nama_lengkap,
        nisn: student.nisn,
        rombel: student.rombel,
        jenis_kelamin: student.jenis_kelamin,
        total_points: pointsRows[0]?.total || 0,
        completed_modules: completedRows[0]?.total || 0,
        enrolled_courses: courseRows[0]?.total || 0
      });
    }));
    app.get("/api/el/teacher/gradebook", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      const { course_id } = req.query;
      let query = `
    SELECT c.id as course_id, c.name as course_name,
           s.id as student_id, s.nama_lengkap as student_name, s.nisn,
           q.title as quiz_title, sub.score, sub.max_score, sub.percentage, sub.submitted_at
    FROM el_courses c
    JOIN el_submissions sub ON sub.quiz_id IN (SELECT id FROM el_quizzes WHERE course_id = c.id)
        JOIN siswa s ON sub.student_id = s.id
    JOIN el_quizzes q ON sub.quiz_id = q.id
    WHERE c.teacher_id = ?
  `;
      const params = [req.user.staff_id];
      if (course_id) {
        query += " AND c.id = ?";
        params.push(course_id);
      }
      query += " ORDER BY c.id, s.nama_lengkap";
      const [rows] = await getPool().execute(query, params);
      const studentMap = {};
      for (const row of rows) {
        const key = row.student_id;
        if (!studentMap[key]) studentMap[key] = { id: row.student_id, name: row.student_name, nisn: row.nisn, submissions: [] };
        studentMap[key].submissions.push({ quiz_title: row.quiz_title, score: row.score, max_score: row.max_score, percentage: row.percentage, submitted_at: row.submitted_at });
      }
      res.json(Object.values(studentMap));
    }));
    app.get("/api/el/teacher/gradebook/:courseId/export", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "teacher") return res.status(403).json({ error: "Hanya guru." });
      const [courseRows] = await getPool().execute("SELECT * FROM el_courses WHERE id = ? AND teacher_id = ?", [req.params.courseId, req.user.staff_id]);
      if (!courseRows.length) return res.status(404).json({ error: "Kursus tidak ditemukan." });
      const [quizzes] = await getPool().execute("SELECT * FROM el_quizzes WHERE course_id = ? ORDER BY id", [req.params.courseId]);
      const [submissions] = await getPool().execute(`
    SELECT s.id as student_id, s.nama_lengkap, s.nisn, q.id as quiz_id, q.title as quiz_title,
           sub.score, sub.max_score, sub.percentage
    FROM el_submissions sub
        JOIN siswa s ON sub.student_id = s.id
    JOIN el_quizzes q ON sub.quiz_id = q.id
    WHERE q.course_id = ?
    ORDER BY s.nama_lengkap, q.id
  `, [req.params.courseId]);
      const quizTitles = quizzes.map((q) => q.title);
      const headers = ["Nama", "NISN", ...quizTitles, "Rata-rata"];
      const studentMap = {};
      for (const sub of submissions) {
        if (!studentMap[sub.student_id]) {
          studentMap[sub.student_id] = { name: sub.nama_lengkap, nisn: sub.nisn, scores: {} };
        }
        studentMap[sub.student_id].scores[sub.quiz_id] = sub;
      }
      const aoa = [headers];
      for (const student of Object.values(studentMap)) {
        const row = [student.name, student.nisn];
        let totalPct = 0, count = 0;
        for (const quiz of quizzes) {
          const sub = student.scores[quiz.id];
          if (sub) {
            row.push(`${sub.score}/${sub.max_score} (${sub.percentage}%)`);
            totalPct += sub.percentage;
            count++;
          } else row.push("-");
        }
        row.push(count > 0 ? `${Math.round(totalPct / count)}%` : "-");
        aoa.push(row);
      }
      res.json({ success: true, data: aoa, course_name: courseRows[0].name });
    }));
    app.get("/api/el/parent/students", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "parent") return res.status(403).json({ error: "Hanya orang tua." });
      const [students] = await getPool().execute(
        "SELECT id, nama_lengkap, nisn, rombel FROM siswa WHERE id = ?",
        [req.user.student_id]
      );
      res.json(students);
    }));
    app.get("/api/el/parent/student/:studentId/scores", elAuth, asyncHandler(async (req, res) => {
      if (req.user.type !== "parent" && req.user.type !== "teacher") return res.status(403).json({ error: "Akses ditolak." });
      const [students] = await getPool().execute("SELECT nama_lengkap FROM siswa WHERE id = ?", [req.params.studentId]);
      const [scores] = await getPool().execute(`
    SELECT q.title as quiz_title, c.name as course_name, sub.score, sub.max_score, sub.percentage, sub.submitted_at
    FROM el_submissions sub
    JOIN el_quizzes q ON sub.quiz_id = q.id
    JOIN el_courses c ON q.course_id = c.id
    WHERE sub.student_id = ?
    ORDER BY sub.submitted_at DESC
    LIMIT 50
  `, [req.params.studentId]);
      res.json({ student_name: students[0]?.nama_lengkap || "-", scores });
    }));
    setTimeout(verifyLicenseOnBoot, 2e3);
    await initDb();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`
================================================
`);
      console.log(`  SERVER RUNNING ON PORT ${PORT}`);
      console.log(`  URL: http://localhost:${PORT}`);
      console.log(`  MODE: ${process.env.NODE_ENV || "development"}`);
      console.log(`
================================================
`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}
startServer();
//# sourceMappingURL=server.cjs.map
