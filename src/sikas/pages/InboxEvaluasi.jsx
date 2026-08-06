import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, Check, ClipboardList, X,
} from "lucide-react";
import { T, font } from "../../lib/theme";
import { DOC_STATUS, STATUS_META } from "../../lib/data";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";

const TAB_FILTERS = {
  masuk:     (e) => e.status === DOC_STATUS.SUBMITTED || e.status === DOC_STATUS.IN_REVIEW,
  disetujui: (e) => e.status === DOC_STATUS.APPROVED,
  ditolak:   (e) => e.status === DOC_STATUS.REJECTED,
  diproses:  (e) => e.status === DOC_STATUS.PROCESSED,
};

const TABS = [
  { key: "masuk",     label: "Eval Baru Masuk" },
  { key: "disetujui", label: "Eval Disetujui" },
  { key: "ditolak",   label: "Eval Ditolak" },
  { key: "diproses",  label: "Telah Diproses" },
];

function StatusPill({ statusKey, rejectedBy }) {
  const meta = STATUS_META[statusKey] || STATUS_META.draft;
  let label = meta.label;
  if (statusKey === DOC_STATUS.REJECTED && rejectedBy) {
    label = rejectedBy === "asman" ? "Ditolak Asman" : "Ditolak MADM";
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 999,
      background: meta.bg, color: meta.color,
      fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
      {label}
    </span>
  );
}

