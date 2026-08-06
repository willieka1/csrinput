import jsPDF from "jspdf";
import fallbackLogo from "../assets/pln-priok-logo.svg";
import { rupiah } from "./utils";

const PAGE = { w: 210, h: 297 };
const MARGIN = 18;
const LOGO_CANDIDATES = ["/logo.png", "/logo.jpg", "/logo.jpeg"];

let cachedLogoData = null;

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function toDataUrl(src) {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || 512;
  canvas.height = img.naturalHeight || 512;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    aspect: canvas.width / canvas.height,
  };
}

async function resolveLogoData() {
  if (cachedLogoData) return cachedLogoData;
  for (const src of LOGO_CANDIDATES) {
    try {
      cachedLogoData = await toDataUrl(src);
      return cachedLogoData;
    } catch {
      /* try next */
    }
  }
  try {
    cachedLogoData = await toDataUrl(fallbackLogo);
    return cachedLogoData;
  } catch {
    cachedLogoData = null;
    return null;
  }
}

export async function generateSikasPdf({
  title,
  subtitle,
  rows,
  sections,
  table,
  filename,
}) {
  const doc = new jsPDF({ format: "a4", unit: "mm", orientation: "portrait" });

  const logo = await resolveLogoData();
  if (logo) {
    const maxW = 32;
    const maxH = 22;
    let w = maxW;
    let h = maxW / logo.aspect;
    if (h > maxH) {
      h = maxH;
      w = maxH * logo.aspect;
    }
    doc.addImage(logo.dataUrl, "PNG", PAGE.w - MARGIN - w, MARGIN - 4, w, h);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("PLN INDONESIA POWER · UBP PRIOK", MARGIN, MARGIN);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("SIKAS - Sistem Informasi Kas", MARGIN, MARGIN + 4);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20);
  doc.text(title, PAGE.w / 2, MARGIN + 22, { align: "center" });

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90);
    doc.text(subtitle, PAGE.w / 2, MARGIN + 28, { align: "center" });
  }

  doc.setDrawColor(200);
  doc.line(MARGIN, MARGIN + 34, PAGE.w - MARGIN, MARGIN + 34);

  let y = MARGIN + 42;

  const drawRow = (label, value) => {
    if (y > PAGE.h - 60) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(String(label).toUpperCase(), MARGIN, y);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20);
    const text = value == null || value === "" ? "-" : String(value);
    const wrapped = doc.splitTextToSize(text, PAGE.w - MARGIN * 2 - 60);
    doc.text(wrapped, MARGIN + 60, y);
    y += Math.max(7, wrapped.length * 5 + 2);
  };

  const drawSectionHeader = (label) => {
    if (y > PAGE.h - 60) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(14, 76, 146);
    doc.text(String(label).toUpperCase(), MARGIN, y);
    doc.setDrawColor(220);
    doc.line(MARGIN, y + 1.5, PAGE.w - MARGIN, y + 1.5);
    y += 8;
  };

  if (sections && sections.length) {
    for (const section of sections) {
      drawSectionHeader(section.label);
      for (const [label, value] of section.items) {
        if (value == null || value === "") continue;
        drawRow(label, Array.isArray(value) ? value.join(", ") : value);
      }
      y += 3;
    }
  } else if (rows && rows.length) {
    for (const [label, value] of rows) {
      if (value == null || value === "") continue;
      drawRow(label, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  if (table && table.length) {
    if (y > PAGE.h - 100) {
      doc.addPage();
      y = MARGIN;
    }
    y += 4;
    drawSectionHeader("Rincian Item");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120);
    const cols = ["Uraian", "Qty", "Harga", "Total", "Total Evaluasi"];
    const xs = [MARGIN, 100, 118, 140, 168];
    cols.forEach((c, i) => doc.text(c, xs[i], y));
    y += 4;
    doc.setDrawColor(220);
    doc.line(MARGIN, y, PAGE.w - MARGIN, y);
    y += 3;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20);
    doc.setFontSize(8.5);
    for (const item of table) {
      if (y > PAGE.h - 60) {
        doc.addPage();
        y = MARGIN;
      }
      const uraian = doc.splitTextToSize(String(item.uraian || "-"), 75);
      doc.text(uraian, xs[0], y);
      doc.text(String(item.qty || 0), xs[1], y);
      doc.text(rupiah(item.harga || 0), xs[2], y);
      doc.text(rupiah(item.total || 0), xs[3], y);
      doc.text(rupiah(item.totalEvaluasi || 0), xs[4], y);
      y += Math.max(5, uraian.length * 4);
    }
    y += 4;
  }

  const sigY = Math.max(y + 20, PAGE.h - 55);
  const boxW = (PAGE.w - MARGIN * 2 - 20) / 2;

  doc.setDrawColor(180);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Jakarta, ${today}`, PAGE.w - MARGIN, sigY - 6, { align: "right" });

  const drawSignatureBlock = (x, label) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    doc.setFontSize(9.5);
    doc.text(label, x, sigY);
    doc.setFont("helvetica", "normal");
    doc.setDrawColor(180);
    doc.line(x, sigY + 24, x + boxW, sigY + 24);
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("Nama    :", x, sigY + 30);
    doc.text("Jabatan :", x, sigY + 36);
  };

  drawSignatureBlock(MARGIN, "Menyetujui,");
  drawSignatureBlock(MARGIN + boxW + 20, "Mengetahui,");

  doc.setFontSize(7.5);
  doc.setTextColor(140);
  doc.text(
    `Dicetak: ${new Date().toLocaleString("id-ID")} - SIKAS`,
    MARGIN,
    PAGE.h - 8
  );

  doc.save(`${filename}.pdf`);
}

export function rowsFromFields(fields, values) {
  return fields
    .filter((f) => values[f.key] != null && values[f.key] !== "")
    .map((f) => [f.label, values[f.key]]);
}

// PDF Form Evaluasi — layoutnya niru template Excel resminya: header
// ID/Pemohon/Perihal/Penilai/Tanggal, tabel kategori penilaian dengan bobot
// & total skor, skor akhir, keputusan otomatis, dan catatan.
const EVAL_NILAI_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];

export async function generateEvaluasiPdf({
  id, pemohon, perihal, penilai, tanggal,
  perKategori, skorAkhir, keputusan, catatan, filename,
}) {
  const doc = new jsPDF({ format: "a4", unit: "mm", orientation: "landscape" });
  const pw = 297, ph = 210, m = 14;

  const logo = await resolveLogoData();
  if (logo) {
    const maxW = 26, maxH = 16;
    let w = maxW, h = maxW / logo.aspect;
    if (h > maxH) { h = maxH; w = maxH * logo.aspect; }
    doc.addImage(logo.dataUrl, "PNG", m, m - 4, w, h);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text("LEMBAR EVALUASI BANTUAN TJSL", pw / 2, m + 4, { align: "center" });
  doc.setDrawColor(200);
  doc.line(m, m + 10, pw - m, m + 10);

  let y = m + 18;
  const headerRow = (label, value, x, w) => {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(label.toUpperCase(), x, y);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text(String(value || "-"), x, y + 4.5, { maxWidth: w });
  };
  headerRow("ID Pengajuan", id, m, 90);
  headerRow("Penilai", penilai, m + 150, 90);
  y += 10;
  headerRow("Pemohon", pemohon, m, 90);
  headerRow("Tanggal", tanggal, m + 150, 90);
  y += 10;
  headerRow("Perihal", perihal, m, pw - m * 2);
  y += 12;

  // Grid nilai — kolom NO | KATEGORI | 12 kolom nilai (0.25 s/d 3, ditandai X) | BOBOT | TOTAL
  const colNo = m, wNo = 8;
  const colKategori = colNo + wNo, wKategori = 62;
  const colNilaiStart = colKategori + wKategori, wNilai = 13.5;
  const colBobot = colNilaiStart + wNilai * EVAL_NILAI_OPTIONS.length, wBobot = 14;
  const colTotal = colBobot + wBobot, wTotal = 16;
  const tableRight = colTotal + wTotal;
  const rowH = 9;

  const drawHeader = () => {
    doc.setFillColor(230, 236, 245);
    doc.rect(m, y, tableRight - m, rowH, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    doc.text("NO", colNo + 2, y + 6);
    doc.text("KATEGORI PENILAIAN", colKategori + 2, y + 6);
    EVAL_NILAI_OPTIONS.forEach((n, i) => {
      doc.text(String(n), colNilaiStart + i * wNilai + wNilai / 2, y + 6, { align: "center" });
    });
    doc.text("BOBOT", colBobot + wBobot / 2, y + 6, { align: "center" });
    doc.text("TOTAL", colTotal + wTotal / 2, y + 6, { align: "center" });
    doc.setDrawColor(180);
    doc.rect(m, y, tableRight - m, rowH);
    y += rowH;
  };
  drawHeader();

  doc.setFont("helvetica", "normal");
  (perKategori || []).forEach((k, i) => {
    if (y > ph - 55) { doc.addPage("a4", "landscape"); y = m; drawHeader(); }
    doc.setDrawColor(210);
    doc.rect(colNo, y, tableRight - colNo, rowH);
    // garis pemisah tiap kolom nilai
    for (let c = 0; c <= EVAL_NILAI_OPTIONS.length; c++) {
      doc.line(colNilaiStart + c * wNilai, y, colNilaiStart + c * wNilai, y + rowH);
    }
    doc.line(colKategori, y, colKategori, y + rowH);
    doc.line(colBobot, y, colBobot, y + rowH);
    doc.line(colTotal, y, colTotal, y + rowH);

    doc.setFontSize(8);
    doc.setTextColor(60);
    doc.text(String(i + 1), colNo + 2, y + 6);
    const wrapped = doc.splitTextToSize(k.label, wKategori - 4);
    doc.text(wrapped[0], colKategori + 2, y + 6);

    EVAL_NILAI_OPTIONS.forEach((n, ci) => {
      if (k.nilai === n) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("X", colNilaiStart + ci * wNilai + wNilai / 2, y + 6, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
      }
    });

    doc.text(String(k.bobot), colBobot + wBobot / 2, y + 6, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(k.nilai ? k.totalSkor.toFixed(2) : "-", colTotal + wTotal / 2, y + 6, { align: "center" });
    doc.setFont("helvetica", "normal");
    y += rowH;
  });

  y += 5;
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20);
  doc.text(`Skor Akhir: ${(skorAkhir || 0).toFixed(2)}`, m, y);
  doc.text(`Keputusan: ${keputusan || "-"}`, m + 70, y);
  y += 9;

  if (catatan) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text("CATATAN", m, y);
    y += 4.5;
    doc.setFontSize(9);
    doc.setTextColor(30);
    const wrapped = doc.splitTextToSize(catatan, pw - m * 2);
    doc.text(wrapped, m, y);
    y += wrapped.length * 4.5 + 5;
  }

  doc.setFontSize(7);
  doc.setTextColor(140);
  doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")} - SIKAS`, m, ph - 8);

  doc.save(`${filename}.pdf`);
}