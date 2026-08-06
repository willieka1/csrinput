import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  Eye,
  Pencil,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { T, font } from "../../lib/theme";
import { OPT } from "../../lib/data";
import { nextIdFor, printChecklist, rupiah, uid } from "../../lib/utils";
import { generateSikasPdf, rowsFromFields } from "../../lib/pdf";
import { generateDocxFromTemplate } from "../../lib/docxGenerate";
import { RabDocPreview } from "../../components/DocTemplatePreview";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import FlowSteps from "../../components/FlowSteps";
import DataTable from "../../components/DataTable";
import DetailModal from "../../components/DetailModal";
import FormGrid, { ReviewList } from "../../components/FormGrid";
import MiniField, { miniInputStyle } from "../../components/MiniField";

const STEPS = [
  "Checklist Dokumen",
  "Uraian RAB",
  "Konfirmasi Uraian",
  "Data RAB",
  "Konfirmasi Data",
  "Simpan",
];

const STANDAR_CHECKLIST_DOCS = [
  "Surat Permohonan Pembayaran (SPP)",
  "Kwitansi",
  "Invoice",
  "Faktur Pajak (FP)/Surat Keterangan Non PKP (bila tidak dapat menerbitkan FP)",
  "Surat Pengukuhan Pengusaha Kena Pajak (bila ada FP)",
  "NPWP (bila ada)/KTP (bila tidak ada NPWP)",
  "Berita Acara Pemeriksaan Pekerjaan (BAPP)",
  "Berita Acara Serah Terima Pekerjaan (BASTP)",
  "Kontrak (PJ/SPK)",
  "Laporan",
  "Bank Garansi",
];

function buildInitialChecklist() {
  return STANDAR_CHECKLIST_DOCS.map((nama) => ({
    id: uid("CKL"),
    nama,
    ada: false,
    fixed: true,
  }));
}

function emptyChecklistItem() {
  return { id: uid("CKL"), nama: "", ada: false, fixed: false };
}

const LIST_COLUMNS = [
  { key: "idNumber", label: "ID Number" },
  {
    key: "tanggalInput",
    label: "Tanggal Input",
    render: (r) =>
      r.tanggalInput
        ? new Date(r.tanggalInput).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
        : "-",
  },
  { key: "judulKegiatan", label: "Judul Kegiatan" },
  { key: "kategori", label: "Kategori" },
  { key: "bidang", label: "Bidang" },
  { key: "vendor", label: "Vendor" },
  {
    key: "totalEvaluasi",
    label: "Total Evaluasi",
    render: (r) => rupiah(r.totalEvaluasi),
  },
];

const buildHeaderFields = (vendors) => [
  {
    key: "idNumber",
    label: "ID Number",
    hint: "otomatis (lanjut dari ID terakhir) - bisa diubah manual",
    placeholder: "cth. RAB-2026-001",
  },
  { key: "bidang", label: "Bidang", type: "select", options: OPT.bidang },
  {
    key: "jenisKegiatanCsr",
    label: "Jenis Kegiatan CSR",
    type: "select",
    options: OPT.jenisKegiatanCsr,
    hint: "dipakai untuk pengelompokan di Rekapitulasi Realisasi Anggaran",
  },
  { key: "jenisProgram", label: "Jenis Program", type: "select", options: OPT.jenisProgram },
  { key: "subprogram", label: "Subprogram", type: "select", options: OPT.subprogram },
  {
    key: "kategoriProgram",
    label: "Kategori Program",
    type: "select",
    options: OPT.kategoriProgram,
  },
  { key: "procost", label: "Procost", type: "select", options: OPT.procost },
  { key: "task", label: "Task", type: "select", options: OPT.task },
  { key: "expType", label: "Exp. Type", type: "select", options: OPT.expType },
  { key: "expOrg", label: "Exp. Org", type: "select", options: OPT.expOrg },
  { key: "tanggalRab", label: "Tanggal RAB", type: "date" },
  { key: "judulKegiatan", label: "Judul Kegiatan", full: true },
  {
    key: "vendor",
    label: "Vendor",
    type: "select",
    options: vendors.map((v) => v.nama),
    full: true,
  },
];

