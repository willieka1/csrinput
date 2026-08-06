import { useEffect, useState } from "react";
import { LogIn, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { T, font } from "../../lib/theme";

const DEFAULT_BG =
  "radial-gradient(ellipse at 30% 15%, rgba(99,102,241,0.22) 0%, transparent 55%),"
  + " radial-gradient(ellipse at 75% 85%, rgba(139,92,246,0.18) 0%, transparent 55%),"
  + " linear-gradient(140deg, #05060F 0%, #0C0D24 40%, #141640 75%, #1A1C54 100%)";

const inputStyle = (font) => ({
  width: "100%",
  padding: "11px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  fontSize: 14,
  color: "#fff",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: font.body,
});

const BACK_BTN = {
  display: "flex", alignItems: "center", gap: 6,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8,
  color: "rgba(255,255,255,0.75)",
  cursor: "pointer",
  fontSize: 13, fontWeight: 500,
  padding: "8px 14px",
  backdropFilter: "blur(8px)",
  transition: "background 0.15s ease",
};

export default function MitraLogin({ onLogin, onBack, authenticate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bgUrl, setBgUrl] = useState(null);
  useEffect(() => {
    const candidates = [
      "/mitra-bg.jpg", "/mitra-bg.jpeg", "/mitra-bg.png",
    ];
    let cancelled = false;
    (async () => {
      for (const src of candidates) {
        const ok = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = src;
        });
        if (cancelled) return;
        if (ok) { setBgUrl(src); return; }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const res = authenticate
        ? authenticate("mitra", username.trim(), password)
        : { ok: false, reason: "wrong" };
      if (!res.ok) {
        setError(
          res.reason === "inactive"
            ? "Akun sedang tidak aktif (di luar rentang tanggal berlaku)."
            : "Username atau password salah."
        );
        setLoading(false);
      } else {
        onLogin({ username: res.user.username, name: res.user.username, role: "mitra" });
      }
    }, 500);
  };

  const bg = bgUrl
    ? `linear-gradient(180deg, rgba(5,6,15,0.50), rgba(5,6,15,0.65)), url(${bgUrl})`
    : DEFAULT_BG;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        backgroundColor: T.navy,
        backgroundSize: bgUrl ? "contain" : "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.body,
        padding: 24,
        position: "relative",
      }}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        style={{ ...BACK_BTN, position: "fixed", top: 28, left: 28, zIndex: 10 }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
      >
        <ArrowLeft size={14} />
        Kembali ke Portal
      </button>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo & Title */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, #FFC72C 0%, #E6A700 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "0 8px 24px rgba(255,199,44,0.25)",
          }}>
            <LogIn size={24} color="#0A1628" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
            Portal Mitra
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Sistem Pengajuan Kerjasama Mitra PLN
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 6, display: "block" }}>
              Username
            </label>
            <input
              style={inputStyle(font)}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 6, display: "block" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle(font), paddingRight: 44 }}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.5)", padding: 0, display: "flex",
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "rgba(176,24,24,0.15)", border: "1px solid rgba(176,24,24,0.3)",
              color: "#F87171", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px", borderRadius: 8, border: "none",
              background: loading ? "rgba(255,199,44,0.5)" : "linear-gradient(135deg, #FFC72C 0%, #E6A700 100%)",
              color: "#0A1628", cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 700, marginTop: 6,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: font.body,
              boxShadow: loading ? "none" : "0 4px 16px rgba(255,199,44,0.3)",
              transition: "all .15s ease",
            }}
          >
            <LogIn size={15} />
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
