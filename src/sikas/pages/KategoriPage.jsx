import { useMemo, useState } from "react";
import { Check, Tags, X } from "lucide-react";
import { T, font } from "../../lib/theme";
import { OPT } from "../../lib/data";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";

const PILL_COLOR = {
  "NON PO":    { bg: "#DEEBFA", color: "#0E4C92" },
  "Cash Card": { bg: "#FFF4D0", color: "#8A6D00" },
  "PO":        { bg: "#EBE2FF", color: "#3F1D9B" },
};

const FILTERS = [{ key: "all", label: "Semua" }, ...OPT.kategori.map((k) => ({ key: k, label: k }))];

export default function KategoriPage({ rab, setRab, notify }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");

  const startEdit = (row) => {
    setEditing(row.idNumber);
    setDraft(row.kategori || "");
  };

  const saveEdit = (idNumber) => {
    if (!draft) return notify("Pilih kategori terlebih dahulu.", "error");
    setRab((prev) =>
      prev.map((r) => (r.idNumber === idNumber ? { ...r, kategori: draft } : r))
    );
    setEditing(null);
    notify(`Kategori ${idNumber} diperbarui ke ${draft}.`, "success", "Kategori");
  };

  const cancelEdit = () => setEditing(null);

  const counts = useMemo(() => {
    const c = { all: rab.length };
    OPT.kategori.forEach((k) => {
      c[k] = rab.filter((r) => r.kategori === k).length;
    });
    return c;
  }, [rab]);

  const filteredRab = useMemo(
    () => (filter === "all" ? rab : rab.filter((r) => r.kategori === filter)),
    [rab, filter]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Perencanaan"
        title="Kategori"
        description="Tetapkan jenis paket (NON PO / Cash Card / PO) untuk setiap ID RAB. Kategori yang dipilih akan digunakan otomatis oleh seluruh dokumen turunan."
      />

      {rab.length === 0 ? (
        <Card>
          <EmptyState
            icon={Tags}
            label="Belum ada data RAB"
            hint="Buat RAB terlebih dahulu untuk mengatur kategori."
          />
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const pill = f.key !== "all" ? PILL_COLOR[f.key] : null;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: `1.5px solid ${active ? (pill ? pill.color : T.navy) : T.border}`,
                    background: active ? (pill ? pill.bg : T.blueSoft) : T.card,
                    color: active ? (pill ? pill.color : T.navy) : T.muted,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: font.body,
                    cursor: "pointer",
                    transition: "border-color .15s ease, background-color .15s ease",
                  }}
                >
                  {f.label}
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: 11,
                      padding: "1px 7px",
                      borderRadius: 999,
                      background: active ? "rgba(255,255,255,0.6)" : T.bg,
                    }}
                  >
                    {counts[f.key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <Card padded={false}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr>
                    <th style={th}>ID RAB</th>
                    <th style={th}>Judul Kegiatan</th>
                    <th style={{ ...th, textAlign: "center" }}>Kategori</th>
                    <th style={{ ...th, textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRab.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "32px 16px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                        Tidak ada RAB dengan kategori ini.
                      </td>
                    </tr>
                  ) : (
                    filteredRab.map((row, idx) => {
                      const isEditing = editing === row.idNumber;
                      const pill = PILL_COLOR[row.kategori] || { bg: T.bg, color: T.muted };
                      return (
                        <tr
                          key={row.idNumber}
                          style={{
                            background: isEditing ? T.blueSoft : idx % 2 ? T.rowAlt : T.card,
                            transition: "background-color .15s ease",
                          }}
                        >
                          <td style={{ ...td, fontWeight: 700, color: T.blue, fontFamily: font.mono }}>
                            {row.idNumber || "—"}
                          </td>
                          <td style={{ ...td, maxWidth: 320 }}>{row.judulKegiatan || "—"}</td>
                          <td style={{ ...td, textAlign: "center" }}>
                            {isEditing ? (
                              <select
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                autoFocus
                                style={selectStyle}
                              >
                                <option value="">-- Pilih --</option>
                                {OPT.kategori.map((k) => (
                                  <option key={k} value={k}>{k}</option>
                                ))}
                              </select>
                            ) : (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 14px",
                                  borderRadius: 999,
                                  background: pill.bg,
                                  color: pill.color,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  letterSpacing: 0.3,
                                }}
                              >
                                {row.kategori || "Belum diatur"}
                              </span>
                            )}
                          </td>
                          <td style={{ ...td, textAlign: "center" }}>
                            {isEditing ? (
                              <div style={{ display: "inline-flex", gap: 6 }}>
                                <Button variant="accent" icon={Check} onClick={() => saveEdit(row.idNumber)}>
                                  Simpan
                                </Button>
                                <Button variant="ghost" icon={X} onClick={cancelEdit}>
                                  Batal
                                </Button>
                              </div>
                            ) : (
                              <Button variant="ghost" onClick={() => startEdit(row)}>
                                Ubah
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "11px 16px",
  background: T.bg,
  borderBottom: `1px solid ${T.border}`,
  color: T.muted,
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
const td = {
  padding: "13px 16px",
  borderBottom: `1px solid ${T.border}`,
  color: T.text,
};
const selectStyle = {
  padding: "6px 12px",
  borderRadius: 8,
  fontSize: 13,
  border: `1.5px solid ${T.blue}`,
  background: T.card,
  color: T.text,
  fontFamily: font.body,
  cursor: "pointer",
  outline: "none",
};
