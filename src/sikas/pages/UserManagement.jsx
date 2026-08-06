import { useMemo, useState } from "react";
import {
  AlertTriangle, Calendar, Check, KeyRound, Pencil, Plus,
  ShieldAlert, Trash2, UserCog, UserPlus,
} from "lucide-react";
import { T, font } from "../../lib/theme";
import { ROLES, isUserActive, localDateStr } from "../../lib/data";
import { uid } from "../../lib/utils";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import DatePicker from "../../components/DatePicker";

const ROLE_TONE = {
  humas:   { color: "#0E4C92", bg: "#DEEBFA" },
  asman:   { color: "#8A6D00", bg: "#FFF4D0" },
  madm:    { color: "#3F1D9B", bg: "#EBE2FF" },
  mitra:   { color: "#065F46", bg: "#D1FAE5" },
  silapak: { color: "#0F5457", bg: "#CCFBF1" },
};

function RolePill({ role }) {
  const meta = ROLE_TONE[role] || { color: "#444", bg: "#eee" };
  const label = ROLES.find((r) => r.value === role)?.label || role;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999,
      background: meta.bg, color: meta.color,
      fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3,
    }}>{label}</span>
  );
}

function StatusPill({ user }) {
  const t = localDateStr();
  let label, color, bg;
  if (user.activeFrom && t < user.activeFrom) {
    label = "Belum Aktif"; color = "#8A6D00"; bg = "#FFF4D0";
  } else if (user.activeTo && t > user.activeTo) {
    label = "Kadaluarsa"; color = "#B01818"; bg = "#FCE1E1";
  } else {
    label = "Aktif"; color = "#1E7F3E"; bg = "#DEF6E5";
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 999,
      background: bg, color,
      fontSize: 11.5, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${T.border}`, background: T.inputBg,
  color: T.text, fontSize: 13, fontFamily: "inherit",
};
const labelStyle = {
  display: "block", fontSize: 11.5, letterSpacing: 0.8,
  color: T.muted, fontWeight: 600, marginBottom: 4,
  textTransform: "uppercase", fontFamily: font.mono,
};

function todayStr() { return localDateStr(new Date()); }
function plusYearStr() {
  const d = new Date(); d.setFullYear(d.getFullYear() + 1);
  return localDateStr(d);
}

function UserForm({ initial, onCancel, onSave, existingUsernames }) {
  const [role, setRole] = useState(initial?.role || "humas");
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState(initial?.password || "");
  const [activeFrom, setActiveFrom] = useState(initial?.activeFrom || todayStr());
  const [activeTo, setActiveTo] = useState(initial?.activeTo || plusYearStr());
  const [err, setErr] = useState("");

  const submit = () => {
    if (!username.trim()) return setErr("Username wajib diisi.");
    if (!password.trim()) return setErr("Password wajib diisi.");
    if (activeFrom && activeTo && activeFrom > activeTo) {
      return setErr("Tanggal 'Aktif Sampai' harus setelah 'Aktif Dari'.");
    }
    const clash = existingUsernames.find(
      (e) => e.username === username.trim() && e.role === role && e.id !== initial?.id
    );
    if (clash) return setErr(`Username "${username}" sudah dipakai role ${role}.`);
    if (role === "humas" && username.trim().toLowerCase() === "admin") {
      return setErr("Username 'admin' dicadangkan untuk sistem, tidak bisa dipakai.");
    }
    onSave({
      id: initial?.id || uid("USR"),
      role, username: username.trim(), password,
      activeFrom, activeTo,
    });
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={inputStyle}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="contoh: budi.humas"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Password</label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 1 karakter"
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>
            <Calendar size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />
            Aktif Dari
          </label>
          <DatePicker value={activeFrom} onChange={setActiveFrom} placeholder="Pilih tanggal mulai" />
        </div>
        <div>
          <label style={labelStyle}>
            <Calendar size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />
            Aktif Sampai
          </label>
          <DatePicker value={activeTo} onChange={setActiveTo} placeholder="Pilih tanggal akhir" />
        </div>
      </div>

      <p style={{ fontSize: 11.5, color: T.muted, marginTop: 2, marginBottom: 14, lineHeight: 1.5 }}>
        Login akun ini hanya diperbolehkan dalam rentang tanggal di atas. Di luar rentang, login akan ditolak dengan pesan "Akun sedang tidak aktif".
      </p>

      {err && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
          padding: "9px 12px", borderRadius: 8,
          background: "#FCE1E1", color: "#B01818",
          border: "1px solid #F5A3A3", fontSize: 12.5,
        }}>
          <AlertTriangle size={14} /> {err}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onCancel}>Batal</Button>
        <Button variant="accent" icon={Check} onClick={submit}>
          {initial ? "Simpan Perubahan" : "Tambahkan User"}
        </Button>
      </div>
    </div>
  );
}

export default function UserManagementPage({ users, setUsers, notify }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const stats = useMemo(() => {
    const c = { total: users.length, active: 0, inactive: 0 };
    for (const u of users) {
      if (isUserActive(u)) c.active++;
      else c.inactive++;
    }
    return c;
  }, [users]);

  const openAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };
  const openEdit = (u) => {
    setEditTarget(u);
    setFormOpen(true);
  };
  const saveUser = (u) => {
    setUsers((prev) => {
      const exists = prev.some((p) => p.id === u.id);
      return exists ? prev.map((p) => (p.id === u.id ? u : p)) : [...prev, u];
    });
    setFormOpen(false);
    notify(editTarget ? "Data akun diperbarui." : "Akun baru ditambahkan.", "success");
  };
  const confirmDelete = (u) => setDeleteTarget(u);
  const doDelete = () => {
    setUsers((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    notify(`Akun ${deleteTarget.username} dihapus.`, "success");
    setDeleteTarget(null);
  };

  const columns = [
    { key: "role",     label: "Role", render: (r) => <RolePill role={r.role} /> },
    { key: "username", label: "Username",
      render: (r) => <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 12.5 }}>{r.username}</span> },
    { key: "password", label: "Password",
      render: (r) => (
        <span style={{
          fontFamily: font.mono, fontSize: 12.5, color: T.muted,
          letterSpacing: 1.5,
        }}>••••••</span>
      ) },
    { key: "activeFrom", label: "Aktif Dari",
      render: (r) => r.activeFrom
        ? new Date(r.activeFrom).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
        : "-" },
    { key: "activeTo", label: "Sampai",
      render: (r) => r.activeTo
        ? new Date(r.activeTo).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
        : "-" },
    { key: "status", label: "Status", render: (r) => <StatusPill user={r} /> },
    { key: "aksi", label: "Aksi", render: (r) => (
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openEdit(r); }}
          title="Edit akun"
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: `1px solid ${T.border}`, background: T.card,
            color: T.blue, cursor: "pointer",
            display: "grid", placeItems: "center",
          }}
        ><Pencil size={13} /></button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); confirmDelete(r); }}
          title="Hapus akun"
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: `1px solid ${T.border}`, background: T.card,
            color: "#B01818", cursor: "pointer",
            display: "grid", placeItems: "center",
          }}
        ><Trash2 size={13} /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Admin Panel"
        title="Manajemen Akses"
        description="Kelola username, password, dan rentang tanggal aktif untuk akun Humas, Asman, dan MADM. Akun di luar rentang tanggal aktif tidak bisa login."
        right={
          <Button icon={UserPlus} onClick={openAdd}>
            Tambah User
          </Button>
        }
      />

      {/* Ringkasan cepat */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 10, marginBottom: 14,
      }}>
        <Card style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: T.blueSoft, color: T.blue,
            display: "grid", placeItems: "center",
          }}><UserCog size={16} /></div>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase",
                          fontFamily: font.mono, color: T.muted }}>Total Akun</div>
            <div style={{ fontFamily: font.display, fontSize: 20, color: T.heading }}>{stats.total}</div>
          </div>
        </Card>
        <Card style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#DEF6E5", color: "#1E7F3E",
            display: "grid", placeItems: "center",
          }}><Check size={16} /></div>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase",
                          fontFamily: font.mono, color: T.muted }}>Aktif</div>
            <div style={{ fontFamily: font.display, fontSize: 20, color: T.heading }}>{stats.active}</div>
          </div>
        </Card>
        <Card style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#FCE1E1", color: "#B01818",
            display: "grid", placeItems: "center",
          }}><ShieldAlert size={16} /></div>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase",
                          fontFamily: font.mono, color: T.muted }}>Belum/Kadaluarsa</div>
            <div style={{ fontFamily: font.display, fontSize: 20, color: T.heading }}>{stats.inactive}</div>
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <DataTable
          rows={users}
          columns={columns}
          emptyLabel="Belum ada akun terdaftar. Klik 'Tambah User' untuk menambah akses."
          onRowClick={openEdit}
        />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? `Edit Akun - ${editTarget.username}` : "Tambah User Baru"}
        icon={editTarget ? KeyRound : UserPlus}
        width={520}
      >
        <UserForm
          initial={editTarget}
          onCancel={() => setFormOpen(false)}
          onSave={saveUser}
          existingUsernames={users}
        />
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Akun?"
        icon={AlertTriangle}
        width={400}
      >
        {deleteTarget && (
          <>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 14, lineHeight: 1.6 }}>
              Akun <b style={{ color: T.text, fontFamily: font.mono }}>{deleteTarget.username}</b>{" "}
              (<RolePill role={deleteTarget.role} />) akan dihapus permanen.
              Setelah dihapus, user ini tidak bisa login sama sekali.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button variant="accent" icon={Trash2} onClick={doDelete}>Hapus</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
