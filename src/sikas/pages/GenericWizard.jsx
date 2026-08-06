import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Eye,
  FileText,
  Plus,
} from "lucide-react";
import { T, font } from "../../lib/theme";
import { nextIdFor, uid } from "../../lib/utils";
import { generateSikasPdf, rowsFromFields } from "../../lib/pdf";
import { generateDocxFromTemplate } from "../../lib/docxGenerate";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import Badge from "../../components/Badge";
import PageHeader from "../../components/PageHeader";
import FlowSteps from "../../components/FlowSteps";
import DataTable from "../../components/DataTable";
import DetailModal from "../../components/DetailModal";
import FormGrid, { ReviewList } from "../../components/FormGrid";
import { SuccessModal } from "./Rab";

export default function GenericWizard({
  title,
  eyebrow,
  description,
  opsiOptions,
  opsiLabel,
  confirmOpsi,
  buildFields,
  columns,
  list,
  setList,
  idPrefix,
  autoFrom,
  notify,
  pdfEnabled = false,
  docxTemplate,
  buildDocPreview,
  hideIdSelector = false,
}) {
  const [mode, setMode] = useState("list");
  const [step, setStep] = useState(opsiOptions ? 0 : 1);
  const [opsi, setOpsi] = useState(null);
  const [values, setValues] = useState({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [docxPreview, setDocxPreview] = useState(null);
  const [selectedId, setSelectedId] = useState("");

  const fields = useMemo(
    () => buildFields(opsi, values, autoFrom),
    [opsi, values, buildFields, autoFrom]
  );

  const start = () => {
    setOpsi(null);
    const isReferenceId = autoFrom?.key === "id";
    setValues({
      id: isReferenceId ? uid(idPrefix) : nextIdFor(idPrefix, list),
    });
    setStep(opsiOptions ? 0 : 1);
    setMode("wizard");
  };

  const onChange = (key, val) => {
    let next = { ...values, [key]: val };
    if (autoFrom && key === autoFrom.key) {
      const match = autoFrom.source.find((s) => s.idNumber === val || s.id === val);
      if (match) next = { ...next, ...autoFrom.map(match) };
    }
    setValues(next);
  };

  const save = () => {
    setList((prev) => [
      ...prev,
      { ...values, opsi, id: values.id || uid(idPrefix), tanggalInput: new Date().toISOString() },
    ]);
    setShowSaveModal(false);
    setShowSuccessModal(true);
  };

  const finish = () => {
    setShowSuccessModal(false);
    setMode("list");
    notify(`Data ${title} berhasil disimpan!`, "success", title);
  };

  const downloadPdf = async (record) => {
    const recFields = buildFields(record?.opsi ?? null, record ?? {}, autoFrom);
    const idText = record.id || record.idNumber || "";
    await generateSikasPdf({
      title,
      subtitle: idText
        ? `${idText}${record.opsi ? ` · ${record.opsi}` : ""}`
        : record.opsi || "",
      rows: rowsFromFields(recFields, record),
      filename: `${title.replace(/\s+/g, "-")}-${idText || "record"}`,
    });
  };

  const downloadDocx = async (record) => {
    if (!docxTemplate) return;
    const idText = record.id || record.idNumber || "record";
    try {
      await generateDocxFromTemplate(
        docxTemplate.url,
        docxTemplate.buildData(record),
        `${title.replace(/\s+/g, "-")}-${idText}.docx`
      );
      notify(`${title} (.docx) berhasil diunduh.`, "success");
    } catch (e) {
      notify(`Gagal membuat ${title}: ${e.message}`, "error");
    }
  };

  // Buka preview dulu; file baru dibuat & diunduh setelah user konfirmasi.
  const openPreview = (record) => {
    setDetailRow(null);
    setDocxPreview(record);
  };
  const closePreview = () => {
    setDocxPreview(null);
    setSelectedId("");
  };

  const renderDocxPreview = () => {
    if (!docxPreview) return null;
    const previewFields = buildFields(
      docxPreview.opsi ?? null,
      docxPreview,
      autoFrom
    );
    const idText = docxPreview.id || docxPreview.idNumber || "";
    return (
      <Modal
        open={!!docxPreview}
        onClose={closePreview}
        title={`Preview ${title}${idText ? ` - ${idText}` : ""}`}
        icon={Eye}
        width={600}
      >
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Periksa data di bawah. File akan dibuat sesuai template dan diunduh
          setelah kamu klik tombol download.
        </p>
        {buildDocPreview
          ? buildDocPreview(docxPreview)
          : <ReviewList fields={previewFields} values={docxPreview} />}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <Button variant="ghost" onClick={closePreview}>
            Batal
          </Button>
          {pdfEnabled && (
            <Button
              variant="ghost"
              icon={Download}
              onClick={async () => {
                await downloadPdf(docxPreview);
                closePreview();
              }}
            >
              Download PDF
            </Button>
          )}
          {docxTemplate && (
            <Button
              icon={FileText}
              onClick={async () => {
                await downloadDocx(docxPreview);
                closePreview();
              }}
            >
              Download Word (.docx)
            </Button>
          )}
        </div>
      </Modal>
    );
  };

  if (mode === "list") {
    const detailColumns = buildFields(
      detailRow?.opsi ?? null,
      detailRow ?? {},
      autoFrom
    ).map((f) => ({ key: f.key, label: f.label }));

    return (
      <div>
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={`${description} Klik salah satu baris untuk melihat detail atau mengubah data.`}
          right={
            <Button icon={Plus} onClick={start}>
              Tambah {title}
            </Button>
          }
        />
        {docxTemplate && list.length > 0 && !hideIdSelector && (
          <Card style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: font.display,
                    fontSize: 14,
                    marginBottom: 4,
                  }}
                >
                  Preview &amp; Download berdasarkan ID
                </div>
                <div style={{ color: T.muted, fontSize: 12.5, lineHeight: 1.5 }}>
                  Pilih ID untuk melihat preview data, lalu unduh dokumennya.
                </div>
              </div>
              <select
                value={selectedId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedId(val);
                  const rec = list.find((r) => r.id === val);
                  if (rec) setDocxPreview(rec);
                }}
                style={{
                  flex: "1 1 260px",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: T.inputBg,
                  color: T.text,
                  fontSize: 13.5,
                }}
              >
                <option value="">- Pilih ID -</option>
                {list.map((r) => {
                  const judul = r.judulBantuan || r.judulKegiatan || "";
                  return (
                    <option key={r.id} value={r.id}>
                      {r.id}
                      {judul ? ` - ${judul}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </Card>
        )}
        <Card padded={false}>
          <DataTable
            rows={list}
            columns={columns}
            emptyLabel={`Belum ada data ${title.toLowerCase()}.`}
            onRowClick={setDetailRow}
          />
        </Card>
        <DetailModal
          open={!!detailRow}
          onClose={() => setDetailRow(null)}
          data={detailRow}
          columns={detailColumns}
          onSave={(draft) => {
            setList((prev) =>
              prev.map((r) => (r === detailRow ? { ...r, ...draft } : r))
            );
            notify(`Data ${title} berhasil diperbarui!`);
          }}
          onDownloadPdf={pdfEnabled && !docxTemplate ? downloadPdf : undefined}
          onDownloadDocx={docxTemplate ? openPreview : undefined}
        />
        {renderDocxPreview()}
      </div>
    );
  }

  const stepsLabels = opsiOptions
    ? ["Pilih Jenis", "Isi Formulir", "Konfirmasi", "Simpan"]
    : ["Isi Formulir", "Konfirmasi", "Simpan"];
  const savingNow = showSaveModal || showSuccessModal;
  const currentIdx = opsiOptions
    ? savingNow
      ? 3
      : Math.min(step, 2)
    : savingNow
    ? 2
    : Math.min(step - 1, 1);

  return (
    <div>
      <PageHeader
        eyebrow={`Tambah ${title}`}
        title={title}
        right={
          <Button variant="ghost" icon={ArrowLeft} onClick={() => setMode("list")}>
            Kembali ke daftar
          </Button>
        }
      />
      <FlowSteps steps={stepsLabels} current={currentIdx} />

      {step === 0 && (
        <Card>
          <h3 style={{ fontFamily: font.display, fontSize: 16, marginBottom: 14 }}>
            {opsiLabel}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {opsiOptions.map((o) => (
              <button
                key={o}
                onClick={() => setOpsi(o)}
                style={{
                  padding: "22px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  border: `2px solid ${opsi === o ? T.navy : T.border}`,
                  background: opsi === o ? T.blueSoft : T.card,
                  fontWeight: 700,
                  color: opsi === o ? T.navy : T.text,
                  fontSize: 14,
                  transition: "border-color .15s ease, background-color .15s ease",
                }}
                onMouseEnter={(e) =>
                  opsi !== o && (e.currentTarget.style.borderColor = "#AFC3E0")
                }
                onMouseLeave={(e) =>
                  opsi !== o && (e.currentTarget.style.borderColor = T.border)
                }
              >
                {o}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <Button
              disabled={!opsi}
              onClick={() => setStep(confirmOpsi ? 0.5 : 1)}
            >
              Lanjutkan <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 0.5 && (
        <Card>
          <h3 style={{ fontFamily: font.display, fontSize: 16, marginBottom: 4 }}>
            Pilihannya bener?
          </h3>
          <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
            Anda memilih <Badge tone="blue">{opsi}</Badge>
          </p>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(0)}>
              Tidak, ganti pilihan
            </Button>
            <Button onClick={() => setStep(1)}>
              Ya, benar <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <FormGrid fields={fields} values={values} onChange={onChange} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <Button onClick={() => setStep(2)}>
              Lanjutkan <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h3 style={{ fontFamily: font.display, fontSize: 16, marginBottom: 4 }}>
            Datanya udah bener?
          </h3>
          <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>
            Tinjau data sebelum disimpan.
          </p>
          <ReviewList fields={fields} values={values} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(1)}>
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
          Data {title.toLowerCase()} akan disimpan dan tidak bisa diubah dari daftar.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setShowSaveModal(false)}>
            Batal
          </Button>
          <Button variant="accent" icon={Check} onClick={save}>
            Simpan Data
          </Button>
        </div>
      </Modal>

      <SuccessModal
        open={showSuccessModal}
        message={`Data ${title.toLowerCase()} sudah tercatat di daftar.`}
        onDone={finish}
        onDownloadPdf={
          pdfEnabled && !docxTemplate
            ? () => downloadPdf({ ...values, opsi, id: values.id })
            : undefined
        }
        onDownloadDocx={
          docxTemplate
            ? () => openPreview({ ...values, opsi, id: values.id })
            : undefined
        }
      />
      {renderDocxPreview()}
    </div>
  );
}