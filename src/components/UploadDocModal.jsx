import { useRef, useState } from "react";
import { Check, File, FileSpreadsheet, FileText, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { T } from "../lib/theme";
import { uid } from "../lib/utils";
import Modal from "./Modal";
import Button from "./Button";

function iconForType(type) {
  if (type?.startsWith("image/")) return ImageIcon;
  if (type === "application/pdf") return FileText;
  if (type?.includes("sheet") || type?.includes("excel")) return FileSpreadsheet;
  return File;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Modal upload dengan alur 2 langkah: pilih file dulu (bisa lihat preview-nya
 * & hapus sebelum disimpan), baru klik "Simpan" buat beneran commit.
 * Dipakai bareng di Dokumentasi, Eviden, dan Daftar Hadir.
 */
export default function UploadDocModal({
  open,
  onClose,
  title,
  subtitle,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx",
  showKeterangan = false,
  onSave,
}) {
  const [staged, setStaged] = useState([]);
  const [keterangan, setKeterangan] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const items = files.map((f) => ({
      stagedId: uid("STG"),
      file: f,
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setStaged((prev) => [...prev, ...items]);
  };

  const removeStaged = (stagedId) => {
    setStaged((prev) => {
      const found = prev.find((s) => s.stagedId === stagedId);
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((s) => s.stagedId !== stagedId);
    });
  };

  const reset = () => {
    staged.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl));
    setStaged([]);
    setKeterangan("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    if (!staged.length) return;
    onSave(staged.map((s) => s.file), keterangan.trim());
    setStaged([]);
    setKeterangan("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={title} icon={UploadCloud} width={480}>
      {subtitle && (
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
          <b style={{ color: T.heading }}>{subtitle}</b>
        </div>
      )}

      {showKeterangan && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.heading, marginBottom: 4, display: "block" }}>
            Keterangan (opsional)
          </label>
          <input
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: Foto serah terima"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.inputBg,
              fontSize: 13, color: T.text, boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        style={{
          border: `1.5px dashed ${dragOver ? T.blue : T.border}`,
          borderRadius: 12,
          padding: "22px 16px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? T.blueSoft : T.bg,
          transition: "border-color .15s ease, background-color .15s ease",
          marginBottom: 14,
        }}
      >
        <UploadCloud size={22} color={T.blue} style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: T.heading }}>
          Klik untuk pilih file, atau seret file ke sini
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>
          Bisa pilih beberapa file sekaligus
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          style={{ display: "none" }}
        />
      </div>

      {/* Staged files preview */}
      {staged.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
            {staged.length} file siap disimpan
          </div>
          {staged.map((s) => {
            const Icon = iconForType(s.file.type);
            return (
              <div
                key={s.stagedId}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.card,
                }}
              >
                {s.previewUrl ? (
                  <img
                    src={s.previewUrl}
                    alt={s.file.name}
                    style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: 6, background: T.bg,
                    display: "grid", placeItems: "center", flexShrink: 0,
                  }}>
                    <Icon size={16} color={T.muted} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12.5, fontWeight: 600, color: T.heading,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {s.file.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: T.muted }}>{formatSize(s.file.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeStaged(s.stagedId)}
                  aria-label="Hapus"
                  title="Hapus"
                  style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: 7,
                    border: "none", background: "transparent", color: T.danger,
                    cursor: "pointer", display: "grid", placeItems: "center",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={handleClose}>Batal</Button>
        <Button icon={Check} onClick={handleSave} disabled={!staged.length}>
          Simpan {staged.length > 0 ? `(${staged.length})` : ""}
        </Button>
      </div>
    </Modal>
  );
}
