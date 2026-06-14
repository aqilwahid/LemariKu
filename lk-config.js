// lk-config.js — Konfigurasi Supabase untuk LemariKu.
// ────────────────────────────────────────────────────────────
// Ganti dua nilai di bawah dengan milik proyek Supabase kamu:
//   Supabase Dashboard → Project Settings → API
//     • Project URL        → SUPABASE_URL
//     • anon public key     → SUPABASE_ANON_KEY
//
// CATATAN KEAMANAN: anon key AMAN ditaruh di sini — memang dirancang untuk
// dipakai di sisi browser. Keamanan data dijaga oleh Row Level Security
// (lihat supabase-setup.sql), bukan oleh kerahasiaan key ini.
// ────────────────────────────────────────────────────────────

window.LK_CONFIG = {
  SUPABASE_URL: "https://aqffwrujklwgcnzfxtdq.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_WcT8mtbfKwy4oDlmafobdA_SUKwV3TK",
};

(function () {
  var cfg = window.LK_CONFIG;
  var ready =
    window.supabase &&
    typeof cfg.SUPABASE_URL === "string" &&
    cfg.SUPABASE_URL.indexOf("https://") === 0 &&
    typeof cfg.SUPABASE_ANON_KEY === "string" &&
    cfg.SUPABASE_ANON_KEY.length > 20;

  window.sb = ready
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;
})();
