import { useEffect, useState } from "react";
import { T, font } from "../../lib/theme";
import AutoLogo from "../../components/AutoLogo";
import PartnerLogos from "../../components/PartnerLogos";
import silapakLogo from "../../assets/silapak-logo.svg";
import sikasLogo from "../../assets/sikas-logo.svg";
import mitraLogo from "../../assets/mitra-logo.svg";

const DEFAULT_BG =
  "radial-gradient(circle at 15% 20%, rgba(255,199,44,0.28), transparent 45%),"
  + " radial-gradient(circle at 85% 82%, rgba(14,76,146,0.55), transparent 50%),"
  + " linear-gradient(135deg, #051428 0%, #0A2A50 40%, #0E4C92 100%)";

function ServiceCard({ icon, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.22)",
        background: "rgba(255,255,255,0.08)",
        marginBottom: 12,
        cursor: "pointer",
        textAlign: "left",
        transition: "background .15s ease, border-color .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.14)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: "rgba(255,255,255,0.16)",
          fontSize: 20,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.68)" }}>{desc}</div>
      </div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}>&#8250;</div>
    </button>
  );
}

export default function LandingGateway({ onSelect }) {
  const [bgUrl, setBgUrl] = useState(null);
  useEffect(() => {
    const candidates = ["/portal-bg.jpg", "/portal-bg.jpeg", "/portal-bg.png", "/login-bg.jpg", "/login-bg.jpeg", "/login-bg.png"];
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

  const bg = bgUrl
    ? `linear-gradient(180deg, rgba(5,20,40,0.50), rgba(5,20,40,0.65)), url(${bgUrl})`
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
      }}
    >
      <div
        className="login-glass"
        style={{
          width: "100%",
          maxWidth: 460,
          padding: "42px 40px 38px",
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
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 12px 30px rgba(0,0,0,0.30), 0 0 0 4px rgba(255,255,255,0.15)",
              border: "3px solid rgba(255,255,255,0.7)",
              overflow: "hidden",
            }}
          >
            <AutoLogo
              alt="Logo PLN"
              style={{
                display: "block",
                maxWidth: 66,
                maxHeight: 66,
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>
        </div>

        <h1
          style={{
            fontFamily: font.display,
            fontSize: 32,
            fontWeight: 700,
            textAlign: "center",
            margin: "0 0 4px",
            letterSpacing: -0.5,
            textShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          Selamat Datang
        </h1>
        <p
          style={{
            textAlign: "center",
            margin: "0 0 22px",
            fontSize: 12.5,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Portal Layanan UBP Priok
        </p>

        <ServiceCard
          icon={<img src={silapakLogo} alt="Si Lapak Priok" style={{ width: 30, height: 30, objectFit: "contain" }} />}
          title="Si Lapak Priok"
          desc="Penerimaan tamu dan paket"
          onClick={() => onSelect("silapak")}
        />
        <ServiceCard
          icon={<img src={sikasLogo} alt="SIKAS" style={{ width: 30, height: 30, objectFit: "contain" }} />}
          title="SIKAS"
          desc="Sistem Realisasi dan Monitoring CSR"
          onClick={() => onSelect("sikas")}
        />
        <ServiceCard
          icon={<img src={mitraLogo} alt="Pengajuan Mitra" style={{ width: 30, height: 30, objectFit: "contain" }} />}
          title="Pengajuan Mitra"
          desc="Pengajuan proposal kerjasama mitra"
          onClick={() => onSelect("mitra")}
        />
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