function itemTotals(row) {
  const qty = Number(row.qty) || 0;
  const harga = Number(row.harga) || 0;
  const qtyEval = Number(row.qtyEvaluasi) || 0;
  const hargaEval = Number(row.hargaEvaluasi) || 0;
  const ppn = row.ppn === "11%" ? 1.11 : 1;
  const ppnEval = row.ppnEvaluasi === "11%" ? 1.11 : 1;
  return {
    total: qty * harga * ppn,
    totalEvaluasi: qtyEval * hargaEval * ppnEval,
  };
}

export default function RabPage({ rab, setRab, vendors, notify }) {
  const [mode, setMode] = useState("list");
  const [step, setStep] = useState(0);
  const [checklist, setChecklist] = useState(() => buildInitialChecklist());
  const [items, setItems] = useState([]);
  const [header, setHeader] = useState({});
  const [rowDraft, setRowDraft] = useState({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [rabPreview, setRabPreview] = useState(null);
  const [selectedId, setSelectedId] = useState("");

  const headerFields = buildHeaderFields(vendors);
  const totalEvaluasi = items.reduce((s, r) => s + (r.totalEvaluasi || 0), 0);

  const startWizard = () => {
    setItems([]);
    setRowDraft({});
    setEditingId(null);
    setChecklist(buildInitialChecklist());
    setHeader({ idNumber: nextIdFor("RAB", rab, "idNumber") });
    setStep(0);
    setMode("wizard");
  };

  const saveRow = () => {
    if (!rowDraft.uraian) {
      return notify("Isi uraian barang terlebih dahulu.", "error");
    }
    const totals = itemTotals(rowDraft);
    if (editingId) {
      setItems((prev) =>
        prev.map((r) =>
          r.id === editingId ? { ...r, ...rowDraft, ...totals, id: editingId } : r
        )
      );
      setEditingId(null);
    } else {
      setItems((prev) => [
        ...prev,
        { id: uid("ITM"), ...rowDraft, ...totals },
      ]);
    }
    setRowDraft({});
  };

  const startEditRow = (row) => {
    setRowDraft({ ...row });
    setEditingId(row.id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const cancelEdit = () => {
    setRowDraft({});
    setEditingId(null);
  };

  const deleteRow = (id) => {
    if (editingId === id) cancelEdit();
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  const saveAll = () => {
    setRab((prev) => [...prev, { ...header, checklist, items, totalEvaluasi, tanggalInput: new Date().toISOString() }]);
    setShowSaveModal(false);
    setShowSuccessModal(true);
  };

  const finish = () => {
    setShowSuccessModal(false);
    setMode("list");
    notify("Data RAB berhasil disimpan!", "success", "RAB");
  };

  const doDownloadRabPdf = async (record) => {
    const recFields = buildHeaderFields(vendors);
    await generateSikasPdf({
      title: "Rencana Anggaran Biaya (RAB)",
      subtitle: `${record.idNumber || "-"} · Total Evaluasi ${rupiah(record.totalEvaluasi || 0)}`,
      rows: rowsFromFields(recFields, record),
      table: record.items || [],
      filename: `RAB-${record.idNumber || "record"}`,
    });
  };

  const doDownloadRabDocx = async (record) => {
    const idText = record.idNumber || "record";
    const itemsText = (record.items || [])
      .map((item, i) =>
        `${i + 1}. ${item.uraian || ""} - Qty: ${item.qtyEvaluasi || item.qty || ""} ${item.satuan || ""} × Rp ${(item.hargaEvaluasi || item.harga || 0).toLocaleString("id-ID")} = Rp ${(item.totalEvaluasi || 0).toLocaleString("id-ID")}`
      )
      .join("\n");
    try {
      await generateDocxFromTemplate(
        "/templates/Template_RAB.docx",
        {
          idNumber: record.idNumber || "",
          judulKegiatan: record.judulKegiatan || "",
          kategori: record.kategori || "",
          bidang: record.bidang || "",
          tanggalRab: record.tanggalRab || "",
          vendor: record.vendor || "",
          procost: record.procost || "",
          expType: record.expType || "",
          totalEvaluasi: rupiah(record.totalEvaluasi || 0),
          itemsText,
          items: (record.items || []).map((item, i) => ({
            no: String(i + 1),
            uraian: item.uraian || "",
            qty: String(item.qtyEvaluasi || item.qty || ""),
            satuan: item.satuan || "",
            harga: rupiah(item.hargaEvaluasi || item.harga || 0),
            total: rupiah(item.totalEvaluasi || 0),
          })),
        },
        `RAB-${idText}.docx`
      );
      notify("RAB (.docx) berhasil diunduh.", "success");
    } catch (e) {
      notify(`Gagal membuat RAB: ${e.message}`, "error");
    }
  };

  const openRabPreview = (record) => {
    setDetailRow(null);
    setRabPreview(record);
  };
  const closeRabPreview = () => {
    setRabPreview(null);
    setSelectedId("");
  };

  const renderRabPreview = () => {
    if (!rabPreview) return null;
    const idText = rabPreview.idNumber || "";
    return (
      <Modal
        open={!!rabPreview}
        onClose={closeRabPreview}
        title={idText ? "Preview RAB - " + idText : "Preview RAB"}
        icon={Eye}
        width={660}
      >
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Periksa data di bawah. File akan dibuat sesuai template dan diunduh setelah kamu klik tombol download.
        </p>
        <RabDocPreview values={rabPreview} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, flexWrap: "wrap" }}>
          <Button variant="ghost" onClick={closeRabPreview}>Batal</Button>
          <Button
            variant="ghost"
            icon={Download}
            onClick={async () => {
              await doDownloadRabPdf(rabPreview);
              closeRabPreview();
            }}
          >
            Download PDF
          </Button>
          <Button
            icon={Download}
            onClick={async () => {
              await doDownloadRabDocx(rabPreview);
              closeRabPreview();
            }}
          >
            Download Word (.docx)
          </Button>
        </div>
      </Modal>
    );
  };

  if (mode === "list") {
    const detailColumns = headerFields.map((f) => ({ key: f.key, label: f.label }));
    return (
      <div>
        <PageHeader
          eyebrow="Modul RAB"
          title="Rencana Anggaran Biaya"
          description="Kelola seluruh data Rencana Anggaran Biaya. Klik salah satu baris untuk melihat detail atau mengubah data."
          right={
            <Button icon={Plus} onClick={startWizard}>
              Add New RAB
            </Button>
          }
        />
        <Card padded={false}>
          <DataTable
            emptyLabel={'Belum ada RAB. Klik “Add New RAB” untuk membuat pengajuan pertama.'}
            columns={LIST_COLUMNS}
            rows={rab}
            onRowClick={setDetailRow}
          />
        </Card>
        <DetailModal
          open={!!detailRow}
          onClose={() => setDetailRow(null)}
          data={detailRow}
          columns={detailColumns}
          onSave={(draft) => {
            setRab((prev) => prev.map((r) => (r === detailRow ? { ...r, ...draft } : r)));
            notify("Data RAB berhasil diperbarui!");
          }}
          onDownloadPdf={openRabPreview}
        />
        {renderRabPreview()}
      </div>
    );
  }

  const savingNow = showSaveModal || showSuccessModal;

  return (
    <div>
      <PageHeader
        eyebrow="Add New RAB"
        title="Formulir Pengajuan RAB"
        right={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => setMode("list")}>
            Kembali ke daftar
          </Button>
        }
      />
      <FlowSteps steps={STEPS} current={savingNow ? 5 : step} />

      {step === 0 && (
        <StepChecklist
          checklist={checklist}
          setChecklist={setChecklist}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <StepUraian
          rowDraft={rowDraft}
          setRowDraft={setRowDraft}
          items={items}
          editingId={editingId}
          onSaveRow={saveRow}
          onEditRow={startEditRow}
          onCancelEdit={cancelEdit}
          onDeleteRow={deleteRow}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepKonfirmasiUraian
          items={items}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <Card>
          <h3 style={{ fontFamily: font.display, fontSize: 16, marginBottom: 14 }}>
            Isi Data RAB
          </h3>
          <FormGrid
            fields={headerFields}
            values={header}
            onChange={(k, v) => setHeader({ ...header, [k]: v })}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <Button onClick={() => setStep(4)}>
              Lanjutkan <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <h3 style={{ fontFamily: font.display, fontSize: 16, marginBottom: 4 }}>
            Datanya udah bener?
          </h3>
          <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
            Tinjau data induk RAB sebelum disimpan.
          </p>
          <ReviewList fields={headerFields} values={header} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(3)}>
              Tidak, edit lagi
            </Button>
            <Button onClick={() => setShowSaveModal(true)}>
              Ya, sudah benar <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      <Modal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Data?"
        icon={AlertTriangle}
      >
        <p style={{ color: T.muted, fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>
          RAB{" "}
          <b style={{ fontFamily: font.mono, color: T.text }}>{header.idNumber}</b>{" "}
          dengan total evaluasi{" "}
          <b style={{ color: T.text }}>{rupiah(totalEvaluasi)}</b> akan disimpan dan
          tidak bisa diubah dari daftar.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setShowSaveModal(false)}>
            Batal
          </Button>
          <Button variant="accent" icon={Check} onClick={saveAll}>
            Simpan Data
          </Button>
        </div>
      </Modal>

      <SuccessModal
        open={showSuccessModal}
        message={`RAB ${header.idNumber} sudah tercatat di daftar RAB.`}
        onDone={finish}
        onDownloadPdf={() => openRabPreview({ ...header, items, totalEvaluasi })}
        onDownloadDocx={() => openRabPreview({ ...header, items, totalEvaluasi })}
      />
      {renderRabPreview()}
    </div>
  );
}

function StepChecklist({ checklist, setChecklist, onNext }) {
  const standarItems = checklist.filter((c) => c.fixed);
  const lainnyaItems = checklist.filter((c) => !c.fixed);
  const standarAda = standarItems.filter((c) => c.ada).length;
  const lainnyaFilled = lainnyaItems.filter((c) => c.nama.trim());

  const toggleStandar = (id) =>
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, ada: !c.ada } : c)));

  const updateLainnya = (id, patch) =>
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addLainnya = () => setChecklist((prev) => [...prev, emptyChecklistItem()]);

  const removeLainnya = (id) =>
    setChecklist((prev) => prev.filter((c) => c.id !== id));

  return (
    <Card>
      <h3 style={{ fontFamily: font.display, fontSize: 16, marginBottom: 4 }}>
        Checklist Kelengkapan Dokumen
      </h3>
      <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 18, lineHeight: 1.6 }}>
        Sebelum masuk ke uraian RAB, centang dokumen standar yang sudah tersedia untuk laporan
        ini. Kalau ada dokumen lain di luar daftar (menyesuaikan data/instansi masing-masing),
        tambahkan lewat bagian "Lainnya" di bawah.
      </p>

      <SectionHeader>Dokumen Standar</SectionHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
        {standarItems.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => toggleStandar(c.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 10px",
              border: `1px solid ${c.ada ? T.success : T.border}`,
              borderRadius: 8,
              background: c.ada ? T.successSoft : T.bg,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: 6,
                display: "grid",
                placeItems: "center",
                border: `1px solid ${c.ada ? T.success : T.border}`,
                background: c.ada ? T.success : T.card,
                color: "#fff",
              }}
            >
              {c.ada && <Check size={13} />}
            </span>
            <span style={{ fontSize: 13, color: T.text }}>
              <span style={{ color: T.muted, marginRight: 6 }}>{i + 1}.</span>
              {c.nama}
            </span>
          </button>
        ))}
      </div>

      <SectionHeader dashed>Lainnya (diisi manual)</SectionHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {lainnyaItems.length === 0 && (
          <div
            style={{
              padding: "14px 16px",
              border: `1px dashed ${T.border}`,
              borderRadius: 8,
              color: T.muted,
              fontSize: 12.5,
            }}
          >
            Belum ada dokumen tambahan. Tekan "Tambah dokumen lainnya" kalau ada dokumen di luar
            daftar standar di atas.
          </div>
        )}
        {lainnyaItems.map((c, i) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              background: T.bg,
            }}
          >
            <button
              type="button"
              onClick={() => updateLainnya(c.id, { ada: !c.ada })}
              aria-label={c.ada ? "Tandai belum ada" : "Tandai sudah ada"}
              title={c.ada ? "Sudah ada" : "Belum ada"}
              style={{
                flexShrink: 0,
                width: 24,
                height: 24,
                borderRadius: 6,
                display: "grid",
                placeItems: "center",
                border: `1px solid ${c.ada ? T.success : T.border}`,
                background: c.ada ? T.successSoft : T.card,
                color: T.success,
                cursor: "pointer",
              }}
            >
              {c.ada && <Check size={14} />}
            </button>
            <input
              value={c.nama}
              onChange={(e) => updateLainnya(c.id, { nama: e.target.value })}
              placeholder={`Nama dokumen lainnya ke-${i + 1}…`}
              style={{ ...miniInputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeLainnya(c.id)}
              aria-label="Hapus dokumen"
              title="Hapus dokumen"
              style={{
                flexShrink: 0,
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "none",
                background: "transparent",
                color: T.danger,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <Button variant="subtle" icon={Plus} onClick={addLainnya} style={{ marginBottom: 18 }}>
        Tambah dokumen lainnya
      </Button>

      <p style={{ fontSize: 11.5, color: T.muted, marginBottom: 0 }}>
        {standarAda} dari {standarItems.length} dokumen standar tersedia ·{" "}
        {lainnyaFilled.length} dokumen lainnya dicatat.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, gap: 10, flexWrap: "wrap" }}>
        <Button
          variant="ghost"
          icon={Printer}
          onClick={() =>
            printChecklist({
              title: "Checklist Kelengkapan Dokumen",
              subtitle: "SIKAS - PT PLN Indonesia Power UBP Priok",
              items: [
                ...standarItems,
                ...lainnyaItems.filter((c) => c.nama.trim()),
              ],
            })
          }
        >
          Print Checklist
        </Button>
        <Button onClick={onNext}>
          Lanjutkan <ArrowRight size={15} />
        </Button>
      </div>
    </Card>
  );
}

