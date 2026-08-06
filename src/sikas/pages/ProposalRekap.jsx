import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Eye,
  FileText,
  Pencil,
  Printer,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { T, font } from "../../lib/theme";
import { OPT } from "../../lib/data";
import { nextIdFor, printDocument, rupiah, uid } from "../../lib/utils";
import {
  bastStepFields,
  paktaStepFields,
  proposalAdminFields,
  proposalFields,
} from "../../lib/wizardFields";
import { generateDocxFromTemplate, formatTanggalPanjang } from "../../lib/docxGenerate";
import { BastDocPreview, PaktaDocPreview } from "../../components/DocTemplatePreview";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import { StatusBadge } from "../../components/Badge";
import PageHeader from "../../components/PageHeader";
import FlowSteps from "../../components/FlowSteps";
import DataTable from "../../components/DataTable";
import FormGrid, { ReviewList } from "../../components/FormGrid";
import { SuccessModal } from "./Rab";

const FIELDS = proposalFields()();
const ADMIN_FIELDS = proposalAdminFields();
const BAST_FIELDS = bastStepFields();
const PAKTA_FIELDS = paktaStepFields();
const STEPS = ["Isi Formulir", "Isi BAST", "Isi PI", "Konfirmasi", "Simpan"];

function fieldValue(f, v) {
  if (v === undefined || v === null || v === "") return "-";
  if (f.type === "file-upload") return v?.name ? `${v.name}` : "-";
  return String(v);
}

function OverviewRows({ fields, values }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
      {fields.map((f) => (
        <div
          key={f.key}
          style={{
            flex: f.full ? "1 1 100%" : "1 1 220px",
            maxWidth: f.full ? "100%" : 320,
            minWidth: 0,
            borderBottom: `1px solid ${T.border}`,
            paddingBottom: 6,
          }}
        >
          <div style={{ fontSize: 10.5, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
            {f.label}
          </div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 500, marginTop: 2, overflowWrap: "break-word" }}>
            {fieldValue(f, values[f.key])}
          </div>
        </div>
      ))}
    </div>
  );
}

function OverviewSectionHeading({ children }) {
  return (
    <div
      style={{
        fontFamily: font.mono,
        fontSize: 11.5,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: T.blue,
        fontWeight: 700,
        margin: "18px 0 10px",
        paddingTop: 12,
        borderTop: `1px dashed ${T.border}`,
      }}
    >
      {children}
    </div>
  );
}

