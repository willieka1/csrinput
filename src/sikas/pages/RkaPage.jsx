import { useMemo, useState } from "react";
import { Check, ClipboardList, Pencil, Plus, Trash2, X } from "lucide-react";
import { T, font } from "../../lib/theme";
import { OPT } from "../../lib/data";
import { rupiah, uid } from "../../lib/utils";
import Card from "../../components/Card";
import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import EmptyState from "../../components/EmptyState";

const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1];

function emptyDraft() {
  return {
    uraian: "Corporate Social Responsibility",
    kodePC: "",
    expenditureType: OPT.jenisKegiatanCsr[0],
    tahun: THIS_YEAR,
    jumlahRka: "",
  };
}

export default function RkaPage({ rka, setRka, notify }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [showForm, setShowForm] = useState(false);

  const totalTahunIni = useMemo(
    () => rka.filter((r) => r.tahun === THIS_YEAR).reduce((s, r) => s + (Number(r.jumlahRka) || 0), 0),
    [rka]
  );

  const startAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setShowForm(true);
  };
  const startEdit = (row) => {
    setEditingId(row.id);
    setDraft({ ...row });
    setShowForm(true);
  };
  const cancel = () => { setShowForm(false); setEditingId(null); };

  const save = () => {
    if (!draft.expenditureType || !draft.jumlahRka) {
      return notify("Isi jenis kegiatan dan jumlah RKA terlebih dahulu.", "error");
    }
    const record = { ...draft, id: editingId || uid("RKA"), jumlahRka: Number(draft.jumlahRka) };
    setRka((prev) =>
      editingId ? prev.map((r) => (r.id === editingId ? record : r)) : [record, ...prev]
    );
    notify(editingId ? "RKA berhasil diperbarui." : "RKA berhasil ditambahkan.", "success", "RKA");
    setShowForm(false);
    setEditingId(null);
  };

  const remove = (id) => {
    setRka((prev) => prev.filter((r) => r.id !== id));
    notify("RKA dihapus.", "success");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Rekapitulasi Realisasi Anggaran"
        title="RKA"
        description="Rencana Kerja & Anggaran per jenis kegiatan CSR per tahun. Nilai di sini jadi acuan Anggaran di halaman Rekap Anggaran."
        right={
          <Button icon={Plus} onClick={startAdd}>
            Tambah RKA
          </Button>
        }
      />

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Total RKA {THIS_YEAR}
            </div>
            <div style={{ fontFamily: font.display, fontSize: 22, color: T.heading, marginTop: 2 }}>
              {rupiah(totalTahunIni)}
            </div>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: font.display, fontSize: 15, marginBottom: 14 }}>
            {editingId ? "Ubah RKA" : "Tambah RKA"}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
            <Field label="Uraian" full>
              <input value={draft.uraian} onChange={(e) => setDraft({ ...draft, uraian: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Kode PC">
              <input
                value={draft.kodePC}
                onChange={(e) => setDraft({ ...draft, kodePC: e.target.value })}
                placeholder="cth. 23-1501-PPA-OP-LUO-8C-01"
                style={inputStyle}
              />
            </Field>
            <Field label="Jenis Kegiatan CSR (Expenditure Type)">
              <select
                value={draft.expenditureType}
                onChange={(e) => setDraft({ ...draft, expenditureType: e.target.value })}
                style={inputStyle}
              >
                {OPT.jenisKegiatanCsr.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Tahun">
              <select
                value={draft.tahun}
                onChange={(e) => setDraft({ ...draft, tahun: Number(e.target.value) })}
                style={inputStyle}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Field>
            <Field label="Jumlah RKA (Rp)">
              <input
                type="number"
                value={draft.jumlahRka}
                onChange={(e) => setDraft({ ...draft, jumlahRka: e.target.value })}
                placeholder="0"
                style={inputStyle}
              />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" icon={X} onClick={cancel}>Batal</Button>
            <Button icon={Check} onClick={save}>Simpan</Button>
          </div>
        </Card>
      )}

      {rka.length === 0 && !showForm ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            label="Belum ada RKA"
            hint="Tambahkan RKA per jenis kegiatan CSR untuk tahun berjalan."
            actionLabel="Tambah RKA"
            onAction={startAdd}
          />
        </Card>
      ) : (
        <Card padded={false}>
          <DataTable
            rows={rka}
            columns={[
              { key: "uraian", label: "Uraian" },
              { key: "kodePC", label: "Kode PC" },
              { key: "expenditureType", label: "Jenis Kegiatan CSR" },
              { key: "tahun", label: "Tahun" },
              { key: "jumlahRka", label: "Jumlah RKA", render: (r) => rupiah(r.jumlahRka) },
              {
                key: "_aksi",
                label: "",
                render: (r) => (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => startEdit(r)} style={iconBtn(T.blue)} aria-label="Ubah">
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => remove(r.id)} style={iconBtn(T.danger)} aria-label="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
            emptyLabel="Belum ada RKA."
          />
        </Card>
      )}
    </div>
  );
}

function Field({ label, full, children }) {
  return (
    <div style={{ flex: full ? "1 1 100%" : "1 1 220px", minWidth: 0 }}>
      <label style={{ display: "block", fontSize: 11.5, color: T.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  background: T.inputBg,
  color: T.text,
  fontSize: 13,
  fontFamily: font.body,
};

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