function StepUraian({
  rowDraft,
  setRowDraft,
  items,
  editingId,
  onSaveRow,
  onEditRow,
  onCancelEdit,
  onDeleteRow,
  onBack,
  onNext,
}) {
  const set = (key) => (e) => setRowDraft({ ...rowDraft, [key]: e.target.value });
  return (
    <Card>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "#FFF4D6",
          color: T.yellowText,
          padding: "10px 14px",
          borderRadius: 8,
          marginBottom: 18,
          fontSize: 13,
        }}
      >
        <AlertTriangle size={16} /> Hati-hati dalam pengisian RAB! Data akan tampil
        seperti tabel Excel pada dasbor.
      </div>

      <h3 style={{ fontFamily: font.display, fontSize: 16, marginBottom: 4 }}>
        Input Uraian RAB (per item)
      </h3>
      <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 16 }}>
        Isi satu baris untuk tiap barang/jasa, lalu tekan "Tambah baris" untuk
        menambahkannya ke tabel di bawah.
      </p>

      <SectionHeader>Harga Pengajuan</SectionHeader>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <MiniField label="Uraian" full>
          <input
            placeholder="Nama barang/jasa"
            value={rowDraft.uraian || ""}
            onChange={set("uraian")}
            style={miniInputStyle}
          />
        </MiniField>
        <MiniField label="Satuan">
          <SelectOrManual
            options={OPT.satuan}
            value={rowDraft.satuan || ""}
            onChange={(v) => setRowDraft({ ...rowDraft, satuan: v })}
            manualPlaceholder="Ketik satuan sendiri…"
          />
        </MiniField>
        <MiniField label="Qty">
          <input
            type="number"
            placeholder="0"
            value={rowDraft.qty || ""}
            onChange={set("qty")}
            style={miniInputStyle}
          />
        </MiniField>
        <MiniField label="Harga Satuan">
          <input
            type="number"
            placeholder="Rp 0"
            value={rowDraft.harga || ""}
            onChange={set("harga")}
            style={miniInputStyle}
          />
        </MiniField>
        <MiniField label="PPN">
          <select
            value={rowDraft.ppn || ""}
            onChange={set("ppn")}
            style={miniInputStyle}
          >
            <option value="">Pilih…</option>
            {OPT.ppn.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </MiniField>
      </div>

      <SectionHeader dashed>Harga Evaluasi</SectionHeader>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <MiniField label="Qty Evaluasi">
          <input
            type="number"
            placeholder="0"
            value={rowDraft.qtyEvaluasi || ""}
            onChange={set("qtyEvaluasi")}
            style={miniInputStyle}
          />
        </MiniField>
        <MiniField label="Harga Satuan Evaluasi">
          <input
            type="number"
            placeholder="Rp 0"
            value={rowDraft.hargaEvaluasi || ""}
            onChange={set("hargaEvaluasi")}
            style={miniInputStyle}
          />
        </MiniField>
        <MiniField label="PPN Evaluasi">
          <select
            value={rowDraft.ppnEvaluasi || ""}
            onChange={set("ppnEvaluasi")}
            style={miniInputStyle}
          >
            <option value="">Pilih…</option>
            {OPT.ppn.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </MiniField>
        <MiniField label="Keterangan">
          <input
            placeholder="Opsional"
            value={rowDraft.keterangan || ""}
            onChange={set("keterangan")}
            style={miniInputStyle}
          />
        </MiniField>
        <MiniField label="Ket. Pemakaian">
          <input
            placeholder="Opsional"
            value={rowDraft.ketPemakaian || ""}
            onChange={set("ketPemakaian")}
            style={miniInputStyle}
          />
        </MiniField>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 6 }}>
        {editingId && (
          <Button variant="ghost" onClick={onCancelEdit}>
            Batal edit
          </Button>
        )}
        <Button
          variant={editingId ? "primary" : "subtle"}
          icon={editingId ? Check : Plus}
          onClick={onSaveRow}
        >
          {editingId ? "Update baris" : "Tambah baris"}
        </Button>
      </div>
      <p style={{ fontSize: 11.5, color: T.muted, marginBottom: 14 }}>
        Catatan: evaluasi = harga/jumlah pembanding fiks yang benar-benar digunakan.
        {editingId && (
          <b style={{ color: T.blue, marginLeft: 6 }}>
            · Sedang mengedit baris - perubahan akan tersimpan setelah tekan "Update baris".
          </b>
        )}
      </p>

      {items.length === 0 ? (
        <div
          style={{
            padding: "36px 20px",
            textAlign: "center",
            border: `1px dashed ${T.border}`,
            borderRadius: 10,
            color: T.muted,
            fontSize: 13,
          }}
        >
          Belum ada baris item. Lengkapi form di atas lalu tekan{" "}
          <b style={{ color: T.text }}>Tambah baris</b>.
        </div>
      ) : (
        <BreakdownTable
          items={items}
          editingId={editingId}
          onEdit={onEditRow}
          onDelete={onDeleteRow}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
        {onBack && (
          <Button variant="ghost" icon={ArrowLeft} onClick={onBack}>
            Kembali
          </Button>
        )}
        <Button disabled={!items.length} onClick={onNext} style={{ marginLeft: "auto" }}>
          Lanjutkan <ArrowRight size={15} />
        </Button>
      </div>
    </Card>
  );
}

