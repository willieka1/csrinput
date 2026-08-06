import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardList, Eye, FileDown, FileSpreadsheet, Save } from "lucide-react";
import { T, font } from "../../lib/theme";
import { hitungSkorEvaluasi, uid } from "../../lib/utils";
import { evaluasiKategoriFields, EVALUASI_NILAI_OPTIONS } from "../../lib/wizardFields";
import { DOC_STATUS, STATUS_META } from "../../lib/data";
import { generateEvaluasiXlsx } from "../../lib/xlsxGenerate";
import { generateEvaluasiPdf } from "../../lib/pdf";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import { StatusBadge } from "../../components/Badge";
import Badge from "../../components/Badge";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";

const KATEGORI = evaluasiKategoriFields();

const LIST_COLUMNS_BASE = [
  { key: "id", label: "ID" },
  { key: "namaLembaga", label: "Nama Instansi" },
  { key: "judulProposal", label: "Judul Proposal/Kegiatan" },
  { key: "tanggalKegiatan", label: "Tanggal Kegiatan" },
  { key: "statusProposal", label: "Status", render: (r) => <StatusBadge value={r.statusProposal} /> },
];

const TERSIMPAN_COLUMNS = [
  { key: "proposalId", label: "ID Proposal" },
  { key: "namaLembaga", label: "Instansi" },
  { key: "penilai", label: "Penilai" },
  { key: "tanggalPenilaian", label: "Tanggal Penilaian" },
  {
    key: "skorAkhir",
    label: "Skor Akhir",
    render: (r) => <span style={{ fontFamily: font.mono, fontWeight: 700 }}>{r.skorAkhir.toFixed(2)}</span>,
  },
  {
    key: "keputusan",
    label: "Keputusan",
    render: (r) => (
      <Badge tone={r.keputusan === "Permohonan Disetujui" ? "success" : "danger"}>
        {r.keputusan}
      </Badge>
    ),
  },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyPenilaian() {
  return { penilai: "Wahyu Andrias", tanggalPenilaian: todayIso(), nilai: {}, catatan: "" };
}

export default function ProposalEvaluasiPage({ proposals, evaluasiList, setEvaluasiList, notify }) {
  const [selectedId, setSelectedId] = useState(null);
  const [penilaian, setPenilaian] = useState(emptyPenilaian());
  const [saving, setSaving] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  const selected = proposals.find((p) => p.id === selectedId) || null;

  const evaluasiByProposalId = useMemo(() => {
    const map = {};
    evaluasiList.forEach((e) => {
      map[e.proposalId] = e;
    });
    return map;
  }, [evaluasiList]);

  const LIST_COLUMNS = useMemo(
    () => [
      ...LIST_COLUMNS_BASE,
      {
        key: "_evalStatus",
        label: "Status Evaluasi",
        render: (r) => {
          const rec = evaluasiByProposalId[r.id];
          if (!rec) return <Badge tone="muted">Belum Dievaluasi</Badge>;
          const meta = STATUS_META[rec.status] || STATUS_META.submitted;
          let label = meta.label;
          if (rec.status === DOC_STATUS.REJECTED && rec.rejectedBy) {
            label = rec.rejectedBy === "asman" ? "Ditolak Asman" : "Ditolak MADM";
          }
          return (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 10px", borderRadius: 999,
              background: meta.bg, color: meta.color,
              fontSize: 11.5, fontWeight: 700,
            }}>
              {label}
            </span>
          );
        },
      },
    ],
    [evaluasiByProposalId]
  );

  const selectRow = (row) => {
    setSelectedId(row.id);
    const existing = evaluasiByProposalId[row.id];
    setPenilaian(
      existing
        ? {
            penilai: existing.penilai,
            tanggalPenilaian: existing.tanggalPenilaian,
            nilai: { ...existing.nilai },
            catatan: existing.catatan,
          }
        : emptyPenilaian()
    );
  };

  const setNilai = (kategoriKey, val) =>
    setPenilaian((prev) => ({ ...prev, nilai: { ...prev.nilai, [kategoriKey]: val } }));

  const { perKategori, skorAkhir } = useMemo(
    () => hitungSkorEvaluasi(KATEGORI, penilaian.nilai),
    [penilaian.nilai]
  );

  // Sama persis dengan formula L37 di template: =IF(Q30<=50,"Ditolak","Disetujui")
  const keputusanOtomatis = skorAkhir <= 50 ? "Permohonan Ditolak" : "Permohonan Disetujui";

  const buildRecord = () => ({
    id: evaluasiByProposalId[selected.id]?.id || uid("EVL"),
    proposalId: selected.id,
    namaLembaga: selected.namaLembaga,
    judulProposal: selected.judulProposal,
    penilai: penilaian.penilai,
    tanggalPenilaian: penilaian.tanggalPenilaian,
    nilai: { ...penilaian.nilai },
    catatan: penilaian.catatan,
    skorAkhir,
    keputusan: keputusanOtomatis,
    // Setiap kali Humas simpan/kirim ulang, statusnya balik ke SUBMITTED —
    // masuk antrean baru ke Inbox Asman, catatan penolakan sebelumnya
    // dibersihkan supaya gak ketuker sama catatan yang lama.
    status: DOC_STATUS.SUBMITTED,
    reviewedBy: "", reviewedAt: "", reviewNote: "",
    processedBy: "", processedAt: "", processNote: "",
    rejectedBy: "",
  });

  const saveToState = () => {
    const record = buildRecord();
    setEvaluasiList((prev) => {
      const exists = prev.some((e) => e.proposalId === selected.id);
      return exists
        ? prev.map((e) => (e.proposalId === selected.id ? record : e))
        : [record, ...prev];
    });
    return record;
  };

  const handleDownloadXlsx = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await generateEvaluasiXlsx({
        id: selected.id,
        pemohon: selected.namaLembaga,
        perihal: selected.judulProposal,
        penilai: penilaian.penilai,
        tanggal: penilaian.tanggalPenilaian,
        nilaiMap: penilaian.nilai,
        catatan: penilaian.catatan,
        outputName: `Form-Evaluasi-${selected.id}.xlsx`,
      });
      saveToState();
      if (notify) notify("Form Evaluasi tersimpan & berhasil diunduh (.xlsx)!", "success", "Form Evaluasi");
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(`Gagal menyimpan Form Evaluasi: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selected) return;
    setSavingPdf(true);
    try {
      await generateEvaluasiPdf({
        id: selected.id,
        pemohon: selected.namaLembaga,
        perihal: selected.judulProposal,
        penilai: penilaian.penilai,
        tanggal: penilaian.tanggalPenilaian,
        perKategori,
        skorAkhir,
        keputusan: keputusanOtomatis,
        catatan: penilaian.catatan,
        filename: `Form-Evaluasi-${selected.id}`,
      });
      saveToState();
      if (notify) notify("Form Evaluasi tersimpan & berhasil diunduh (.pdf)!", "success", "Form Evaluasi");
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(`Gagal membuat PDF Form Evaluasi: ${e.message}`);
    } finally {
      setSavingPdf(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Humas & Publikasi"
        title="Cetak Form Evaluasi"
        description="Pilih Proposal ID - ID/Pemohon/Perihal otomatis terisi. Isi Nilai tiap kategori seperti mengisi Excel, lalu simpan sebagai .xlsx sesuai template resmi. Hasilnya juga tersimpan di aplikasi supaya bisa dilihat lagi kapan saja."
      />

      <Card padded={false} style={{ marginBottom: 20 }}>
        <DataTable
          rows={proposals}
          columns={LIST_COLUMNS}
          emptyLabel="Belum ada proposal. Tambahkan lewat menu Rekap Pengajuan Proposal terlebih dahulu."
          onRowClick={selectRow}
          searchPlaceholder="Cari Proposal ID / instansi…"
        />
      </Card>

      {!selected && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: T.muted, fontSize: 13.5 }}>
            <ClipboardList size={18} />
            Pilih salah satu proposal di atas untuk mengisi Form Evaluasi.
          </div>
        </Card>
      )}

      {selected && (
        <Card>
          {(() => {
            const rec = evaluasiByProposalId[selected.id];
            if (!rec || rec.status !== DOC_STATUS.REJECTED) return null;
            const note = rec.rejectedBy === "madm" ? rec.processNote : rec.reviewNote;
            const meta = STATUS_META.rejected;
            return (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 8,
                  marginBottom: 16,
                  background: meta.bg,
                  border: `1px solid ${meta.color}30`,
                  color: meta.color,
                  fontSize: 13,
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>
                    Ditolak oleh {rec.rejectedBy === "madm" ? "MADM" : "Asman"} — perlu direvisi
                  </div>
                  <div>{note || "Tidak ada catatan."}</div>
                  <div style={{ marginTop: 4, opacity: 0.85 }}>
                    Perbaiki nilai/catatan di bawah, lalu simpan lagi — otomatis dikirim ulang ke Inbox Asman.
                  </div>
                </div>
              </div>
            );
          })()}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <h3 style={{ fontFamily: font.display, fontSize: 16, margin: 0 }}>
              LEMBAR EVALUASI BANTUAN TJSL
            </h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button icon={FileSpreadsheet} onClick={handleDownloadXlsx} disabled={saving || savingPdf}>
                {saving ? "Menyimpan…" : "Unduh Excel (.xlsx)"}
              </Button>
              <Button variant="ghost" icon={FileDown} onClick={handleDownloadPdf} disabled={saving || savingPdf}>
                {savingPdf ? "Menyimpan…" : "Unduh PDF"}
              </Button>
            </div>
          </div>

          {/* --- grid ala spreadsheet, sel B7/B8/O7/O8 = identitas --- */}
          <table style={sheetTableStyle}>
            <tbody>
              <tr>
                <td style={{ ...cellLabel, width: 110 }}>ID Pengajuan:</td>
                <td style={{ ...cellReadonly, width: 130 }}>{selected.id}</td>
                <td style={cellLabel}>Penilai:</td>
                <td style={cellReadonly} colSpan={2}>{penilaian.penilai}</td>
              </tr>
              <tr>
                <td style={cellLabel}>PEMOHON:</td>
                <td style={cellReadonly} colSpan={1}>{selected.namaLembaga}</td>
                <td style={cellLabel}>Tanggal:</td>
                <td style={cellInput} colSpan={2}>
                  <input
                    type="text"
                    value={penilaian.tanggalPenilaian}
                    onChange={(e) => setPenilaian((p) => ({ ...p, tanggalPenilaian: e.target.value }))}
                    placeholder="YYYY-MM-DD"
                    style={inputStyle}
                  />
                </td>
              </tr>
              <tr>
                <td style={cellLabel}>PERIHAL:</td>
                <td style={cellReadonly} colSpan={4}>{selected.judulProposal}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ overflowX: "auto" }}>
          <table style={{ ...sheetTableStyle, marginTop: 14 }}>
            <thead>
              <tr>
                <th style={headCell}>NO</th>
                <th style={headCell}>KATEGORI PENILAIAN</th>
                <th style={{ ...headCell, textAlign: "left" }}>
                  Tidak Signifikan / Netral / Signifikan
                </th>
                <th style={headCell}>Nilai</th>
                <th style={headCell}>Bobot</th>
                <th style={headCell}>Total Skor</th>
              </tr>
            </thead>
            <tbody>
              {perKategori.map((k, i) => (
                <tr key={k.key}>
                  <td style={{ ...bodyCell, textAlign: "center", color: T.muted }}>{i + 1}</td>
                  <td style={{ ...bodyCell, fontWeight: 600 }}>{k.label}</td>
                  <td style={{ ...bodyCell, color: T.muted, lineHeight: 1.5, fontSize: 12 }}>
                    <div><b>TS:</b> {k.anchors.tidakSignifikan}</div>
                    <div><b>N:</b> {k.anchors.netral}</div>
                    <div><b>S:</b> {k.anchors.signifikan}</div>
                  </td>
                  <td style={{ ...bodyCell, padding: 4 }}>
                    <select
                      value={k.nilai || ""}
                      onChange={(e) => setNilai(k.key, e.target.value ? Number(e.target.value) : null)}
                      style={{ ...inputStyle, width: 78 }}
                    >
                      <option value="">–</option>
                      {EVALUASI_NILAI_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...bodyCell, textAlign: "center" }}>{k.bobot}</td>
                  <td style={{ ...bodyCell, textAlign: "center", fontWeight: 600 }}>
                    {k.nilai ? k.totalSkor.toFixed(2) : "-"}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} style={{ ...bodyCell, textAlign: "right", fontWeight: 700 }}>
                  Skor Akhir
                </td>
                <td style={{ ...bodyCell, textAlign: "center", fontWeight: 700, fontSize: 15 }}>
                  {skorAkhir.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={6} style={{ ...bodyCell, fontSize: 11.5, color: T.muted }}>
                  Ket: 0–50 = tidak direkomendasikan, 51–75 = Cukup untuk direkomendasikan dengan
                  pertimbangan, 76–100 = Direkomendasikan
                </td>
              </tr>
            </tbody>
          </table>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={fieldLabelStyle}>Catatan Penting / Rekomendasi</label>
            <textarea
              value={penilaian.catatan}
              onChange={(e) => setPenilaian((p) => ({ ...p, catatan: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, width: "100%", resize: "vertical" }}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              background: T.bg,
              border: `1px solid ${T.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12.5, color: T.muted }}>
              Diputuskan otomatis dari Skor Akhir (sama seperti rumus di template):
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: keputusanOtomatis === "Permohonan Disetujui" ? T.success : T.danger,
              }}
            >
              {keputusanOtomatis}
            </span>
          </div>

          <p style={{ color: T.muted, fontSize: 11.5, marginTop: 12, lineHeight: 1.5 }}>
            Kolom tanda tangan (Officer Community Development / Assistant Manager KAS /
            Administration Manager) tidak diubah - tetap sesuai template asli.
          </p>
        </Card>
      )}

      {/* --- Evaluasi yang sudah tersimpan di aplikasi --- */}
      <Card padded={false} style={{ marginTop: 20 }}>
        <div style={{ padding: "16px 16px 0" }}>
          <h3 style={{ fontFamily: font.display, fontSize: 15.5, margin: "0 0 4px", color: T.heading }}>
            Evaluasi Tersimpan
          </h3>
          <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 4px" }}>
            Klik salah satu baris atau tombol mata untuk melihat isi Form Evaluasi yang sudah pernah
            disimpan - tanpa perlu isi ulang atau download ulang.
          </p>
        </div>
        <DataTable
          rows={evaluasiList}
          columns={[
            ...TERSIMPAN_COLUMNS,
            {
              key: "_lihat",
              label: "",
              render: (r) => (
                <Button variant="ghost" icon={Eye} onClick={() => setViewingRecord(r)}>
                  Lihat
                </Button>
              ),
            },
          ]}
          emptyLabel="Belum ada Form Evaluasi yang disimpan. Isi & simpan evaluasi dari daftar proposal di atas."
          onRowClick={setViewingRecord}
          searchPlaceholder="Cari evaluasi tersimpan…"
        />
      </Card>

      <Modal
        open={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        title="Detail Form Evaluasi"
        icon={ClipboardList}
        width={640}
      >
        {viewingRecord && <EvaluasiReadOnly record={viewingRecord} />}
      </Modal>
    </div>
  );
}

