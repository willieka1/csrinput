import { useState } from "react";
import { Eye, Trash2, Upload, Users } from "lucide-react";
import { T, font } from "../../lib/theme";
import { uid } from "../../lib/utils";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import UploadDocModal from "../../components/UploadDocModal";

export default function DaftarHadirPage({ rab, notify }) {
  const [lists] = useState([]);
  const [docs, setDocs] = useState([]);
  const [showUpload, setShowUpload] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleSaveDocs = (rabItem, files) => {
    const newDocs = files.map((f) => ({
      id: uid("DH-DOC"),
      rabId: rabItem.idNumber,
      fileName: f.name,
      fileSize: f.size,
      fileType: f.type,
      url: URL.createObjectURL(f),
    }));
    setDocs((prev) => [...prev, ...newDocs]);
    if (notify) notify(`${newDocs.length} file daftar hadir berhasil disimpan.`, "success", "Upload Daftar Hadir");
  };
  const handleDeleteDoc = (id) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (notify) notify("File daftar hadir dihapus.", "success");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Pelaksanaan"
        title="Daftar Hadir"
        description="Lihat daftar hadir peserta kegiatan berdasarkan RAB terkait."
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
            const entries = lists.filter((e) => e.rabId === r.idNumber);
            return (
              <Card key={r.idNumber}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 700, color: T.blue }}>{r.idNumber}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.heading, marginTop: 2 }}>{r.judulKegiatan}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => setShowUpload(r)} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`,
                      background: T.card, color: T.blue, cursor: "pointer", fontSize: 12, fontWeight: 600,
                    }}><Upload size={14} /> Upload</button>
                  </div>
                </div>

                {entries.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: T.muted, padding: "8px 0" }}>Belum ada peserta.</div>

                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ background: T.bg }}>
                          <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${T.border}`, width: 40 }}>No</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${T.border}` }}>Nama</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${T.border}` }}>Instansi</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${T.border}`, width: 80 }}>Waktu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((e, i) => (
                          <tr key={e.id}>
                            <td style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}` }}>{i + 1}</td>
                            <td style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}`, fontWeight: 600 }}>{e.nama}</td>
                            <td style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}` }}>{e.instansi || "-"}</td>
                            <td style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}` }}>
                              {new Date(e.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>
                  Total peserta: {entries.length}
                </div>

                {docs.filter((d) => d.rabId === r.idNumber).length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${T.border}` }}>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
                      File Daftar Hadir Terupload
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                      {docs.filter((d) => d.rabId === r.idNumber).map((d) => (
                        <div key={d.id} style={{
                          padding: "10px 12px", borderRadius: 8,
                          border: `1px solid ${T.border}`, background: T.bg,
                          display: "flex", alignItems: "center", gap: 10,
                        }}>
                          {d.fileType?.startsWith("image/") ? (
                            <img src={d.url} alt={d.fileName} style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <Users size={16} color={T.muted} style={{ flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 12.5, fontWeight: 600, color: T.heading,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{d.fileName}</div>
                            <div style={{ fontSize: 10.5, color: T.muted }}>{(d.fileSize / 1024).toFixed(1)} KB</div>
                          </div>
                          <button onClick={() => setPreview(d)} title="Lihat" style={{
                            background: "transparent", border: "none", color: T.blue, cursor: "pointer", padding: 4,
                          }}><Eye size={14} /></button>
                          <button onClick={() => handleDeleteDoc(d.id)} title="Hapus" style={{
                            background: "transparent", border: "none", color: T.danger, cursor: "pointer", padding: 4,
                          }}><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
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
        title={showUpload ? `Upload Daftar Hadir - ${showUpload.idNumber}` : ""}
        subtitle={showUpload?.judulKegiatan}
        accept="image/*,.pdf,.doc,.docx"
        onSave={(files) => handleSaveDocs(showUpload, files)}
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