export default function InboxEvaluasiPage({ user, evaluasiList, onUpdateEvaluasi, notify }) {
  const [tab, setTab] = useState("masuk");
  const [detail, setDetail] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const counts = useMemo(() => {
    const c = { masuk: 0, disetujui: 0, ditolak: 0, diproses: 0 };
    for (const e of evaluasiList) {
      for (const t of TABS) if (TAB_FILTERS[t.key](e)) c[t.key] += 1;
    }
    return c;
  }, [evaluasiList]);

  const rows = useMemo(
    () => evaluasiList.filter(TAB_FILTERS[tab]),
    [evaluasiList, tab]
  );

  const openItem = (e) => {
    setDetail(e);
    if (user.role === "asman" && e.status === DOC_STATUS.SUBMITTED) {
      onUpdateEvaluasi(e.id, { status: DOC_STATUS.IN_REVIEW });
    }
  };

  const doApprove = () => {
    if (!detail) return;
    onUpdateEvaluasi(detail.id, {
      status: DOC_STATUS.APPROVED,
      reviewedBy: user.username,
      reviewedAt: new Date().toISOString(),
      reviewNote: "",
    });
    notify(`Form Evaluasi ${detail.proposalId} disetujui - dikirim ke MADM.`, "success");
    setDetail(null);
  };

  const doReject = () => {
    if (!detail || !rejectNote.trim()) return;
    const now = new Date().toISOString();
    const patch = { status: DOC_STATUS.REJECTED };
    if (user.role === "asman") {
      patch.reviewedBy = user.username;
      patch.reviewedAt = now;
      patch.reviewNote = rejectNote.trim();
      patch.rejectedBy = "asman";
    } else if (user.role === "madm") {
      patch.processedBy = user.username;
      patch.processedAt = now;
      patch.processNote = rejectNote.trim();
      patch.rejectedBy = "madm";
    }
    onUpdateEvaluasi(detail.id, patch);
    notify(`Form Evaluasi ${detail.proposalId} ditolak - catatan dikirim ke Humas.`, "error");
    setRejectNote(""); setRejectOpen(false); setDetail(null);
  };

  const doProcess = () => {
    if (!detail) return;
    onUpdateEvaluasi(detail.id, {
      status: DOC_STATUS.PROCESSED,
      processedAt: new Date().toISOString(),
      processedBy: user.username,
      processNote: "",
    });
    notify(`Form Evaluasi ${detail.proposalId} selesai diproses - notifikasi dikirim ke Humas.`, "success");
    setDetail(null);
  };

  const liveDetail = detail ? (evaluasiList.find((e) => e.id === detail.id) || detail) : null;

  return (
    <div>
      <PageHeader
        eyebrow={user.role === "asman" ? "Panel Asman" : "Panel MADM"}
        title="Inbox Form Evaluasi"
        description={
          user.role === "asman"
            ? "Form Evaluasi proposal yang dikirim Humas. Klik untuk buka, kasih catatan, lalu setujui / tolak."
            : "Tandai Form Evaluasi yang sudah disetujui Asman sebagai selesai diproses."
        }
      />

      <Card style={{ marginBottom: 14, padding: 12 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))`,
          gap: 8,
        }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start",
                  gap: 4, padding: "10px 12px",
                  border: `1px solid ${active ? T.blue : T.border}`,
                  background: active ? T.blueSoft : T.card,
                  borderRadius: 10, cursor: "pointer",
                  transition: "border-color .15s ease, background-color .15s ease",
                  textAlign: "left",
                }}
              >
                <span style={{
                  fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase",
                  fontFamily: font.mono, color: active ? T.blue : T.muted,
                }}>{t.label}</span>
                <span style={{
                  fontFamily: font.display, fontSize: 22, lineHeight: 1,
                  color: active ? T.blue : T.heading,
                }}>{counts[t.key]}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card padded={false}>
        <DataTable
          rows={rows}
          columns={[
            { key: "proposalId", label: "ID Proposal",
              render: (r) => <span style={{ fontFamily: font.mono, fontSize: 12.5, fontWeight: 700 }}>{r.proposalId}</span> },
            { key: "namaLembaga", label: "Instansi" },
            { key: "judulProposal", label: "Judul" },
            { key: "skorAkhir", label: "Skor", render: (r) => r.skorAkhir?.toFixed(2) ?? "-" },
            { key: "status", label: "Status", render: (r) => <StatusPill statusKey={r.status} rejectedBy={r.rejectedBy} /> },
          ]}
          onRowClick={openItem}
          emptyLabel={
            tab === "masuk"     ? "Belum ada Form Evaluasi baru masuk." :
            tab === "disetujui" ? "Belum ada Form Evaluasi yang disetujui." :
            tab === "ditolak"   ? "Tidak ada Form Evaluasi yang ditolak." :
                                  "Belum ada Form Evaluasi yang selesai diproses."
          }
        />
      </Card>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Form Evaluasi - ${detail.proposalId}` : ""}
        icon={ClipboardList}
        width={560}
      >
        {detail && liveDetail && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <StatusPill statusKey={liveDetail.status} rejectedBy={liveDetail.rejectedBy} />
              {liveDetail.reviewedBy && (
                <span style={{ fontSize: 11.5, color: T.muted }}>
                  di-review oleh <b>{liveDetail.reviewedBy}</b>
                  {liveDetail.reviewedAt && ` · ${new Date(liveDetail.reviewedAt).toLocaleString("id-ID")}`}
                </span>
              )}
              {liveDetail.processedAt && (
                <span style={{ fontSize: 11.5, color: T.muted }}>
                  diproses oleh <b>{liveDetail.processedBy || "madm"}</b>
                  {` · ${new Date(liveDetail.processedAt).toLocaleString("id-ID")}`}
                </span>
              )}
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "140px 1fr",
              rowGap: 6, columnGap: 12, fontSize: 13, marginBottom: 14,
            }}>
              <div style={{ color: T.muted }}>Instansi</div>
              <div style={{ fontWeight: 600 }}>{liveDetail.namaLembaga}</div>
              <div style={{ color: T.muted }}>Judul Proposal</div>
              <div>{liveDetail.judulProposal}</div>
              <div style={{ color: T.muted }}>Penilai</div>
              <div>{liveDetail.penilai}</div>
              <div style={{ color: T.muted }}>Skor Akhir</div>
              <div style={{ fontWeight: 700 }}>{liveDetail.skorAkhir?.toFixed(2)}</div>
              <div style={{ color: T.muted }}>Keputusan Skor</div>
              <div>{liveDetail.keputusan}</div>
              {liveDetail.catatan && (
                <>
                  <div style={{ color: T.muted }}>Catatan Penilai</div>
                  <div>{liveDetail.catatan}</div>
                </>
              )}
            </div>

            {liveDetail.reviewNote && (
              <div style={{
                padding: "10px 12px", borderRadius: 8, marginBottom: 8,
                background: STATUS_META.rejected.bg,
                border: `1px solid ${STATUS_META.rejected.color}30`,
                color: STATUS_META.rejected.color, fontSize: 12.5,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                  Catatan Asman ({liveDetail.reviewedBy || "asman"}):
                </div>
                {liveDetail.reviewNote}
              </div>
            )}
            {liveDetail.processNote && (
              <div style={{
                padding: "10px 12px", borderRadius: 8, marginBottom: 12,
                background: STATUS_META.processed.bg,
                border: `1px solid ${STATUS_META.processed.color}30`,
                color: STATUS_META.processed.color, fontSize: 12.5,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                  Catatan MADM ({liveDetail.processedBy || "madm"}):
                </div>
                {liveDetail.processNote}
              </div>
            )}

            <div style={{
              display: "flex", gap: 10, justifyContent: "flex-end",
              paddingTop: 14, borderTop: `1px solid ${T.border}`, flexWrap: "wrap",
            }}>
              <Button variant="ghost" onClick={() => setDetail(null)}>Tutup</Button>
              {user.role === "asman" &&
                (liveDetail.status === DOC_STATUS.SUBMITTED ||
                 liveDetail.status === DOC_STATUS.IN_REVIEW) && (
                <>
                  <Button variant="ghost" icon={X} onClick={() => setRejectOpen(true)}>Tolak</Button>
                  <Button variant="accent" icon={Check} onClick={doApprove}>Setujui</Button>
                </>
              )}
              {user.role === "madm" && liveDetail.status === DOC_STATUS.APPROVED && (
                <>
                  <Button variant="ghost" icon={X} onClick={() => setRejectOpen(true)}>Tolak</Button>
                  <Button variant="accent" icon={ArrowRight} onClick={doProcess}>Tandai Telah Diproses</Button>
                </>
              )}
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Tolak Form Evaluasi"
        icon={AlertTriangle}
        width={440}
      >
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>
          Isi catatan alasan penolakan. Catatan akan terlihat oleh Humas untuk direvisi dan dikirim ulang.
        </p>
        <textarea
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Contoh: Skor kategori Lembaga Pemohon terlalu tinggi, mohon ditinjau ulang."
          rows={4}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 12px", borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.inputBg, color: T.text,
            fontSize: 13, fontFamily: font.body, resize: "vertical",
          }}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
          <Button variant="ghost" onClick={() => setRejectOpen(false)}>Batal</Button>
          <Button variant="accent" icon={X} onClick={doReject} disabled={!rejectNote.trim()}>
            Konfirmasi Tolak
          </Button>
        </div>
      </Modal>
    </div>
  );
}
