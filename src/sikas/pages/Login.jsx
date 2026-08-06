import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { T, font } from "../../lib/theme";
import { ADMIN_CREDENTIALS, ROLES } from "../../lib/data";
import AutoLogo from "../../components/AutoLogo";
import PartnerLogos from "../../components/PartnerLogos";

const DEFAULT_BG =
  "radial-gradient(ellipse at 15% 20%, rgba(255,199,44,0.20) 0%, transparent 45%),"
  + " radial-gradient(ellipse at 85% 80%, rgba(14,76,146,0.40) 0%, transparent 50%),"
  + " linear-gradient(160deg, #010A18 0%, #031428 35%, #061E42 65%, #0A2E60 100%)";

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
        <div
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          {endAdornment}
        </div>
      )}
    </div>
  );
}

export default function LoginScreen({ onLogin, onBack, authenticate }) {
  const sikasRoles = ROLES.filter((r) => r.value !== "mitra" && r.value !== "silapak");
  const [role, setRole] = useState("humas");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoAspect, setLogoAspect] = useState(1);
  const isSquareish = logoAspect >= 0.85 && logoAspect <= 1.2;

  const [bgUrl, setBgUrl] = useState(null);
  useEffect(() => {
    const candidates = [
      "/sikas-bg.jpg", "/sikas-bg.jpeg", "/sikas-bg.png",
      "/login-bg.jpg", "/login-bg.jpeg", "/login-bg.png",
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
    const u = username.trim();
    if (!u || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }
    // Cek dulu akun admin khusus (untuk buka menu Manajemen Akses di Humas).
    if (
      role === ADMIN_CREDENTIALS.role &&
      u === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setError("");
      setLoading(true);
      setTimeout(() => onLogin({ role, username: u, isAdmin: true }), 350);
      return;
    }
    // Autentikasi user biasa via callback (mengecek daftar user + tanggal aktif).
    const res = authenticate
      ? authenticate(role, u, password)
      : { ok: false, reason: "wrong" };
    if (!res.ok) {
      setError(
        res.reason === "inactive"
          ? "Akun sedang tidak aktif (di luar rentang tanggal berlaku)."
          : "Username atau password salah untuk role yang dipilih."
      );
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => onLogin({ role, username: u }), 350);
  };

  const bg = bgUrl
    ? `linear-gradient(180deg, rgba(3,45,58,0.35), rgba(3,45,58,0.5)), url(${bgUrl})`
    : DEFAULT_BG;

  return (
    <div
      className="login-page"
      style={{
        background: bg,
        backgroundColor: T.navy,
        backgroundSize: bgUrl ? "contain" : "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: font.body,
        position: "relative",
      }}
    >
      {onBack && (
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
      )}

      <div
        className="login-glass"
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "32px 36px 30px",
          borderRadius: 22,
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)",
          color: "#fff",
          animation: "fade-in .35s ease",
        }}
      >
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 32,
            fontWeight: 700,
            textAlign: "center",
            margin: "0 0 16px",
            letterSpacing: -0.5,
            textShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          Welcome
        </h1>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: isSquareish ? 96 : 140,
              minHeight: 96,
              padding: isSquareish ? 10 : 14,
              background: "#fff",
              borderRadius: isSquareish ? "50%" : 22,
              boxShadow:
                "0 12px 30px rgba(0,0,0,0.30), 0 0 0 4px rgba(255,255,255,0.15)",
              border: "3px solid rgba(255,255,255,0.7)",
              overflow: "hidden",
              transition: "border-radius .2s ease, padding .2s ease",
            }}
          >
            <AutoLogo
              alt="Logo PLN"
              onAspect={setLogoAspect}
              style={{
                display: "block",
                maxWidth: isSquareish ? 76 : 200,
                maxHeight: 76,
                width: "auto",
                height: "auto",
                objectFit: "contain",
                imageRendering: "-webkit-optimize-contrast",
              }}
            />
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            margin: "0 0 18px",
            fontSize: 14.5,
            fontWeight: 500,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: 0.1,
          }}
        >
          SIKAS - Sistem Informasi Kas
        </p>

        <form onSubmit={submit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${sikasRoles.length}, 1fr)`,
              gap: 4,
              background: "rgba(0,0,0,0.20)",
              padding: 4,
              borderRadius: 999,
              marginBottom: 14,
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {sikasRoles.map((r) => {
              const active = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 999,
                    border: "none",
                    background: active
                      ? "rgba(255,255,255,0.22)"
                      : "transparent",
                    color: "#fff",
                    fontWeight: active ? 700 : 500,
                    fontSize: 13.5,
                    cursor: "pointer",
                    transition: "background .15s ease",
                    textShadow: active
                      ? "0 1px 2px rgba(0,0,0,0.20)"
                      : "none",
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

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
            style={{ marginTop: 10 }}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
                title={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
                style={{
                  background: "transparent",
                  border: "none",
                  color: showPassword ? "#fff" : "rgba(255,255,255,0.55)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  transition: "color .15s ease",
                }}
              >
                {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
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
              marginTop: 16,
              borderRadius: 999,
              border: "none",
              background: loading
                ? "linear-gradient(90deg, #3A5FC0, #5C6CD8)"
                : "linear-gradient(90deg, #4568DC 0%, #6B77E5 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 2.5,
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 8px 24px rgba(69,104,220,0.45)",
              textTransform: "uppercase",
              transition: "transform .1s ease, box-shadow .15s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {loading ? "Memeriksa akun…" : "Login"}
          </button>
        </form>
      </div>

      {/* ===== STRIP "POWERED BY" - fixed bar di bawah, terpusat, responsive ===== */}
      <div className="powered-by-strip" style={{ fontFamily: font.body }}>
        <span className="powered-by-label">Powered by</span>
        <div className="powered-by-logos">
          {/* Logo PLN utama - dibungkus box seragam */}
          <div className="powered-by-logo-box">
            <AutoLogo alt="PLN" />
          </div>
          {/* Logo Partner 1-6 - masing-masing sudah dibungkus box seragam di PartnerLogos */}
          <PartnerLogos />
        </div>
      </div>
    </div>
  );
}
