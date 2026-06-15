// lk-auth.jsx — layar autentikasi (Masuk / Daftar) untuk LemariKu.

function _authFriendly(error) {
  const m = (error && error.message) || "";
  if (/invalid login credentials/i.test(m)) return "Email atau password salah.";
  if (/already registered|already been registered|user already/i.test(m)) return "Email ini sudah terdaftar — silakan Masuk.";
  if (/database error|saving new user/i.test(m)) return "Pendaftaran penuh (maks 10 pengguna) atau gagal. Hubungi admin.";
  if (/email/i.test(m) && /valid/i.test(m)) return "Format email tidak valid.";
  if (/password/i.test(m)) return "Password minimal 6 karakter.";
  if (/rate limit|too many/i.test(m)) return "Terlalu banyak percobaan. Coba lagi sebentar.";
  return m || "Terjadi kesalahan. Coba lagi.";
}

const _authInput = {
  width: "100%", borderRadius: 12, background: "white",
  border: "1px solid var(--line)", padding: "13px 14px 13px 40px",
  fontSize: 15, color: "var(--ink)", outline: "none",
};

function AuthScreen() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const isSignup = mode === "signup";
  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  function switchMode(m) {
    setMode(m); setErr(""); setInfo("");
  }

  async function submit() {
    if (!valid || busy) return;
    setBusy(true); setErr(""); setInfo("");
    try {
      if (isSignup) {
        const { data, error } = await LK_API.signUp(email.trim(), password);
        if (error) {
          setErr(_authFriendly(error));
        } else if (data && data.session) {
          /* auto-confirmed → onAuthChange di Root memindahkan ke aplikasi */
        } else {
          setInfo("Akun dibuat. Jika diminta, cek email untuk verifikasi, lalu Masuk.");
          setMode("login");
        }
      } else {
        const { error } = await LK_API.signIn(email.trim(), password);
        if (error) setErr(_authFriendly(error));
      }
    } catch (e) {
      setErr("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full w-full flex-col" style={{ background: "var(--bg)", paddingTop: 64 }}>
      <div className="lk-scroll flex flex-1 flex-col justify-center overflow-y-auto" style={{ padding: "0 26px 48px" }}>
        {/* brand */}
        <div className="flex flex-col items-center animate-fade-up" style={{ marginBottom: 26 }}>
          <img src="logo.png" alt="LemariKu" draggable={false} style={{ width: 140, height: 140, objectFit: 'contain' }} />
          <h1 className="font-serif" style={{ fontSize: 42, color: "var(--ink)", marginTop: 14, lineHeight: 1 }}>LemariKu</h1>
          <p style={{ fontSize: 13.5, color: "var(--ink-60)", marginTop: 8, textAlign: "center" }}>Catat lemari &amp; lacak laundry-mu</p>
        </div>

        {/* toggle Masuk / Daftar */}
        <div className="flex rounded-2xl" style={{ background: "var(--card)", padding: 4, marginBottom: 18 }}>
          {[["login", "Masuk"], ["signup", "Daftar"]].map(([m, label]) => {
            const on = mode === m;
            return (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 rounded-xl font-semibold transition-all"
                style={{
                  padding: "11px", fontSize: 14,
                  background: on ? "white" : "transparent",
                  color: on ? "var(--ink)" : "var(--ink-60)",
                  boxShadow: on ? "0 1px 4px rgba(44,42,41,0.10)" : "none",
                }}
              >{label}</button>
            );
          })}
        </div>

        {/* fields */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <span className="absolute" style={{ left: 13, top: 13, color: "var(--ink-40)" }}><Icon name="Mail" size={18} /></span>
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              style={_authInput}
            />
          </div>
          <div className="relative">
            <span className="absolute" style={{ left: 13, top: 13, color: "var(--ink-40)" }}><Icon name="Lock" size={18} /></span>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Password (min. 6 karakter)"
              style={_authInput}
            />
          </div>
        </div>

        {err && (
          <div className="flex items-start gap-2" style={{ marginTop: 14, padding: "10px 12px", borderRadius: 12, background: "rgba(180,69,60,0.08)" }}>
            <span style={{ color: "#b4453c", marginTop: 1 }}><Icon name="TriangleAlert" size={16} stroke={2} /></span>
            <span style={{ fontSize: 12.5, color: "#9c3a32", lineHeight: 1.4 }}>{err}</span>
          </div>
        )}
        {info && (
          <div className="flex items-start gap-2" style={{ marginTop: 14, padding: "10px 12px", borderRadius: 12, background: "rgba(109,130,113,0.12)" }}>
            <span style={{ color: "var(--sage)", marginTop: 1 }}><Icon name="Info" size={16} stroke={2} /></span>
            <span style={{ fontSize: 12.5, color: "#566b5a", lineHeight: 1.4 }}>{info}</span>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <PrimaryButton icon={isSignup ? "UserPlus" : "LogIn"} disabled={!valid || busy} onClick={submit}>
            {busy ? "Memproses…" : isSignup ? "Buat Akun" : "Masuk"}
          </PrimaryButton>
        </div>

        <p style={{ fontSize: 11.5, color: "var(--ink-40)", textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
          {isSignup
            ? "Akses terbatas untuk 10 pengguna pertama."
            : "Belum punya akun? Pilih “Daftar” di atas."}
        </p>
      </div>
    </div>
  );
}

window.AuthScreen = AuthScreen;
