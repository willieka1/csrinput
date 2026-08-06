import { useState } from "react";
import { Eye, FileSpreadsheet, FileText, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { T, font } from "../../lib/theme";
import { uid } from "../../lib/utils";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import UploadDocModal from "../../components/UploadDocModal";

function iconForType(type) {
  if (type?.startsWith("image/")) return ImageIcon;
  if (type?.includes("sheet") || type?.includes("excel")) return FileSpreadsheet;
  return FileText;
}

export default function EvidenPage({ rab, notify }) {
  const [evidens, setEvidens] = useState([]);
  const [showUpload, setShowUpload] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleSave = (rabItem, files, keterangan) => {
    const newItems = files.map((f) => ({
      id: uid("EVD"),
      rabId: rabItem.idNumber,
      judulRab: rabItem.judulKegiatan,
      fileName: f.name,
      fileSize: f.size,
      fileType: f.type,
      keterangan,
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(f),
    }));
    setEvidens((prev) => [...prev, ...newItems]);
    if (notify) notify(`${newItems.length} eviden berhasil disimpan.`, "success", "Upload Eviden");
  };

  const handleDelete = (id) => {
    setEvidens((prev) => prev.filter((e) => e.id !== id));
    if (notify) notify("Eviden dihapus.", "success");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Pelaksanaan"
        title="Eviden Lainnya"
        description="Unggah eviden pendukung kegiatan seperti foto, surat, atau dokumen tambahan."
      />

      {(!rab || rab.length === 0) ? (
        <Card>
          <div style={{ padding: "32px 0", textAlign: "center", color: T.muted, fontSize: 14 }}>
            Belum ada RAB. Buat RAB terlebih dahulu.
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {rab.map((r) => {
            const items = evidens.filter((e) => e.rabId === r.idNumber);
            return (
              <Card key={r.idNumber}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 700, color: T.blue }}>{r.idNumber}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.heading, marginTop: 2 }}>{r.judulKegiatan}</div>
                  </div>
                  <button onClick={() => setShowUpload(r)} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`,
                    background: T.card, color: T.blue, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}><Upload size={14} /> Upload Eviden</button>
                </div>

                {items.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: T.muted, padding: "8px 0" }}>Belum ada eviden.</div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {items.map((e) => {
                      const Icon = iconForType(e.fileType);
                      return (
                        <div key={e.id} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 12px", borderRadius: 8,
                          border: `1px solid ${T.border}`, background: T.bg,
                        }}>
                          {e.fileType?.startsWith("image/") ? (
                            <img src={e.url} alt={e.fileName} style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <Icon size={16} color={T.muted} style={{ flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 12.5, fontWeight: 600, color: T.heading,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{e.fileName}</div>
                            <div style={{ fontSize: 10.5, color: T.muted }}>
                              {(e.fileSize / 1024).toFixed(1)} KB
                              {e.keterangan ? ` - ${e.keterangan}` : ""}
                            </div>
                          </div>
                          <button onClick={() => setPreview(e)} title="Lihat" style={{
                            background: "transparent", border: "none", color: T.blue, cursor: "pointer", padding: 4,
                          }}><Eye size={14} /></button>
                          <button onClick={() => handleDelete(e.id)} title="Hapus" style={{
                            background: "transparent", border: "none", color: T.danger, cursor: "pointer", padding: 4,
                          }}><Trash2 size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <UploadDocModal
        open={!!showUpload}
        onClose={() => setShowUpload(null)}
        title={showUpload ? `Upload Eviden - ${showUpload.idNumber}` : ""}
        subtitle={showUpload?.judulKegiatan}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        showKeterangan
        onSave={(files, keterangan) => handleSave(showUpload, files, keterangan)}
      />

      {preview && (
        <Modal open onClose={() => setPreview(null)} title={preview.fileName} icon={Eye} width={600}>
          {preview.fileType && preview.fileType.startsWith("image/") ? (
            <img src={preview.url} alt={preview.fileName} style={{ width: "100%", borderRadius: 8 }} />
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0", color: T.muted }}>
              <p>Preview tidak tersedia untuk tipe file ini.</p>
              <a href={preview.url} download={preview.fileName} style={{ color: T.blue, fontWeight: 600 }}>
                Download file
              </a>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
