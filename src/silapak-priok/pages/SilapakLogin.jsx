import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Eye } from "lucide-react";
import { T, font } from "../../lib/theme";
import AutoLogo from "../../components/AutoLogo";
import PartnerLogos from "../../components/PartnerLogos";

const DEFAULT_BG =
  "radial-gradient(ellipse at 20% 15%, rgba(20,184,166,0.22) 0%, transparent 50%),"
  + " radial-gradient(ellipse at 80% 85%, rgba(6,182,212,0.18) 0%, transparent 50%),"
  + " linear-gradient(140deg, #011414 0%, #022828 40%, #045050 75%, #067070 100%)";

function GlassInput({ endAdornment, style, ...props }) {
  return (
    <div style={{ position: "relative", ...style }}>
      <input
        {...props}
        style={{
          width: "100%",
          height: 50,
          boxSizing: "border-box",
          padding: `0 ${endAdornment ? 44 : 18}px 0 18px`,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.30)",
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          fontSize: 14,
          outline: "none",
        }}
      />
      {endAdornment && (
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
          {endAdornment}
        </div>
      )}
    </div>
  );
}

export default function SilapakLogin({ onLogin, onBack, authenticate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bgUrl, setBgUrl] = useState(null);
  useEffect(() => {
    const candidates = [
      "/silapak-bg.jpg", "/silapak-bg.jpeg", "/silapak-bg.png",
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

  const submit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }
    const res = authenticate
      ? authenticate("silapak", username.trim(), password)
      : { ok: false, reason: "wrong" };
    if (!res.ok) {
      setError(
        res.reason === "inactive"
          ? "Akun sedang tidak aktif (di luar rentang tanggal berlaku)."
          : "Username atau password salah."
      );
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => onLogin(), 300);
  };

  const bg = bgUrl
    ? `linear-gradient(180deg, rgba(1,20,20,0.45), rgba(1,20,20,0.60)), url(${bgUrl})`
    : DEFAULT_BG;

  return (
    <div
      className="login-page"
      style={{
        background: bg,
        position: "relative",
        backgroundColor: T.navy,
        backgroundSize: bgUrl ? "contain" : "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: font.body,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          position: "fixed", top: 28, left: 28, zIndex: 10,
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 8,
          color: "rgba(255,255,255,0.75)",
          cursor: "pointer",
          fontSize: 13, fontWeight: 500,
          padding: "8px 14px",
          backdropFilter: "blur(8px)",
          fontFamily: font.body,
        }}
      >
        <ArrowLeft size={14} />
        Kembali ke Portal
      </button>

      <div
        className="login-glass"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "42px 40px 38px",
          borderRadius: 22,
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)",
          color: "#fff",
          animation: "fade-in .35s ease",
        }}
      >
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 34,
            fontWeight: 700,
            textAlign: "center",
            margin: "0 0 6px",
            letterSpacing: -0.5,
            textShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          Si Lapak Priok
        </h1>
        <p
          style={{
            textAlign: "center",
            margin: "0 0 26px",
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Penerimaan tamu &amp; paket
        </p>

        <form onSubmit={submit}>
          <GlassInput
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
          />
          <GlassInput
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            style={{ marginTop: 12 }}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                style={{
                  background: "transparent",
                  border: "none",
                  color: showPassword ? "#fff" : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
              >
                <Eye size={17} />
              </button>
            }
          />

          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 14,
                padding: "9px 12px",
                borderRadius: 9,
                background: "rgba(255,90,70,0.20)",
                border: "1px solid rgba(255,90,70,0.35)",
                color: "#FFC5B8",
                fontSize: 12.5,
              }}
            >
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 20px",
              marginTop: 22,
              borderRadius: 999,
              border: "none",
              background: loading
                ? "linear-gradient(90deg, #E5A916, #FFC72C)"
                : "linear-gradient(90deg, #F2AE1E 0%, #FFC72C 100%)",
              color: "#3A2A00",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 2.5,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 8px 24px rgba(255,199,44,0.35)",
              textTransform: "uppercase",
            }}
          >
            {loading ? "Memeriksa akun…" : "Login"}
          </button>
        </form>

      </div>

      <div className="powered-by-strip" style={{ fontFamily: font.body }}>
        <span className="powered-by-label">Powered by</span>
        <div className="powered-by-logos">
          <div className="powered-by-logo-box">
            <AutoLogo alt="PLN" />
          </div>
          <PartnerLogos />
        </div>
      </div>
    </div>
  );
}
