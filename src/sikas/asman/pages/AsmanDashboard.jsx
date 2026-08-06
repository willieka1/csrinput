import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Inbox as InboxIcon, ThumbsDown, ThumbsUp, Clock } from "lucide-react";
import { T, font } from "../../../lib/theme";
import { DOC_STATUS, STATUS_META } from "../../../lib/data";
import PageHeader from "../../../components/PageHeader";
import Card from "../../../components/Card";
import DataTable from "../../../components/DataTable";

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

function CounterTile({ icon: Icon, label, value, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
        padding: "18px 18px 16px",
        borderRadius: 14,
        border: `1px solid ${meta.color}40`,
        background: `linear-gradient(140deg, ${meta.bg} 0%, #fff 130%)`,
        cursor: "pointer",
        textAlign: "left",
        overflow: "hidden",
        transition: "transform .12s ease, box-shadow .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(10,42,80,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        display: "grid", placeItems: "center",
        background: meta.color, color: "#fff",
      }}>
        <Icon size={19} />
      </div>
      <div style={{
        fontSize: 10.5, letterSpacing: 1.4, textTransform: "uppercase",
        fontFamily: font.mono, color: meta.color, fontWeight: 700,
      }}>{label}</div>
      <div style={{
        fontFamily: font.display, fontSize: 32, lineHeight: 1, color: T.heading,
      }}>{value}</div>
      <span aria-hidden style={{
        position: "absolute", right: -18, bottom: -18,
        width: 90, height: 90, borderRadius: "50%",
        background: meta.color, opacity: 0.05,
      }}/>
    </button>
  );
}

export default function AsmanDashboard({ user, packages, evaluasiList = [], goto }) {
  const counts = useMemo(() => {
    const c = { submitted: 0, approved: 0, rejected: 0, processed: 0 };
    for (const p of packages) {
      if (p.status === DOC_STATUS.SUBMITTED || p.status === DOC_STATUS.IN_REVIEW) c.submitted++;
      else if (p.status === DOC_STATUS.APPROVED) c.approved++;
      else if (p.status === DOC_STATUS.REJECTED) c.rejected++;
      else if (p.status === DOC_STATUS.PROCESSED) c.processed++;
    }
    return c;
  }, [packages]);

  const evalCounts = useMemo(() => {
    const c = { submitted: 0, approved: 0, rejected: 0, processed: 0 };
    for (const e of evaluasiList) {
      if (e.status === DOC_STATUS.SUBMITTED || e.status === DOC_STATUS.IN_REVIEW) c.submitted++;
      else if (e.status === DOC_STATUS.APPROVED) c.approved++;
      else if (e.status === DOC_STATUS.REJECTED) c.rejected++;
      else if (e.status === DOC_STATUS.PROCESSED) c.processed++;
    }
    return c;
  }, [evaluasiList]);

  const recent = useMemo(() => {
    const sortKey = (p) => p.processedAt || p.reviewedAt || p.submittedAt || "";
    return [...packages]
      .sort((a, b) => (sortKey(b) || "").localeCompare(sortKey(a) || ""))
      .slice(0, 8);
  }, [packages]);

  const roleLabel = user.role === "asman" ? "Asman" : "MADM";
  const desc = user.role === "asman"
    ? "Ringkasan paket kas dan Form Evaluasi yang masuk untuk direview. Klik counter untuk buka Inbox."
    : "Ringkasan paket kas dan Form Evaluasi yang menunggu diproses. Klik counter untuk buka Inbox.";

  return (
    <div>
      <PageHeader
        eyebrow={`Panel ${roleLabel}`}
        title="Dashboard Ringkasan"
        description={desc}
      />

      <div style={{ marginBottom: 14 }}>
        <LiveClock />
      </div>

      <div style={{
        fontFamily: font.mono, fontSize: 10.5, letterSpacing: 1.2,
        textTransform: "uppercase", color: T.muted, marginBottom: 8,
      }}>
        Inbox RAB
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 14, marginBottom: 18,
      }}>
        <CounterTile icon={InboxIcon}    label="Dokumen Baru Masuk" value={counts.submitted} meta={STATUS_META.submitted} onClick={() => goto("inbox")} />
        <CounterTile icon={ThumbsUp}     label="Dokumen Disetujui"  value={counts.approved}  meta={STATUS_META.approved}  onClick={() => goto("inbox")} />
        <CounterTile icon={ThumbsDown}   label="Dokumen Ditolak"    value={counts.rejected}  meta={STATUS_META.rejected}  onClick={() => goto("inbox")} />
        <CounterTile icon={CheckCircle2} label="Telah Diproses"     value={counts.processed} meta={STATUS_META.processed} onClick={() => goto("inbox")} />
      </div>

      <div style={{
        fontFamily: font.mono, fontSize: 10.5, letterSpacing: 1.2,
        textTransform: "uppercase", color: T.muted, marginBottom: 8,
      }}>
        Inbox Form Evaluasi
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 14, marginBottom: 18,
      }}>
        <CounterTile icon={InboxIcon}    label="Eval Baru Masuk" value={evalCounts.submitted} meta={STATUS_META.submitted} onClick={() => goto("inbox-evaluasi")} />
        <CounterTile icon={ThumbsUp}     label="Eval Disetujui"  value={evalCounts.approved}  meta={STATUS_META.approved}  onClick={() => goto("inbox-evaluasi")} />
        <CounterTile icon={ThumbsDown}   label="Eval Ditolak"    value={evalCounts.rejected}  meta={STATUS_META.rejected}  onClick={() => goto("inbox-evaluasi")} />
        <CounterTile icon={CheckCircle2} label="Telah Diproses"  value={evalCounts.processed} meta={STATUS_META.processed} onClick={() => goto("inbox-evaluasi")} />
      </div>

      <Card padded={false}>
        <div style={{
          padding: "14px 18px",
          borderBottom: `1px solid ${T.border}`,
          fontFamily: font.display, fontSize: 14,
        }}>
          Aktivitas Terbaru
        </div>
        <DataTable
          rows={recent}
          columns={[
            { key: "idRab", label: "ID Paket",
              render: (r) => <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 12.5 }}>{r.idRab}</span> },
            { key: "judul",    label: "Judul" },
            { key: "kategori", label: "Kategori" },
            { key: "status",   label: "Status",
              render: (r) => {
                const m = STATUS_META[r.status] || STATUS_META.draft;
                return (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "3px 10px", borderRadius: 999,
                    background: m.bg, color: m.color,
                    fontSize: 11.5, fontWeight: 700,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color }} />
                    {m.label}
                  </span>
                );
              },
            },
            { key: "updatedAt", label: "Update Terakhir",
              render: (r) => {
                const t = r.processedAt || r.reviewedAt || r.submittedAt;
                return t ? new Date(t).toLocaleString("id-ID", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                }) : "-";
              },
            },
          ]}
          emptyLabel="Belum ada aktivitas."
          onRowClick={() => goto("inbox")}
        />
      </Card>
    </div>
  );
}