function StepKonfirmasiUraian({ items, onBack, onNext }) {
  const totalPengajuan = items.reduce((s, r) => s + (r.total || 0), 0);
  const totalEvaluasi = items.reduce((s, r) => s + (r.totalEvaluasi || 0), 0);
  return (
    <Card>
      <h3 style={{ fontFamily: font.display, fontSize: 16, marginBottom: 4 }}>
        Datanya udah bener?
      </h3>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
        Periksa kembali {items.length} baris uraian RAB. Semua kolom
        perhitungan (qty, harga, PPN) ditampilkan supaya hasil total mudah
        ditelusuri.
      </p>

      <BreakdownTable items={items} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginTop: 16,
          padding: "12px 14px",
          borderRadius: 10,
          background: T.blueSoft,
          border: `1px solid ${T.border}`,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Total Pengajuan
            </div>
            <div style={{ fontFamily: font.display, fontSize: 18, color: T.heading, marginTop: 2 }}>
              {rupiah(totalPengajuan)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Total Evaluasi
            </div>
            <div style={{ fontFamily: font.display, fontSize: 18, color: T.navy, marginTop: 2 }}>
              {rupiah(totalEvaluasi)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack}>
          Tidak, edit lagi
        </Button>
        <Button onClick={onNext}>
          Ya, sudah benar <ArrowRight size={15} />
        </Button>
      </div>
    </Card>
  );
}

function BreakdownTable({ items, onEdit, onDelete, editingId }) {
  const th = {
    padding: "10px 12px",
    background: T.bg,
    color: T.muted,
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: `1px solid ${T.border}`,
    textAlign: "left",
    whiteSpace: "nowrap",
  };
  const td = {
    padding: "10px 12px",
    borderBottom: `1px solid ${T.border}`,
    color: T.text,
    fontSize: 13,
    whiteSpace: "nowrap",
  };
  const groupTh = {
    ...th,
    textAlign: "center",
    borderBottom: `1px dashed ${T.border}`,
    color: T.blue,
    fontFamily: font.mono,
  };
  const numeric = { fontFamily: font.mono, textAlign: "right" };
  const divider = { borderLeft: `1px dashed ${T.border}` };
  const showActions = Boolean(onEdit || onDelete);

  return (
    <div style={{ overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={groupTh} colSpan={2}></th>
            <th style={groupTh} colSpan={4}>Harga Pengajuan</th>
            <th style={{ ...groupTh, ...divider }} colSpan={4}>Harga Evaluasi</th>
            <th style={{ ...groupTh, ...divider }} colSpan={2}>Keterangan</th>
            {showActions && <th style={{ ...groupTh, ...divider }}></th>}
          </tr>
          <tr>
            <th style={th}>Uraian</th>
            <th style={th}>Satuan</th>
            <th style={{ ...th, ...numeric }}>Qty</th>
            <th style={{ ...th, ...numeric }}>Harga</th>
            <th style={{ ...th, ...numeric }}>PPN</th>
            <th style={{ ...th, ...numeric }}>Total</th>
            <th style={{ ...th, ...numeric, ...divider }}>Qty</th>
            <th style={{ ...th, ...numeric }}>Harga</th>
            <th style={{ ...th, ...numeric }}>PPN</th>
            <th style={{ ...th, ...numeric }}>Total</th>
            <th style={{ ...th, ...divider }}>Keterangan</th>
            <th style={th}>Ket. Pemakaian</th>
            {showActions && <th style={{ ...th, ...divider, textAlign: "center" }}>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => {
            const isEditing = editingId && editingId === r.id;
            return (
              <tr
                key={r.id || i}
                style={{
                  background: isEditing
                    ? T.blueSoft
                    : i % 2
                    ? T.rowAlt
                    : T.card,
                  outline: isEditing ? `2px solid ${T.blue}` : "none",
                  outlineOffset: -2,
                }}
              >
                <td style={{ ...td, fontWeight: 600, color: T.heading, whiteSpace: "normal", minWidth: 160 }}>
                  {r.uraian}
                </td>
                <td style={td}>{r.satuan || "-"}</td>
                <td style={{ ...td, ...numeric }}>{r.qty || 0}</td>
                <td style={{ ...td, ...numeric }}>{rupiah(r.harga)}</td>
                <td style={{ ...td, ...numeric, color: T.muted }}>{r.ppn || "-"}</td>
                <td style={{ ...td, ...numeric, fontWeight: 700, color: T.heading }}>{rupiah(r.total)}</td>
                <td style={{ ...td, ...numeric, ...divider }}>{r.qtyEvaluasi || 0}</td>
                <td style={{ ...td, ...numeric }}>{rupiah(r.hargaEvaluasi)}</td>
                <td style={{ ...td, ...numeric, color: T.muted }}>{r.ppnEvaluasi || "-"}</td>
                <td style={{ ...td, ...numeric, fontWeight: 700, color: T.navy }}>{rupiah(r.totalEvaluasi)}</td>
                <td style={{ ...td, ...divider, color: r.keterangan ? T.text : T.muted, maxWidth: 180, whiteSpace: "normal" }}>
                  {r.keterangan || "-"}
                </td>
                <td style={{ ...td, color: r.ketPemakaian ? T.text : T.muted, maxWidth: 180, whiteSpace: "normal" }}>
                  {r.ketPemakaian || "-"}
                </td>
                {showActions && (
                  <td style={{ ...td, ...divider, textAlign: "center" }}>
                    <div style={{ display: "inline-flex", gap: 4 }}>
                      {onEdit && (
                        <button
                          type="button"
                          aria-label="Edit baris"
                          title="Edit baris"
                          onClick={() => onEdit(r)}
                          style={iconBtn(T.blue)}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          aria-label="Hapus baris"
                          title="Hapus baris"
                          onClick={() => onDelete(r.id)}
                          style={iconBtn(T.danger)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const iconBtn = (color) => ({
  border: "none",
  background: "transparent",
  color,
  cursor: "pointer",
  width: 26,
  height: 26,
  borderRadius: 6,
  display: "inline-grid",
  placeItems: "center",
});

function SelectOrManual({ options, value, onChange, manualPlaceholder }) {
  const isManual = value === "__manual__";
  const typedOutside =
    value && value !== "__manual__" && !options.includes(value);

  if (isManual || typedOutside) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <input
          autoFocus
          value={value === "__manual__" ? "" : value}
          placeholder={manualPlaceholder || "Ketik sendiri…"}
          onChange={(e) => onChange(e.target.value || "__manual__")}
          style={miniInputStyle}
        />
        <button
          type="button"
          title="Kembali ke pilihan"
          onClick={() => onChange("")}
          style={{
            flexShrink: 0,
            width: 34,
            borderRadius: 7,
            border: `1px solid ${T.border}`,
            background: T.bg,
            color: T.muted,
            cursor: "pointer",
          }}
        >
          <X size={13} />
        </button>
      </div>
    );
  }
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={miniInputStyle}
    >
      <option value="">Pilih…</option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
      <option value="__manual__">✎ Isi manual…</option>
    </select>
  );
}

function SectionHeader({ children, dashed }) {
  return (
    <div
      style={{
        fontFamily: font.mono,
        fontSize: 11.5,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: T.blue,
        fontWeight: 700,
        marginBottom: 10,
        paddingTop: dashed ? 4 : 0,
        borderTop: dashed ? `1px dashed ${T.border}` : "none",
      }}
    >
      {children}
    </div>
  );
}

export function SuccessModal({ open, message, onDone, onDownloadPdf, onDownloadDocx }) {
  return (
    <Modal open={open} width={420}>
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: T.successSoft,
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <CheckCircle2 size={28} color={T.success} />
        </div>
        <h3 style={{ fontFamily: font.display, fontSize: 17, margin: "0 0 6px" }}>
          Data Anda Telah Berhasil Disimpan!
        </h3>
        <p style={{ color: T.muted, fontSize: 13, margin: "0 0 20px" }}>{message}</p>
        {onDownloadDocx && (
          <Button
            variant="ghost"
            icon={Download}
            style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
            onClick={onDownloadDocx}
          >
            Preview &amp; Unduh Word (.docx)
          </Button>
        )}
        {onDownloadPdf && (
          <Button
            variant="ghost"
            icon={Eye}
            style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
            onClick={onDownloadPdf}
          >
            Preview &amp; Unduh PDF
          </Button>
        )}
        <Button style={{ width: "100%", justifyContent: "center" }} onClick={onDone}>
          Selesai
        </Button>
      </div>
    </Modal>
  );
}