import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Handshake,
  Megaphone,
  Sparkles,
  Clock,
} from "lucide-react";
import { T, font } from "../../lib/theme";
import { roleLabel, rupiah } from "../../lib/utils";
import Card from "../../components/Card";
import Badge, { StatusBadge } from "../../components/Badge";

// ---------------- greeting kontekstual (bukan sekedar "Selamat Datang") ----
function greetingFor(hour) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

// ---------------- summary tile ---------------------------------------------
function Tile({ icon: Icon, value, label, tone = "blue", onClick }) {
  const bg = tone === "yellow" ? "#FFF4D6" : T.blueSoft;
  const fg = tone === "yellow" ? T.yellowText : T.blue;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        border: `1px solid ${T.border}`,
        background: T.card,
        borderRadius: 10,
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        transition: "border-color .15s ease, transform .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = fg;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: bg,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={fg} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: font.display,
            fontSize: 22,
            color: T.heading,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: T.muted,
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
      </div>
    </button>
  );
}

// ---------------- pipeline (Proposal → RAB → BAST → Laporan) --------------
function Pipeline({ counts, goto }) {
  const nodes = [
    { key: "proposal-rekap", label: "Proposal", value: counts.proposal, icon: Handshake },
    { key: "rab", label: "RAB", value: counts.rab, icon: FileSpreadsheet },
    { key: "bast", label: "BAST, PI, TOR", value: counts.bastPiTor, icon: ClipboardList },
    { key: "laporan", label: "Laporan", value: counts.laporan, icon: FileText },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))`,
        gap: 10,
        alignItems: "stretch",
      }}
    >
      {nodes.map((n, i) => {
        const Icon = n.icon;
        return (
          <button
            key={n.key}
            onClick={() => goto(n.key)}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "16px 10px",
              background: T.bg,
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              cursor: "pointer",
              textAlign: "center",
              transition: "background .15s ease, border-color .15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.blueSoft;
              e.currentTarget.style.borderColor = T.blue;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.bg;
              e.currentTarget.style.borderColor = T.border;
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: T.card,
                color: T.blue,
                display: "grid",
                placeItems: "center",
                border: `1px solid ${T.border}`,
              }}
            >
              <Icon size={15} />
            </div>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: 0.3 }}>
              {n.label}
            </div>
            <div
              style={{
                fontFamily: font.display,
                fontSize: 20,
                color: T.heading,
                lineHeight: 1,
              }}
            >
              {n.value}
            </div>
            {i < nodes.length - 1 && (
              <ArrowRight
                size={14}
                color={T.muted}
                style={{
                  position: "absolute",
                  right: -12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: T.card,
                  padding: 1,
                  borderRadius: 6,
                  zIndex: 1,
                }}
                className="hide-mobile"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------- panels -------------------------------------------------
function ProposalSpotlight({ items, goto }) {
  const shown = items.slice(0, 3);
  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            fontFamily: font.display,
            fontSize: 15.5,
            margin: 0,
            color: T.heading,
          }}
        >
          Proposal Terbaru
        </h3>
        <button
          onClick={() => goto("proposal-rekap")}
          style={{
            background: "transparent",
            border: "none",
            color: T.blue,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Lihat semua →
        </button>
      </div>
      {!shown.length && (
        <div style={{ fontSize: 13, color: T.muted, padding: "18px 0" }}>
          Belum ada proposal masuk. Klik menu <b>Proposal Stakeholder</b> untuk mulai.
        </div>
      )}
      {shown.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            gap: 12,
            padding: "10px 0",
            borderBottom:
              i < shown.length - 1 ? `1px solid ${T.border}` : "none",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: T.blueSoft,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Handshake size={15} color={T.blue} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: T.heading,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p.judulProposal || "(tanpa judul)"}
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>
              {p.namaLembaga} · {p.nilaiDiajukan ? rupiah(p.nilaiDiajukan) : "-"}
            </div>
          </div>
          <div style={{ alignSelf: "center" }}>
            <StatusBadge value={p.statusProposal} />
          </div>
        </div>
      ))}
    </Card>
  );
}

function KontenPipeline({ items, goto }) {
  // Highlight konten yang butuh perhatian: Draft (belum terbit).
  const perluAksi = items.filter((k) => k.status === "Draft");
  const shown = perluAksi.slice(0, 3);
  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            fontFamily: font.display,
            fontSize: 15.5,
            margin: 0,
            color: T.heading,
          }}
        >
          Antrean Publikasi
        </h3>
        <button
          onClick={() => goto("konten")}
          style={{
            background: "transparent",
            border: "none",
            color: T.blue,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Buka Mirroring Konten →
        </button>
      </div>
      {!shown.length && (
        <div style={{ fontSize: 13, color: T.muted, padding: "18px 0" }}>
          Tidak ada konten yang menunggu terbit,semua sudah published atau
          dibatalkan.
        </div>
      )}
      {shown.map((k, i) => {
        const jmlPublikasi = Array.isArray(k.publikasi) ? k.publikasi.length : 0;
        return (
          <div
            key={k.id}
            style={{
              display: "flex",
              gap: 12,
              padding: "10px 0",
              borderBottom: i < shown.length - 1 ? `1px solid ${T.border}` : "none",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "#FFF4D6",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Megaphone size={15} color={T.yellowText} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.heading,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {k.judul || "(tanpa judul)"}
              </div>
              <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>
                {k.kategori || "-"} · {k.tanggal || "belum dijadwal"}
                {jmlPublikasi ? ` · ${jmlPublikasi} publikasi` : ""}
              </div>
            </div>
            <div style={{ alignSelf: "center" }}>
              <StatusBadge value={k.status} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 8,
      background: T.blueSoft, border: `1px solid ${T.border}`,
      fontSize: 12.5, color: T.blue, fontWeight: 600,
      fontFamily: font.mono,
    }}>
      <Clock size={13} />
      {dateStr} - {timeStr} WIB
    </div>
  );
}

export default function Dashboard({ data, goto, user }) {
  const now = new Date();
  const greeting = greetingFor(now.getHours());

  const proposalCounts = {
    total: data.proposals.length,
    baru: data.proposals.filter((p) => p.statusProposal === "Baru Masuk").length,
    disetujui: data.proposals.filter((p) => p.statusProposal === "Disetujui").length,
  };
  const kontenCounts = {
    total: data.konten.length,
    draft: data.konten.filter((k) => k.status === "Draft").length,
    terbit: data.konten.filter((k) => k.status === "Terbit").length,
  };
  const kontenPerluAksi = kontenCounts.draft;

  return (
    <div>
      {/* Header,greeting + tanggal panjang */}
      <div
        style={{
          marginBottom: 22,
          paddingBottom: 18,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            borderRadius: 999,
            background: T.blueSoft,
            color: T.blue,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontFamily: font.mono,
            marginBottom: 6,
          }}
        >
          <Sparkles size={11} /> UBP Priok - TJSL
        </div>
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 24,
            margin: 0,
            color: T.heading,
            lineHeight: 1.25,
          }}
        >
          {greeting}
          {user?.role ? `, ${roleLabel(user.role)}` : ""}.
        </h1>
        <div style={{ marginTop: 8 }}>
          <LiveClock />
        </div>
      </div>

      {/* Stakeholder + Konten tiles */}
      <div
        className="stat-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Tile
          icon={Handshake}
          value={proposalCounts.total}
          label={`${proposalCounts.baru} baru · ${proposalCounts.disetujui} disetujui`}
          onClick={() => goto("proposal-rekap")}
        />
        <Tile
          icon={Megaphone}
          value={kontenCounts.total}
          label={`${kontenCounts.terbit} terbit · ${kontenPerluAksi} antrean`}
          tone="yellow"
          onClick={() => goto("konten")}
        />
        <Tile
          icon={FileSpreadsheet}
          value={data.rab.length}
          label="RAB diajukan"
          onClick={() => goto("rab")}
        />
      </div>

      {/* Pipeline visual */}
      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              fontFamily: font.display,
              fontSize: 15.5,
              margin: 0,
              color: T.heading,
            }}
          >
            Alur Kerja SIKAS
          </h3>
          <span style={{ fontSize: 11.5, color: T.muted }}>
            proposal → administrasi kas → realisasi
          </span>
        </div>
        <Pipeline
          counts={{
            proposal: data.proposals.length,
            rab: data.rab.length,
            bastPiTor:
              (data.bast?.length || 0) +
              (data.pakta?.length || 0) +
              (data.tor?.length || 0),
            laporan: data.laporan.length,
          }}
          goto={goto}
        />
      </Card>

      {/* Panels: proposal terbaru + antrean publikasi konten */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <ProposalSpotlight items={data.proposals} goto={goto} />
        <KontenPipeline items={data.konten} goto={goto} />
      </div>

      {/* RAB terbaru,referensi cepat */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              fontFamily: font.display,
              fontSize: 15.5,
              margin: 0,
              color: T.heading,
            }}
          >
            RAB Terbaru
          </h3>
          <button
            onClick={() => goto("rab")}
            style={{
              background: "transparent",
              border: "none",
              color: T.blue,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Semua RAB →
          </button>
        </div>
        {!data.rab.length ? (
          <div style={{ fontSize: 13, color: T.muted, padding: "12px 0" }}>
            Belum ada RAB diajukan. Buka menu RAB → “Add New RAB” untuk membuat
            pengajuan pertama.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 10,
            }}
          >
            {data.rab
              .slice(-4)
              .reverse()
              .map((r) => (
                <div
                  key={r.idNumber}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontWeight: 700,
                        color: T.navy,
                        fontSize: 12,
                      }}
                    >
                      {r.idNumber}
                    </span>
                    <Badge tone="blue">{r.kategori || "-"}</Badge>
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: T.text,
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.judulKegiatan || "-"}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: T.muted }}>
                    {rupiah(r.totalEvaluasi)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