function EvaluasiReadOnly({ record }) {
  const { perKategori, skorAkhir } = hitungSkorEvaluasi(KATEGORI, record.nilai || {});
  const keputusan = record.keputusan || (skorAkhir <= 50 ? "Permohonan Ditolak" : "Permohonan Disetujui");

  return (
    <div>
      <table style={sheetTableStyle}>
        <tbody>
          <tr>
            <td style={{ ...cellLabel, width: 110 }}>ID Proposal:</td>
            <td style={cellReadonly}>{record.proposalId}</td>
            <td style={cellLabel}>Penilai:</td>
            <td style={cellReadonly}>{record.penilai}</td>
          </tr>
          <tr>
            <td style={cellLabel}>PEMOHON:</td>
            <td style={cellReadonly}>{record.namaLembaga}</td>
            <td style={cellLabel}>Tanggal:</td>
            <td style={cellReadonly}>{record.tanggalPenilaian}</td>
          </tr>
          <tr>
            <td style={cellLabel}>PERIHAL:</td>
            <td style={cellReadonly} colSpan={3}>{record.judulProposal}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ overflowX: "auto" }}>
        <table style={{ ...sheetTableStyle, marginTop: 14 }}>
          <thead>
            <tr>
              <th style={headCell}>NO</th>
              <th style={headCell}>KATEGORI</th>
              <th style={headCell}>Nilai</th>
              <th style={headCell}>Bobot</th>
              <th style={headCell}>Total Skor</th>
            </tr>
          </thead>
          <tbody>
            {perKategori.map((k, i) => (
              <tr key={k.key}>
                <td style={{ ...bodyCell, textAlign: "center", color: T.muted }}>{i + 1}</td>
                <td style={{ ...bodyCell, fontWeight: 600 }}>{k.label}</td>
                <td style={{ ...bodyCell, textAlign: "center" }}>{k.nilai ?? "-"}</td>
                <td style={{ ...bodyCell, textAlign: "center" }}>{k.bobot}</td>
                <td style={{ ...bodyCell, textAlign: "center", fontWeight: 600 }}>
                  {k.nilai ? k.totalSkor.toFixed(2) : "-"}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ ...bodyCell, textAlign: "right", fontWeight: 700 }}>
                Skor Akhir
              </td>
              <td style={{ ...bodyCell, textAlign: "center", fontWeight: 700, fontSize: 15 }}>
                {skorAkhir.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {record.catatan && (
        <div style={{ marginTop: 14 }}>
          <label style={fieldLabelStyle}>Catatan Penting / Rekomendasi</label>
          <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.6 }}>{record.catatan}</p>
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          padding: "10px 14px",
          borderRadius: 8,
          background: T.bg,
          border: `1px solid ${T.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12.5, color: T.muted }}>Keputusan:</span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: keputusan === "Permohonan Disetujui" ? T.success : T.danger,
          }}
        >
          {keputusan}
        </span>
      </div>
    </div>
  );
}

const sheetTableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12.5,
};

const headCell = {
  border: `1px solid ${T.border}`,
  padding: "6px 8px",
  background: T.bg,
  fontSize: 11,
  textTransform: "uppercase",
  color: T.muted,
  textAlign: "center",
};

const bodyCell = {
  border: `1px solid ${T.border}`,
  padding: "8px",
  verticalAlign: "top",
};

const cellLabel = {
  border: `1px solid ${T.border}`,
  padding: "6px 8px",
  background: T.bg,
  fontWeight: 600,
  fontSize: 12,
};

const cellReadonly = {
  border: `1px solid ${T.border}`,
  padding: "6px 8px",
  color: T.text,
};

const cellInput = {
  border: `1px solid ${T.border}`,
  padding: "4px 6px",
};

const inputStyle = {
  padding: "6px 8px",
  borderRadius: 6,
  border: `1px solid ${T.border}`,
  background: T.card,
  color: T.text,
  fontSize: 12.5,
  fontFamily: font.body,
  width: "100%",
  boxSizing: "border-box",
};

const fieldLabelStyle = {
  display: "block",
  fontSize: 11,
  color: T.muted,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  marginBottom: 4,
};
