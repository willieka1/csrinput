import { OPT } from "./data";
import { rupiah } from "./utils";

export const proposalFields = () => () => [
  {
    key: "id",
    label: "ID Pengajuan Proposal",
    placeholder: "cth. PRP-2026-001",
    section: "Identitas Pengajuan",
  },
  { key: "tanggalMasuk", label: "Tanggal Masuk", type: "date" },
  { key: "namaLembaga", label: "Nama Instansi", full: true },
  { key: "judulProposal", label: "Judul Proposal/Kegiatan", full: true },

  {
    key: "tanggalKegiatan",
    label: "Tanggal Kegiatan",
    type: "date",
    section: "Detail Kegiatan",
  },
  { key: "lokasiKegiatan", label: "Alamat Lokasi Kegiatan" },
  {
    key: "program",
    label: "Program",
    type: "select",
    options: OPT.programHumas,
    full: true,
  },
  {
    key: "penerimaLakiLaki",
    label: "Jumlah Penerima Manfaat/Bantuan (Laki-laki)",
    type: "number",
  },
  {
    key: "penerimaPerempuan",
    label: "Jumlah Penerima Manfaat/Bantuan (Perempuan)",
    type: "number",
  },
  { key: "namaPenerimaManfaat", label: "Penerima Manfaat", full: true },

  {
    key: "nilaiDiajukan",
    label: "Jumlah Nominal yang Diajukan (Rp)",
    type: "number",
    section: "Anggaran & Item",
  },
  { key: "approvedBudget", label: "Nominal yang Disetujui (Rp)", type: "number" },
  { key: "itemDiminta", label: "Jumlah Barang yang Diajukan", type: "textarea", full: true },

  { key: "jabatanKontak", label: "Contact Person yang Dapat Dihubungi", section: "Kontak" },
  { key: "kontakPIC", label: "Nama Contact Person yang Dapat Dihubungi" },

  {
    key: "fileProposal",
    label: "File Proposal/Surat Permohonan Bantuan",
    type: "file-upload",
    section: "Lampiran",
  },
  { key: "dokumentasiKegiatan", label: "Dokumentasi Kegiatan", type: "file-upload" },
];

export const proposalAdminFields = () => [
  {
    key: "statusProposal",
    label: "Status Proposal",
    type: "select",
    options: OPT.statusProposal,
    section: "Status & Catatan",
  },
  { key: "catatanInternal", label: "Catatan Internal", type: "textarea", full: true },
];

export const bastStepFields = () => [
  { key: "tanggalBast", label: "Tanggal BAST", type: "date", section: "Berita Acara Serah Terima (BAST)" },
  { key: "namaPihakKedua", label: "Nama Pihak Kedua (Penerima)" },
  { key: "jabatanPihakKedua", label: "Jabatan Pihak Kedua (Penerima)" },
  {
    key: "uraianBantuan",
    label: "Uraian Bantuan/Fasilitasi",
    type: "textarea",
    full: true,
    hint: "otomatis dari Judul Proposal - bisa disesuaikan",
  },
];

export const paktaStepFields = () => [
  { key: "tanggalPi", label: "Tanggal PI", type: "date", section: "Pakta Integritas (PI)" },
  { key: "namaPenerima", label: "Nama Penerima (Penandatangan)" },
];

export const torFields = (rabIdOptions) => (_opsi, _values, _autoFrom) => [
  {
    key: "id",
    label: "ID TOR",
    type: "select",
    options: rabIdOptions,
    allowManual: true,
    hint: "pilih dari ID RAB yang sudah dibuat",
    section: "Identitas",
  },
  {
    key: "judulProgramRKA",
    label: "Judul Program RKA",
    type: "select",
    options: OPT.judulProgramRKA,
    full: true,
  },
  {
    key: "judulKegiatan",
    label: "Judul Kegiatan",
    disabled: true,
    hint: "otomatis dari ID RAB",
    full: true,
  },
  {
    key: "kategori",
    label: "Kategori",
    disabled: true,
    hint: "otomatis dari ID RAB - NON PO / Cash Card",
  },
  { key: "latarBelakang", label: "Latar Belakang", type: "textarea", section: "Latar Belakang", full: true },
  { key: "tujuanUmum", label: "a. Tujuan Umum", type: "textarea", section: "Tujuan", full: true },
  {
    key: "tujuanKhusus",
    label: "b. Tujuan Khusus",
    type: "textarea",
    full: true,
    hint: "satu poin per baris",
  },
  {
    key: "sasaran",
    label: "Sasaran",
    type: "textarea",
    full: true,
    section: "Sasaran",
    hint: "satu poin per baris",
  },
  { key: "hariTanggal", label: "a. Hari/Tanggal", type: "date", section: "Rencana Kegiatan" },
  { key: "tempat", label: "b. Tempat" },
  { key: "narasumber", label: "c. Narasumber", full: true },
];