export default function ProposalRekapPage({ proposals, setProposals, notify }) {
  const [mode, setMode] = useState("list");
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [bastDraft, setBastDraft] = useState({});
  const [paktaDraft, setPaktaDraft] = useState({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [overviewRow, setOverviewRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [editChooserRow, setEditChooserRow] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const [printChooserRow, setPrintChooserRow] = useState(null);
  const [docPreview, setDocPreview] = useState(null); // { row, doc: "bast" | "pakta" }

  const [filterStatus, setFilterStatus] = useState("");
  const [filterProgram, setFilterProgram] = useState("");

  const filteredRows = useMemo(
    () =>
      proposals.filter((p) => {
        if (filterStatus && p.statusProposal !== filterStatus) return false;
        if (filterProgram && p.program !== filterProgram) return false;
        return true;
      }),
    [proposals, filterStatus, filterProgram]
  );

  const start = () => {
    setValues({ id: nextIdFor("PRP", proposals) });
    setBastDraft({});
    setPaktaDraft({});
    setStep(0);
    setMode("wizard");
  };

  const onChange = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const goToBastStep = () => {
    setBastDraft((prev) => ({
      tanggalBast: prev.tanggalBast || values.tanggalKegiatan || "",
      namaPihakKedua: prev.namaPihakKedua || values.kontakPIC || "",
      jabatanPihakKedua: prev.jabatanPihakKedua || "Penerima Fasilitasi",
      uraianBantuan: prev.uraianBantuan || values.judulProposal || "",
    }));
    setStep(1);
  };

  const goToPaktaStep = () => {
    setPaktaDraft((prev) => ({
      tanggalPi: prev.tanggalPi || values.tanggalKegiatan || "",
      namaPenerima: prev.namaPenerima || values.kontakPIC || "",
    }));
    setStep(2);
  };

  const save = () => {
    setProposals((prev) => [
      ...prev,
      {
        ...values,
        id: values.id || uid("PRP"),
        statusProposal: values.statusProposal || "Baru Masuk",
        bast: { ...bastDraft },
        pakta: { ...paktaDraft },
      },
    ]);
    setShowSaveModal(false);
    setShowSuccessModal(true);
  };

  const finish = () => {
    setShowSuccessModal(false);
    setMode("list");
    notify("Data Proposal Stakeholder beserta BAST & PI berhasil disimpan!", "success", "Proposal Stakeholder");
  };

  const confirmDelete = () => {
    setProposals((prev) => prev.filter((p) => p !== deleteTarget));
    notify("Proposal berhasil dihapus.", "success");
    setDeleteTarget(null);
  };

  const chooseEditDoc = (doc) => {
    const row = editChooserRow;
    setEditChooserRow(null);
    if (doc === "proposal") setEditDraft({ ...row });
    if (doc === "bast") setEditDraft({ ...(row.bast || {}) });
    if (doc === "pakta") setEditDraft({ ...(row.pakta || {}) });
    setEditTarget({ row, doc });
  };

  const saveEdit = () => {
    const { row, doc } = editTarget;
    setProposals((prev) =>
      prev.map((p) => {
        if (p !== row) return p;
        if (doc === "proposal") return { ...p, ...editDraft };
        if (doc === "bast") return { ...p, bast: { ...editDraft } };
        if (doc === "pakta") return { ...p, pakta: { ...editDraft } };
        return p;
      })
    );
    notify("Perubahan berhasil disimpan.", "success");
    setEditTarget(null);
  };

  const printProposalPreview = (row) => {
    printDocument(`Proposal ${row.id}`, [
      {
        heading: "Identitas Pengajuan",
        rows: [
          { label: "ID Pengajuan Proposal", value: row.id },
          { label: "Nama Instansi", value: row.namaLembaga },
          { label: "Judul Proposal/Kegiatan", value: row.judulProposal },
          { label: "Tanggal Masuk", value: row.tanggalMasuk },
        ],
      },
      {
        heading: "Detail Kegiatan",
        rows: [
          { label: "Tanggal Kegiatan", value: row.tanggalKegiatan },
          { label: "Alamat Lokasi Kegiatan", value: row.lokasiKegiatan },
          { label: "Program", value: row.program },
          { label: "Jumlah Penerima Manfaat (Laki-laki)", value: row.penerimaLakiLaki },
          { label: "Jumlah Penerima Manfaat (Perempuan)", value: row.penerimaPerempuan },
          { label: "Penerima Manfaat", value: row.namaPenerimaManfaat },
        ],
      },
      {
        heading: "Anggaran & Item",
        rows: [
          { label: "Nominal Diajukan", value: row.nilaiDiajukan ? rupiah(row.nilaiDiajukan) : null },
          { label: "Nominal Disetujui", value: row.approvedBudget ? rupiah(row.approvedBudget) : null },
          { label: "Jumlah Barang yang Diajukan", value: row.itemDiminta },
        ],
      },
      {
        heading: "Kontak",
        rows: [
          { label: "Contact Person", value: row.jabatanKontak },
          { label: "Nama Contact Person", value: row.kontakPIC },
        ],
      },
      { heading: "Status", rows: [{ label: "Status Proposal", value: row.statusProposal }] },
    ]);
  };

  const printAllPreview = (row) => {
    printDocument(`Proposal + BAST + PI - ${row.id}`, [
      {
        heading: "Proposal",
        rows: [
          { label: "Nama Instansi", value: row.namaLembaga },
          { label: "Judul Proposal/Kegiatan", value: row.judulProposal },
          { label: "Program", value: row.program },
          { label: "Nominal Diajukan", value: row.nilaiDiajukan ? rupiah(row.nilaiDiajukan) : null },
          { label: "Nominal Disetujui", value: row.approvedBudget ? rupiah(row.approvedBudget) : null },
          { label: "Status Proposal", value: row.statusProposal },
        ],
      },
      {
        heading: "BAST",
        rows: [
          { label: "Tanggal BAST", value: row.bast?.tanggalBast },
          { label: "Pihak Pertama", value: "Astri Oktavina (Assistant Manager KAS PT PLN Indonesia Power UBP Priok) — tetap" },
          { label: "Pihak Kedua", value: `${row.bast?.namaPihakKedua || ""} (${row.bast?.jabatanPihakKedua || ""})` },
          { label: "Uraian Bantuan", value: row.bast?.uraianBantuan },
        ],
      },
      {
        heading: "Pakta Integritas (PI)",
        rows: [
          { label: "Tanggal PI", value: row.pakta?.tanggalPi },
          { label: "Nama Penerima", value: row.pakta?.namaPenerima },
        ],
      },
    ]);
  };

  const downloadBastDocx = async (row) => {
    try {
      await generateDocxFromTemplate(
        "/templates/Template_BA.docx",
        {
          id: row.id,
          judulProposal: row.judulProposal,
          tanggalBast: formatTanggalPanjang(row.bast?.tanggalBast) || row.bast?.tanggalBast,
          namaPihakKedua: row.bast?.namaPihakKedua,
          jabatanPihakKedua: row.bast?.jabatanPihakKedua,
          uraianBantuan: row.bast?.uraianBantuan,
          namaLembaga: row.namaLembaga,
        },
        `BAST-${row.id}.docx`
      );
      notify("BAST (.docx) berhasil diunduh.", "success");
    } catch (e) {
      notify(`Gagal membuat BAST: ${e.message}`, "error");
    }
  };

  const downloadPaktaDocx = async (row) => {
    try {
      await generateDocxFromTemplate(
        "/templates/Template_PI.docx",
        {
          tanggalPi: formatTanggalPanjang(row.pakta?.tanggalPi) || row.pakta?.tanggalPi,
          namaLembaga: row.namaLembaga,
          namaPenerima: row.pakta?.namaPenerima,
          judulProposal: row.judulProposal,
        },
        `PI-${row.id}.docx`
      );
      notify("Pakta Integritas (.docx) berhasil diunduh.", "success");
    } catch (e) {
      notify(`Gagal membuat PI: ${e.message}`, "error");
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "namaLembaga", label: "Nama Instansi" },
    { key: "judulProposal", label: "Judul Proposal/Kegiatan" },
    { key: "program", label: "Program" },
    { key: "nilaiDiajukan", label: "Diajukan", render: (r) => (r.nilaiDiajukan ? rupiah(r.nilaiDiajukan) : "-") },
    { key: "approvedBudget", label: "Disetujui", render: (r) => (r.approvedBudget ? rupiah(r.approvedBudget) : "-") },
    { key: "statusProposal", label: "Status", render: (r) => <StatusBadge value={r.statusProposal} /> },
    {
      key: "aksi",
      label: "Aksi",
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 2 }}>
          <IconBtn title="Lihat (Proposal + BAST + PI)" onClick={() => setOverviewRow(row)}>
            <Eye size={15} />
          </IconBtn>
          <IconBtn title="Edit" onClick={() => setEditChooserRow(row)}>
            <Pencil size={15} />
          </IconBtn>
          <IconBtn title="Hapus" color={T.danger} onClick={() => setDeleteTarget(row)}>
            <Trash2 size={15} />
          </IconBtn>
          <IconBtn title="Print" onClick={() => setPrintChooserRow(row)}>
            <Printer size={15} />
          </IconBtn>
        </div>
      ),
    },
  ];

  if (mode === "list") {
    return (
      <div>
        <PageHeader
          eyebrow="Humas & Publikasi"
          title="Rekap Pengajuan Proposal"
          description="Kelola seluruh proposal stakeholder yang masuk beserta BAST dan Pakta Integritas (PI)-nya."
          right={
            <Button icon={Plus} onClick={start}>
              Tambah Proposal
            </Button>
          }
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={filterSelectStyle}>
            <option value="">Semua Status</option>
            {OPT.statusProposal.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} style={filterSelectStyle}>
            <option value="">Semua Program</option>
            {OPT.programHumas.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <Card padded={false}>
          <DataTable
            rows={filteredRows}
            columns={columns}
            emptyLabel='Belum ada proposal. Klik "Tambah Proposal" untuk mulai.'
            onRowClick={(row) => setOverviewRow(row)}
            searchPlaceholder="Cari ID, instansi, judul…"
          />
        </Card>

        <Modal
          open={!!overviewRow}
          onClose={() => setOverviewRow(null)}
          title={`Overview Proposal - ${overviewRow?.id || ""}`}
          icon={Eye}
          width={640}
        >
          {overviewRow && (
            <>
              <OverviewRows fields={[...FIELDS, ...ADMIN_FIELDS]} values={overviewRow} />
              <OverviewSectionHeading>BAST — Preview Dokumen</OverviewSectionHeading>
              <BastDocPreview
                values={{
                  nomor: overviewRow.id,
                  judulBantuan: overviewRow.judulProposal,
                  tanggal: overviewRow.bast?.tanggalBast,
                  namaPihakKedua: overviewRow.bast?.namaPihakKedua,
                  jabatanPihakKedua: overviewRow.bast?.jabatanPihakKedua,
                  instansiPihakKedua: overviewRow.namaLembaga,
                }}
              />
              <OverviewSectionHeading>Pakta Integritas (PI) — Preview Dokumen</OverviewSectionHeading>
              <PaktaDocPreview
                values={{
                  judulKegiatan: overviewRow.judulProposal,
                  tanggalPi: overviewRow.pakta?.tanggalPi,
                  namaPenerima: overviewRow.pakta?.namaPenerima,
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <Button onClick={() => setOverviewRow(null)}>Tutup</Button>
              </div>
            </>
          )}
        </Modal>

        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Hapus Proposal?"
          icon={AlertTriangle}
          tone="danger"
        >
          <p style={{ color: T.muted, fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>
            Proposal <b>{deleteTarget?.id}</b> - {deleteTarget?.judulProposal || "(tanpa judul)"} akan dihapus
            permanen dari daftar (termasuk BAST & PI-nya).
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" icon={Trash2} onClick={confirmDelete}>Hapus</Button>
          </div>
        </Modal>

        <Modal
          open={!!editChooserRow}
          onClose={() => setEditChooserRow(null)}
          title="Ingin Edit Dokumen Apa?"
          icon={Pencil}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button variant="ghost" onClick={() => chooseEditDoc("proposal")}>
              <FileText size={15} /> Proposal
            </Button>
            <Button variant="ghost" onClick={() => chooseEditDoc("bast")}>
              <FileText size={15} /> BAST
            </Button>
            <Button variant="ghost" onClick={() => chooseEditDoc("pakta")}>
              <ShieldCheck size={15} /> PI (Pakta Integritas)
            </Button>
          </div>
        </Modal>

        <Modal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          title={
            editTarget?.doc === "proposal"
              ? `Edit Proposal - ${editTarget.row.id}`
              : editTarget?.doc === "bast"
              ? `Edit BAST - ${editTarget.row.id}`
              : editTarget
              ? `Edit PI - ${editTarget.row.id}`
              : ""
          }
          icon={Pencil}
          width={editTarget?.doc === "proposal" ? 720 : 480}
        >
          {editTarget && (
            <>
              <FormGrid
                fields={
                  editTarget.doc === "proposal"
                    ? [...FIELDS, ...ADMIN_FIELDS]
                    : editTarget.doc === "bast"
                    ? BAST_FIELDS
                    : PAKTA_FIELDS
                }
                values={editDraft}
                onChange={(k, v) => setEditDraft((d) => ({ ...d, [k]: v }))}
                align="left"
              />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
                <Button variant="ghost" onClick={() => setEditTarget(null)}>Batal</Button>
                <Button icon={Check} onClick={saveEdit}>Simpan Perubahan</Button>
              </div>
            </>
          )}
        </Modal>

        <Modal
          open={!!printChooserRow}
          onClose={() => setPrintChooserRow(null)}
          title="Ingin Print/Unduh yang Mana?"
          icon={Printer}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button variant="ghost" onClick={() => { printProposalPreview(printChooserRow); setPrintChooserRow(null); }}>
              <Printer size={15} /> Print Proposal
            </Button>
            <Button variant="ghost" onClick={() => { setDocPreview({ row: printChooserRow, doc: "bast" }); setPrintChooserRow(null); }}>
              <Printer size={15} /> Download BAST (.docx)
            </Button>
            <Button variant="ghost" onClick={() => { setDocPreview({ row: printChooserRow, doc: "pakta" }); setPrintChooserRow(null); }}>
              <Printer size={15} /> Download PI (.docx)
            </Button>
            <Button variant="ghost" onClick={() => { printAllPreview(printChooserRow); setPrintChooserRow(null); }}>
              <Printer size={15} /> Print Semua (Proposal + BAST + PI jadi satu)
            </Button>
          </div>
          <p style={{ color: T.muted, fontSize: 12, marginTop: 14, lineHeight: 1.5 }}>
            "Print Proposal" dan "Print Semua" membuka preview siap-cetak di tab baru. "Download BAST/PI"
            akan menampilkan preview datanya dulu - file .docx baru dibuat & diunduh setelah kamu konfirmasi.
          </p>
        </Modal>

        {/* Preview data BAST/PI sebelum benar-benar generate & download .docx */}
        <Modal
          open={!!docPreview}
          onClose={() => setDocPreview(null)}
          title={
            docPreview?.doc === "bast"
              ? `Preview BAST - ${docPreview.row.id}`
              : docPreview
              ? `Preview PI - ${docPreview.row.id}`
              : ""
          }
          icon={docPreview?.doc === "bast" ? FileText : ShieldCheck}
          width={560}
        >
          {docPreview && (
            <>
              {docPreview.doc === "bast" ? (
                <BastDocPreview
                  values={{
                    nomor: docPreview.row.id,
                    judulBantuan: docPreview.row.judulProposal,
                    tanggal: docPreview.row.bast?.tanggalBast,
                    namaPihakKedua: docPreview.row.bast?.namaPihakKedua,
                    jabatanPihakKedua: docPreview.row.bast?.jabatanPihakKedua,
                    instansiPihakKedua: docPreview.row.namaLembaga,
                  }}
                />
              ) : (
                <PaktaDocPreview
                  values={{
                    judulKegiatan: docPreview.row.judulProposal,
                    tanggalPi: docPreview.row.pakta?.tanggalPi,
                    namaPenerima: docPreview.row.pakta?.namaPenerima,
                  }}
                />
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <Button variant="ghost" onClick={() => setDocPreview(null)}>Batal</Button>
                <Button
                  icon={Printer}
                  onClick={async () => {
                    if (docPreview.doc === "bast") await downloadBastDocx(docPreview.row);
                    else await downloadPaktaDocx(docPreview.row);
                    setDocPreview(null);
                  }}
                >
                  {docPreview.doc === "bast" ? "Download BAST (.docx)" : "Download PI (.docx)"}
                </Button>
              </div>
            </>
          )}
        </Modal>
      </div>
    );
  }

  const savingNow = showSaveModal || showSuccessModal;
  const currentIdx = savingNow ? 4 : step;

  return (
    <div>
      <PageHeader
        eyebrow="Tambah Proposal"
        title="Formulir Proposal Stakeholder"
        right={
          <Button variant="ghost" onClick={() => setMode("list")}>
            Kembali ke daftar
          </Button>
        }
      />
      <FlowSteps steps={STEPS} current={currentIdx} />

      {step === 0 && (
        <Card>
          <FormGrid fields={FIELDS} values={values} onChange={onChange} align="left" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <Button variant="ghost" onClick={() => setMode("list")}>Batal</Button>
            <Button onClick={goToBastStep}>
              Lanjut ke Isi BAST <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
            Isi data BAST (Berita Acara Serah Terima) - memakai Proposal ID yang sama.
          </p>
          <FormGrid
            fields={BAST_FIELDS}
            values={bastDraft}
            onChange={(k, v) => setBastDraft((d) => ({ ...d, [k]: v }))}
            align="left"
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <Button variant="ghost" onClick={() => setStep(0)}>Kembali</Button>
            <Button onClick={goToPaktaStep}>
              Lanjut ke Isi PI <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
            Isi data PI (Pakta Integritas) - memakai Proposal ID yang sama.
          </p>
          <FormGrid
            fields={PAKTA_FIELDS}
            values={paktaDraft}
            onChange={(k, v) => setPaktaDraft((d) => ({ ...d, [k]: v }))}
            align="left"
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <Button variant="ghost" onClick={() => setStep(1)}>Kembali</Button>
            <Button onClick={() => setStep(3)}>
              Lanjut ke Konfirmasi <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h3 style={{ fontFamily: font.display, fontSize: 16, marginBottom: 4 }}>Datanya udah bener?</h3>
          <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
            Tinjau data Proposal, BAST, dan PI sebelum disimpan.
          </p>
          <ReviewList fields={FIELDS} values={values} />
          <OverviewSectionHeading>BAST</OverviewSectionHeading>
          <ReviewList fields={BAST_FIELDS} values={bastDraft} />
          <OverviewSectionHeading>Pakta Integritas (PI)</OverviewSectionHeading>
          <ReviewList fields={PAKTA_FIELDS} values={paktaDraft} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <Button variant="ghost" onClick={() => setStep(2)}>Tidak, edit lagi</Button>
            <Button onClick={() => setShowSaveModal(true)}>
              Ya, simpan <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      <Modal open={showSaveModal} onClose={() => setShowSaveModal(false)} title="Simpan Proposal?" icon={AlertTriangle}>
        <p style={{ color: T.muted, fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>
          Proposal, BAST, dan PI akan tersimpan sekaligus memakai Proposal ID yang sama.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setShowSaveModal(false)}>Batal</Button>
          <Button variant="accent" icon={Check} onClick={save}>Simpan Data</Button>
        </div>
      </Modal>

      <SuccessModal
        open={showSuccessModal}
        message="Proposal, BAST, dan PI sudah tercatat di daftar."
        onDone={finish}
      />
    </div>
  );
}

function IconBtn({ title, onClick, color, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        color: color || T.muted,
        cursor: "pointer",
        width: 28,
        height: 28,
        borderRadius: 6,
        display: "inline-grid",
        placeItems: "center",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.blueSoft)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}

const filterSelectStyle = {
  padding: "9px 12px",
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  background: T.card,
  color: T.text,
  fontSize: 13,
  fontFamily: font.body,
};
