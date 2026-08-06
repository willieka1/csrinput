import { useEffect, useMemo, useState } from "react";
import { T, font, setTheme } from "./lib/theme";
import {
  KONTEN_SEED,
  MENU,
  OPT,
  PROPOSAL_SEED,
  VENDOR_SEED,
  MITRA_SEED,
} from "./lib/data";
import { uid } from "./lib/utils";
import { formatTanggalPanjang } from "./lib/docxGenerate";
import {
  autoFromRab,
  bastFields,
  laporanFields,
  paktaFields,
  torFields,
} from "./lib/wizardFields";

import Sidebar from "./sikas/components/Sidebar";
import Topbar from "./sikas/components/Topbar";
import HelpModal from "./components/HelpModal";
import Toast from "./components/Toast";

import LandingGateway from "./portal/pages/LandingGateway";
import SilapakLogin from "./silapak-priok/pages/SilapakLogin";
import SilapakApp from "./silapak-priok/pages/SilapakApp";
import LoginScreen from "./sikas/pages/Login";
import Dashboard from "./sikas/pages/Dashboard";
import RabPage from "./sikas/pages/Rab";
import RkaPage from "./sikas/pages/RkaPage";
import RekapAnggaranPage from "./sikas/pages/RekapAnggaranPage";
import VendorPage from "./sikas/pages/Vendor";
import HistoryPage from "./sikas/pages/History";
import Panduan from "./sikas/pages/Panduan";
import GenericWizard from "./sikas/pages/GenericWizard";
import { TorDocPreview, BastDocPreview, PaktaDocPreview } from "./components/DocTemplatePreview";
import ProposalRekapPage from "./sikas/pages/ProposalRekap";
import ProposalEvaluasiPage from "./sikas/pages/ProposalEvaluasi";
import PengelolaanKomunikasi from "./sikas/pages/PengelolaanKomunikasi";
import InboxPage from "./sikas/pages/Inbox";
import InboxEvaluasiPage from "./sikas/pages/InboxEvaluasi";
import AsmanDashboard from "./sikas/asman/pages/AsmanDashboard";
import MadmDashboard from "./sikas/madm/pages/MadmDashboard";
import KasPackagesPage from "./sikas/pages/KasPackages";
import UserManagementPage from "./sikas/pages/UserManagement";
import PengajuanMitraPage from "./pengajuan-mitra/pages/PengajuanMitra";
import MitraLogin from "./pengajuan-mitra/pages/MitraLogin";
import MitraApp from "./pengajuan-mitra/pages/MitraApp";
import DokumentasiPage from "./sikas/pages/Dokumentasi";
import DaftarHadirPage from "./sikas/pages/DaftarHadir";
import EvidenPage from "./sikas/pages/Eviden";
import BappPage from "./sikas/pages/BappPage";
import ChecklistDokumenPage from "./sikas/pages/ChecklistDokumen";
import FormVerifikasiPage from "./sikas/pages/FormVerifikasi";
import Lampiran1Page from "./sikas/pages/Lampiran1";
import Lampiran2Page from "./sikas/pages/Lampiran2";
import KategoriPage from "./sikas/pages/KategoriPage";
import { DEFAULT_USERS, DOC_STATUS, authenticateUser } from "./lib/data";

const seed = (prefix, rows) =>
  rows.map((v, i) => ({
    ...v,
    id: `${prefix}-${String(i + 1).padStart(3, "0")}`,
  }));