export const bastFields = (rabIdOptions) => () => [
  {
    key: "id",
    label: "ID",
    type: "select",
    options: rabIdOptions,
    allowManual: true,
    section: "Identitas",
  },
  {
    key: "kategori",
    label: "Kategori",
    disabled: true,
    hint: "otomatis dari ID RAB - NON PO / Cash Card",
  },
  { key: "nomor", label: "Nomor" },
  { key: "judulBantuan", label: "Judul Bantuan", disabled: true, hint: "otomatis dari ID RAB" },
  { key: "tanggal", label: "Tanggal", type: "date" },
  { key: "namaPihakKedua", label: "Nama Pihak Kedua", section: "Pihak Kedua" },
  { key: "jabatanPihakKedua", label: "Jabatan Pihak Kedua" },
  { key: "instansiPihakKedua", label: "Instansi/Kedudukan Pihak Kedua" },
  {
    key: "jumlahBantuan",
    label: "Jumlah Bantuan",
    disabled: true,
    hint: "otomatis, Rp",
    full: true,
  },
];

export const paktaFields = (rabIdOptions) => () => [
  {
    key: "id",
    label: "ID",
    type: "select",
    options: rabIdOptions,
    allowManual: true,
    section: "Identitas",
  },
  {
    key: "kategori",
    label: "Kategori",
    disabled: true,
    hint: "otomatis dari ID RAB - NON PO / Cash Card",
  },
  { key: "judulBantuan", label: "Judul Bantuan", disabled: true, hint: "otomatis dari ID RAB" },
  { key: "tanggalPi", label: "Tanggal PI", type: "date" },
  {
    key: "lembagaPenerima",
    label: "Lembaga Penerima Bantuan",
    full: true,
    section: "Data Penerima",
  },
  { key: "namaPenerima", label: "Nama Penerima" },
  { key: "jabatan", label: "Jabatan" },
];

export const laporanFields = (rabIdOptions) => (opsi) => [
  {
    key: "id",
    label: `ID Laporan ${opsi || ""}`,
    type: "select",
    options: rabIdOptions,
    allowManual: true,
    section: "Identitas",
  },
  { key: "procost", label: "Procost", disabled: true, hint: "otomatis" },
  { key: "expType", label: "Exp. Type", disabled: true, hint: "otomatis" },
  { key: "judulProgram", label: "Judul Program", disabled: true, hint: "otomatis" },
  { key: "programInduk", label: "Program Induk", type: "select", options: OPT.programInduk },
  { key: "tpb", label: "TPB", type: "select", options: OPT.tpb },
  { key: "lembagaPemohon", label: "Lembaga Pemohon", full: true },

  { key: "namaBarang", label: "Nama Barang", section: "Detail Bantuan" },
  { key: "jumlahBarang", label: "Jumlah Barang", disabled: true, hint: "otomatis" },
  { key: "satuan", label: "Satuan", disabled: true, hint: "otomatis" },
  { key: "kuantifikasiBantuan", label: "Kuantifikasi Bantuan", type: "number" },
  { key: "satuanKuantifikasi", label: "Satuan Kuantifikasi Bantuan" },
  { key: "hargaTotal", label: "Harga Total", disabled: true, hint: "otomatis" },

  {
    key: "jumlahPenerima",
    label: "Jumlah Penerima Manfaat",
    type: "number",
    section: "Penerima Manfaat",
  },
  {
    key: "satuanPenerima",
    label: "Satuan Penerima Manfaat",
    type: "select",
    options: OPT.satuanPenerima,
  },
  {
    key: "namaInstansiPenerima",
    label: "Nama Instansi/Lembaga Penerima",
    full: true,
  },
  { key: "lakiLaki", label: "Laki-laki", type: "number" },
  { key: "perempuan", label: "Perempuan", type: "number" },

  {
    key: "lokasiPenerima",
    label: "Lokasi Penerima Manfaat",
    type: "select",
    options: OPT.ringLokasi,
    section: "Lokasi & Waktu",
  },
  { key: "idProvinsi", label: "ID Provinsi", type: "select", options: OPT.provinsi },
  { key: "idKabKota", label: "ID Kabupaten/Kota", type: "select", options: OPT.kabkota },
  { key: "bidang", label: "Bidang", disabled: true, hint: "otomatis" },
  { key: "subBidang", label: "Sub Bidang", disabled: true, hint: "otomatis" },
  { key: "kategoriBantuan", label: "Kategori Bantuan", disabled: true, hint: "otomatis" },
  { key: "tanggalKegiatan", label: "Tanggal Kegiatan", type: "date" },
  { key: "bulanKegiatan", label: "Bulan Kegiatan", type: "select", options: OPT.bulan },
  { key: "idRealisasi", label: "ID Realisasi", type: "select", options: OPT.realisasi },

  {
    key: "keterangan",
    label: "Keterangan",
    type: "select",
    options: OPT.kategori,
    section: "Lampiran & Keterangan",
  },
  { key: "nomorVerifikasi", label: "Nomor Verifikasi" },
  { key: "unit", label: "Unit", type: "select", options: OPT.unit },
  { key: "keteranganLain", label: "Keterangan Lain", type: "textarea", full: true },
  { key: "evidenceFoto", label: "Evidence Foto", type: "file" },
  { key: "linkDrive", label: "Link Google Drive", placeholder: "https://drive.google.com/…" },
];

