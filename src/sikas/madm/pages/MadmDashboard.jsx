import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, FolderCheck, Inbox as InboxIcon, ThumbsDown } from "lucide-react";
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
      background: "#EBE2FF", border: "1px solid #C4A9FF",
      fontSize: 12.5, color: "#3F1D9B", fontWeight: 600,
      fontFamily: font.mono,
    }}>
      <Clock size={13} />
      {dateStr} • {timeStr} WIB
    </div>
  );
}

function Tile({ icon: Icon, label, value, meta, onClick }) {
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
      <div style={{ fontFamily: font.display, fontSize: 32, lineHeight: 1, color: T.heading }}>
        {value}
      </div>
      <span aria-hidden style={{
        position: "absolute", right: -18, bottom: -18,
        width: 90, height: 90, borderRadius: "50%",
        background: meta.color, opacity: 0.05,
      }}/>
    </button>
  );
}

export default function MadmDashboard({ user, packages, evaluasiList = [], goto }) {
  const counts = useMemo(() => {
    const c = { approved: 0, rejected: 0, processed: 0, total: 0 };
    for (const p of packages) {
      c.total++;
      if (p.status === DOC_STATUS.APPROVED) c.approved++;
      else if (p.status === DOC_STATUS.REJECTED) c.rejected++;
      else if (p.status === DOC_STATUS.PROCESSED) c.processed++;
    }
    return c;
  }, [packages]);

  const evalCounts = useMemo(() => {
    const c = { approved: 0, rejected: 0, processed: 0, total: 0 };
    for (const e of evaluasiList) {
      c.total++;
      if (e.status === DOC_STATUS.APPROVED) c.approved++;
      else if (e.status === DOC_STATUS.REJECTED) c.rejected++;
      else if (e.status === DOC_STATUS.PROCESSED) c.processed++;
    }
    return c;
  }, [evaluasiList]);

  const pending = useMemo(() =>
    packages
      .filter((p) => p.status === DOC_STATUS.APPROVED)
      .sort((a, b) => (b.reviewedAt || "").localeCompare(a.reviewedAt || ""))
  , [packages]);

  return (
    <div>
      <PageHeader
        eyebrow="Panel MADM"
        title="Dashboard MADM"
        description="Paket kas dan Form Evaluasi yang telah disetujui Asman dan menunggu diproses oleh MADM."
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
        <Tile icon={InboxIcon}    label="Menunggu Diproses" value={counts.approved}  meta={STATUS_META.approved}  onClick={() => goto("inbox")} />
        <Tile icon={CheckCircle2} label="Telah Diproses"    value={counts.processed} meta={STATUS_META.processed} onClick={() => goto("inbox")} />
        <Tile icon={ThumbsDown}   label="Ditolak"           value={counts.rejected}  meta={STATUS_META.rejected}  onClick={() => goto("inbox")} />
        <Tile icon={FolderCheck}  label="Total Paket"       value={counts.total}     meta={STATUS_META.in_review} onClick={() => goto("inbox")} />
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
        <Tile icon={InboxIcon}    label="Menunggu Diproses" value={evalCounts.approved}  meta={STATUS_META.approved}  onClick={() => goto("inbox-evaluasi")} />
        <Tile icon={CheckCircle2} label="Telah Diproses"    value={evalCounts.processed} meta={STATUS_META.processed} onClick={() => goto("inbox-evaluasi")} />
        <Tile icon={ThumbsDown}   label="Ditolak"           value={evalCounts.rejected}  meta={STATUS_META.rejected}  onClick={() => goto("inbox-evaluasi")} />
        <Tile icon={FolderCheck}  label="Total Evaluasi"    value={evalCounts.total}     meta={STATUS_META.in_review} onClick={() => goto("inbox-evaluasi")} />
      </div>


      <Card padded={false}>
        <div style={{
          padding: "14px 18px",
          borderBottom: `1px solid ${T.border}`,
          fontFamily: font.display, fontSize: 14, fontWeight: 600,
          color: T.heading,
        }}>
          Paket Menunggu Diproses MADM
        </div>
        <DataTable
          rows={pending}
          columns={[
            {
              key: "idRab", label: "ID RAB",
              render: (r) => (
                <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 12.5, color: T.navy }}>
                  {r.idRab}
                </span>
              ),
            },
            { key: "judul", label: "Judul Kegiatan" },
            { key: "kategori", label: "Kategori" },
            {
              key: "reviewedAt", label: "Disetujui Asman",
              render: (r) => r.reviewedAt
                ? new Date(r.reviewedAt).toLocaleString("id-ID", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })
                : "-",
            },
          ]}
          emptyLabel="Tidak ada paket yang menunggu diproses."
          onRowClick={() => goto("inbox")}
        />
      </Card>
    </div>
  );
}