const splitLines = (s) =>
  String(s || "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

const tanggalDenganHari = (iso) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const DOCX_TEMPLATES = {
  tor: {
    url: "/templates/Template_TOR.docx",
    buildData: (r) => ({
      judulProgramRKA: r.judulProgramRKA || "",
      judulKegiatan: r.judulKegiatan || "",
      latarBelakang: r.latarBelakang || "",
      tujuanUmum: r.tujuanUmum || "",
      tujuanKhususList: splitLines(r.tujuanKhusus),
      sasaranList: splitLines(r.sasaran),
      hariTanggal: tanggalDenganHari(r.hariTanggal) || r.hariTanggal || "",
      tempat: r.tempat || "",
      narasumber: r.narasumber || "-",
    }),
  },
  bast: {
    url: "/templates/Template_BAST.docx",
    buildData: (r) => ({
      nomor: r.nomor || "",
      judulBantuan: r.judulBantuan || "",
      tanggal: formatTanggalPanjang(r.tanggal) || r.tanggal || "",
      namaPihakKedua: r.namaPihakKedua || "",
      jabatanPihakKedua: r.jabatanPihakKedua || "",
      instansiPihakKedua: r.instansiPihakKedua || "",
    }),
  },
  pakta: {
    url: "/templates/Template_Pakta_Integritas.docx",
    buildData: (r) => ({
      judulKegiatan: r.judulBantuan || "",
      tanggalPi: formatTanggalPanjang(r.tanggalPi) || r.tanggalPi || "",
      namaPenerima: r.namaPenerima || "",
    }),
  },
};

export default function App() {
  const [portal, setPortal] = useState(null);
  const [silapakLoggedIn, setSilapakLoggedIn] = useState(false);
  const [mitraLoggedIn, setMitraLoggedIn] = useState(false);
  const [mitraUser, setMitraUser] = useState(null);

  const [user, setUser] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [themeMode, setThemeMode] = useState("light");
  useEffect(() => setTheme(themeMode), [themeMode]);

  useEffect(() => {
    const applyResponsive = () => setCollapsed(window.innerWidth < 860);
    applyResponsive();
    window.addEventListener("resize", applyResponsive);
    return () => window.removeEventListener("resize", applyResponsive);
  }, []);

  const PACKAGE_SEED = [
    { idRab: "RAB-2026-001", judul: "Bantuan Perbaikan Jalan Metro Marina Ancol", kategori: "NON PO",    status: DOC_STATUS.SUBMITTED },
    { idRab: "RAB-2026-002", judul: "Fasilitasi Kegiatan Sinergi Kota Hijau",     kategori: "Cash Card", status: DOC_STATUS.APPROVED,  submittedAt: "2026-04-20T09:00:00Z", reviewedAt: "2026-04-21T10:00:00Z", reviewedBy: "asman" },
    { idRab: "RAB-2026-003", judul: "Bantuan Rehabilitasi Mangrove Cilincing",    kategori: "NON PO",    status: DOC_STATUS.PROCESSED, submittedAt: "2026-03-15T09:00:00Z", reviewedAt: "2026-03-16T09:00:00Z", reviewedBy: "asman", processedAt: "2026-03-17T14:00:00Z", processedBy: "madm" },
  ];
  const seedSubDoc = (idField, judulField) =>
    PACKAGE_SEED.map((p) => ({
      [idField]: p.idRab,
      [judulField]: p.judul,
      kategori: p.kategori,
    }));
  const [rab, setRab] = useState(() =>
    PACKAGE_SEED.map((p) => ({
      idNumber: p.idRab, judulKegiatan: p.judul, kategori: p.kategori,
      tanggalRab: "2026-04-20", totalEvaluasi: 15000000,
    }))
  );
  const [tor, setTor] = useState(() => seedSubDoc("id", "judulKegiatan"));
  const [bast, setBast] = useState(() => seedSubDoc("id", "judulBantuan"));
  const [pakta, setPakta] = useState(() => seedSubDoc("id", "judulBantuan"));
  const [bapp, setBapp] = useState([]);
  const [laporan, setLaporan] = useState([]);
  const [rka, setRka] = useState([]);

  const USERS_LS_KEY = "sikas.users.v1";
  const [users, setUsers] = useState(() => {
    try {
      const raw = typeof window !== "undefined" && window.localStorage.getItem(USERS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_USERS;
  });
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(USERS_LS_KEY, JSON.stringify(users));
      }
    } catch (_) {}
  }, [users]);
  const authenticate = (role, uname, pw) => authenticateUser(users, role, uname, pw);

  const [packages, setPackages] = useState(() =>
    PACKAGE_SEED.map((p) => ({
      idRab: p.idRab, judul: p.judul, kategori: p.kategori,
      formEvaluasi: true,
      status: p.status,
      submittedAt: p.submittedAt || new Date().toISOString(),
      reviewedAt: p.reviewedAt || "", reviewedBy: p.reviewedBy || "",
      reviewNote: "",
      processedAt: p.processedAt || "", processedBy: p.processedBy || "",
    }))
  );
  const [vendors, setVendors] = useState(() => seed("VND", VENDOR_SEED));
  const [proposals, setProposals] = useState(() => seed("PRP", PROPOSAL_SEED));
  const [konten, setKonten] = useState(() => seed("KTN", KONTEN_SEED));
  const [evaluasi, setEvaluasi] = useState([]);
  const [history, setHistory] = useState([]);
  const [mitraList, setMitraList] = useState(() => seed("MTR", MITRA_SEED));

  const addHistory = (jenis) => {
    const now = new Date();
    setHistory((prev) => [
      {
        id: uid("HIS"),
        jenis,
        tanggal: now.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        waktu: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      ...prev,
    ]);
  };

  const notify = (message, type = "success", jenis = null) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
    if (type === "success" && jenis) addHistory(jenis);
  };

  const updatePackage = (idRab, patch) => {
    setPackages((prev) => prev.map((p) => (p.idRab === idRab ? { ...p, ...patch } : p)));
  };
  const updateEvaluasi = (id, patch) => {
    setEvaluasi((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };
  const upsertPackage = (idRab, patch) => {
    setPackages((prev) => {
      const found = prev.some((p) => p.idRab === idRab);
      if (found) return prev.map((p) => (p.idRab === idRab ? { ...p, ...patch } : p));
      return [...prev, { idRab, ...patch }];
    });
  };

  const rabIdOptions = useMemo(() => rab.map((r) => r.idNumber), [rab]);

  const handleBackToPortal = () => {
    setUser(null);
    setPortal(null);
  };

  const modules = useMemo(
    () => ({
      dashboard: (
        <Dashboard
          user={user}
          data={{ rab, tor, bast, pakta, laporan, proposals, konten }}
          goto={setActive}
        />
      ),
      "proposal-rekap": (
        <ProposalRekapPage
          proposals={proposals}
          setProposals={setProposals}
          notify={notify}
        />
      ),
      "proposal-evaluasi": (
        <ProposalEvaluasiPage
          proposals={proposals}
          evaluasiList={evaluasi}
          setEvaluasiList={setEvaluasi}
          notify={notify}
        />
      ),
      konten: (
        <PengelolaanKomunikasi
          list={konten}
          setList={setKonten}
          notify={notify}
        />
      ),
      rab: <RabPage rab={rab} setRab={setRab} vendors={vendors} notify={notify} />,
      kategori: <KategoriPage rab={rab} setRab={setRab} notify={notify} />,
      tor: (
        <GenericWizard
          title="TOR"
          eyebrow="Modul TOR"
          description="Term of Reference kegiatan, dirujuk dari ID RAB."
          buildFields={torFields(rabIdOptions)}
          idPrefix="TOR"
          autoFrom={{ key: "id", source: rab, map: autoFromRab.tor }}
          list={tor}
          setList={setTor}
          notify={notify}
          pdfEnabled
          docxTemplate={DOCX_TEMPLATES.tor}
          buildDocPreview={(v) => <TorDocPreview values={v} />}
          hideIdSelector
          columns={[
            { key: "id", label: "ID TOR" },
            {
              key: "tanggalInput",
              label: "Tanggal Input",
              render: (r) =>
                r.tanggalInput
                  ? new Date(r.tanggalInput).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                  : "-",
            },
            { key: "kategori", label: "Kategori" },
            { key: "judulKegiatan", label: "Judul Kegiatan" },
            { key: "tempat", label: "Tempat" },
            { key: "hariTanggal", label: "Tanggal" },
          ]}
        />
      ),
      bast: (
        <GenericWizard
          title="BAST"
          eyebrow="Modul BAST"
          description="Berita Acara Serah Terima. Kategori (NON PO / Cash Card) otomatis mengikuti ID RAB yang dipilih."
          buildFields={bastFields(rabIdOptions)}
          idPrefix="BAST"
          autoFrom={{ key: "id", source: rab, map: autoFromRab.bast }}
          list={bast}
          setList={setBast}
          notify={notify}
          pdfEnabled
          docxTemplate={DOCX_TEMPLATES.bast}
          buildDocPreview={(v) => <BastDocPreview values={v} />}
          columns={[
            { key: "id", label: "ID" },
            { key: "kategori", label: "Kategori" },
            { key: "nomor", label: "Nomor" },
            { key: "jumlahBantuan", label: "Jumlah Bantuan" },
          ]}
        />
      ),
      pakta: (
        <GenericWizard
          title="Pakta Integritas"
          eyebrow="Modul Pakta Integritas"
          description="Pakta Integritas penerima bantuan. Kategori (NON PO / Cash Card) otomatis mengikuti ID RAB yang dipilih."
          buildFields={paktaFields(rabIdOptions)}
          idPrefix="PI"
          autoFrom={{ key: "id", source: rab, map: autoFromRab.pakta }}
          list={pakta}
          setList={setPakta}
          notify={notify}
          pdfEnabled
          docxTemplate={DOCX_TEMPLATES.pakta}
          buildDocPreview={(v) => <PaktaDocPreview values={v} />}
          columns={[
            { key: "id", label: "ID" },
            { key: "kategori", label: "Kategori" },
            { key: "namaPenerima", label: "Nama Penerima" },
            { key: "lembagaPenerima", label: "Lembaga" },
          ]}
        />
      ),
      bapp: (
        <BappPage
          rab={rab}
          list={bapp}
          setList={setBapp}
          notify={notify}
        />
      ),
      laporan: (
        <GenericWizard
          title="Laporan"
          eyebrow="Modul Laporan"
          description="Laporan realisasi bantuan, CC atau NON PO."
          opsiOptions={["Laporan CC", "Laporan NON PO"]}
          opsiLabel="Opsi: Laporan CC / Laporan NON PO"
          confirmOpsi
          buildFields={laporanFields(rabIdOptions)}
          idPrefix="LAP"
          autoFrom={{ key: "id", source: rab, map: autoFromRab.laporan }}
          list={laporan}
          setList={setLaporan}
          notify={notify}
          pdfEnabled
          columns={[
            { key: "id", label: "ID Laporan" },
            { key: "opsi", label: "Jenis" },
            { key: "namaBarang", label: "Nama Barang" },
            { key: "namaInstansiPenerima", label: "Instansi Penerima" },
          ]}
        />
      ),
      "rekap-anggaran": (
        <RekapAnggaranPage rka={rka} rab={rab} laporan={laporan} />
      ),
      rka: (
        <RkaPage rka={rka} setRka={setRka} notify={notify} />
      ),
      vendor: (
        <VendorPage vendors={vendors} setVendors={setVendors} notify={notify} />
      ),
      inbox: (
        <InboxPage
          user={user}
          packages={packages}
          rab={rab} tor={tor} bast={bast} pakta={pakta}
          onUpdatePackage={updatePackage}
          notify={notify}
        />
      ),
      "inbox-evaluasi": (
        <InboxEvaluasiPage
          user={user}
          evaluasiList={evaluasi}
          onUpdateEvaluasi={updateEvaluasi}
          notify={notify}
        />
      ),
      "asman-dashboard": (
        <AsmanDashboard user={user} packages={packages} evaluasiList={evaluasi} goto={setActive} />
      ),
      "madm-dashboard": (
        <MadmDashboard user={user} packages={packages} evaluasiList={evaluasi} goto={setActive} />
      ),
      "paket-kas": (
        <KasPackagesPage
          rab={rab} tor={tor} bast={bast} pakta={pakta}
          packages={packages}
          onUpsertPackage={upsertPackage}
          notify={notify}
          goto={setActive}
        />
      ),
      "user-mgmt": (
        <UserManagementPage
          users={users}
          setUsers={setUsers}
          notify={notify}
        />
      ),
      dokumentasi: <DokumentasiPage rab={rab} notify={notify} />,
      "daftar-hadir": <DaftarHadirPage rab={rab} notify={notify} />,
      eviden: <EvidenPage rab={rab} notify={notify} />,
      "checklist-dokumen": <ChecklistDokumenPage rab={rab} tor={tor} bast={bast} pakta={pakta} notify={notify} />,
      "proposal-evaluasi-pembayaran": (
        <ProposalEvaluasiPage
          proposals={proposals}
          evaluasiList={evaluasi}
          setEvaluasiList={setEvaluasi}
          notify={notify}
        />
      ),
      "form-verifikasi": <FormVerifikasiPage rab={rab} notify={notify} />,
      "lampiran-1": <Lampiran1Page rab={rab} notify={notify} />,
      "lampiran-2": <Lampiran2Page rab={rab} notify={notify} />,
      history: <HistoryPage history={history} />,
      panduan: <Panduan />,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      user,
      rab, tor, bast, pakta, bapp, laporan, vendors, history,
      proposals, konten, evaluasi, rabIdOptions, packages, users, rka,
    ]
  );

  if (!portal) {
    return <LandingGateway onSelect={setPortal} />;
  }

  if (portal === "silapak") {
    if (!silapakLoggedIn) {
      return (
        <SilapakLogin
          authenticate={authenticate}
          onLogin={() => setSilapakLoggedIn(true)}
          onBack={() => setPortal(null)}
        />
      );
    }
    return (
      <SilapakApp
        onLogout={() => {
          setSilapakLoggedIn(false);
          setPortal(null);
        }}
      />
    );
  }

  if (portal === "mitra") {
    if (!mitraLoggedIn) {
      return (
        <MitraLogin
          authenticate={authenticate}
          onLogin={(u) => {
            setMitraUser(u);
            setMitraLoggedIn(true);
          }}
          onBack={() => setPortal(null)}
        />
      );
    }
    return (
      <>
        <MitraApp
          mitraList={mitraList}
          setMitraList={setMitraList}
          notify={notify}
          onBackToPortal={() => {
            setMitraLoggedIn(false);
            setMitraUser(null);
            setPortal(null);
          }}
          user={mitraUser}
          onLogout={() => {
            setMitraLoggedIn(false);
            setMitraUser(null);
          }}
        />
        <Toast toast={toast} />
      </>
    );
  }

  if (!user)
    return (
      <LoginScreen
        authenticate={authenticate}
        onBack={() => setPortal(null)}
        onLogin={(u) => {
          setUser(u);
          setActive(u.role === "humas" ? "dashboard" : u.role === "madm" ? "madm-dashboard" : "asman-dashboard");
        }}
      />
    );

  const activeLabel = MENU.find((m) => m.key === active)?.label || "";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: T.bg,
        fontFamily: font.body,
        color: T.text,
      }}
    >
      <Sidebar
        active={active}
        onSelect={setActive}
        user={user}
        onLogout={() => setUser(null)}
        onBackToPortal={handleBackToPortal}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        themeMode={themeMode}
        onToggleTheme={() =>
          setThemeMode((m) => (m === "dark" ? "light" : "dark"))
        }
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <Topbar
          activeLabel={activeLabel}
          user={user}
          onHelpClick={() => setHelpOpen(true)}
          themeMode={themeMode}
          onToggleTheme={() =>
            setThemeMode((m) => (m === "dark" ? "light" : "dark"))
          }
        />
        <div
          key={active}
          className="app-content"
          style={{
            width: "100%",
            maxWidth: 1240,
            margin: "0 auto",
            animation: "fade-in .2s ease",
          }}
        >
          {modules[active]}
        </div>
      </div>
      <Toast toast={toast} />
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onGotoPanduan={() => setActive("panduan")}
      />
    </div>
  );
}