// Fungsi map yang dipakai `autoFrom` untuk mengisi otomatis dari RAB.
export const autoFromRab = {
  tor: (r) => ({
    judulKegiatan: r.judulKegiatan,
    kategori: r.kategori,
  }),
  bast: (r) => ({
    judulBantuan: r.judulKegiatan,
    jumlahBantuan: rupiah(r.totalEvaluasi),
    kategori: r.kategori,
  }),
  pakta: (r) => ({
    judulBantuan: r.judulKegiatan,
    kategori: r.kategori,
  }),
  laporan: (r) => ({
    procost: r.procost,
    expType: r.expType,
    judulProgram: r.judulKegiatan,
    kategori: r.kategori || "",
    jumlahBarang: (r.items || []).length,
    hargaTotal: rupiah(r.totalEvaluasi),
    bidang: r.bidang,
    subBidang: r.subprogram,
    kategoriBantuan: r.kategoriProgram,
  }),
};

export const EVALUASI_NILAI_OPTIONS = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3,
];

export const evaluasiKategoriFields = () => [
  {
    key: "lokasiKegiatan",
    label: "Lokasi Kegiatan",
    bobot: 15,
    anchors: {
      tidakSignifikan: "Diluar wilayah perusahaan",
      netral: "Berada diwilayah operasi Perusahaan",
      signifikan: "Dekat unit pembangkit atau termasuk wilayah binaan Perusahaan",
    },
  },
  {
    key: "jenisProgram",
    label: "Jenis Program yang Diajukan",
    bobot: 20,
    anchors: {
      tidakSignifikan: "Tidak bertentangan dengan kebijakan Perusahaan",
      netral: "Sesuai dengan tujuan dan kebijakan Perusahaan",
      signifikan: "Ada dalam rencana kegiatan dan mendukung pencapaian tujuan Perusahaan",
    },
  },
  {
    key: "lembagaPemohon",
    label: "Lembaga Pemohon",
    bobot: 10,
    anchors: {
      tidakSignifikan: "Tidak berkaitan dengan bisnis perusahaan",
      netral: "Mitra Kerja yang tidak memiliki pengaruh",
      signifikan: "Berpengaruh thd operasi dan kinerja perusahaan",
    },
  },
  {
    key: "kualifikasiLembaga",
    label: "Kualifikasi Lembaga Pemohon",
    bobot: 5,
    anchors: {
      tidakSignifikan: "Tidak memiliki badan hukum namun memiliki kelengkapan organisasi",
      netral: "Memiliki badan hukum dan kelengkapan organisasi memadai",
      signifikan: "Memiliki badan hukum, kelengkapan organisasi memadai dgn reputasi yang baik",
    },
  },
  {
    key: "penerimaManfaatKegiatan",
    label: "Penerima Manfaat Kegiatan",
    bobot: 15,
    anchors: {
      tidakSignifikan: "Lembaga Pemohon",
      netral: "Kelompok Binaan dan Masyarakat Luas",
      signifikan: "Lembaga Pemohon, Kelompok Binaan dan Masyarakat Luas serta keluarga karyawan/personil PLN",
    },
  },
  {
    key: "jumlahPenerimaManfaat",
    label: "Jumlah Penerima Manfaat",
    bobot: 5,
    anchors: {
      tidakSignifikan: "<10 Orang",
      netral: "10-100 Orang",
      signifikan: ">100 Orang",
    },
  },
  {
    key: "partisipasiBantuan",
    label: "Partisipasi Bantuan",
    bobot: 5,
    anchors: {
      tidakSignifikan: "Sepenuhnya dibebankan kepada Perusahaan atau lebih besar dari investasi lembaga pemohon",
      netral: "Bantuan yang diminta sama besar dengan investasi lembaga pemohon",
      signifikan: "Bantuan yang diminta lebih kecil dari investasi lembaga pemohon",
    },
  },
  {
    key: "nilaiManfaat",
    label: "Nilai Manfaat",
    bobot: 15,
    anchors: {
      tidakSignifikan: "sesaat hanya pada saat kegiatan dilaksanakan",
      netral: "Bermanfaat untuk jangka waktu tertentu",
      signifikan: "Bermanfaat bagi pengembangan modal usaha dan pengembangan ke arah yang berkelanjutan",
    },
  },
  {
    key: "publikasi",
    label: "Publikasi",
    bobot: 10,
    anchors: {
      tidakSignifikan: "Kurang potensial untuk dipublikasikan",
      netral: "Publikasi regional dan lokal",
      signifikan: "Publikasi internasional dan nasional",
    },
  },
];
