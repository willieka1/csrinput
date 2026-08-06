import { useMemo, useState } from "react";
import { BarChart3, PieChart } from "lucide-react";
import { T, font } from "../../lib/theme";
import { OPT } from "../../lib/data";
import { rupiah } from "../../lib/utils";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";

const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
const BAR_COLORS = ["#0A2A50", "#2E6FDB", "#E6A700", "#1E7F3E", "#9B4DCA", "#C4432B"];

/**
 * Rumus mengikuti sheet "Rekap anggaran" pada file Excel yang diacu:
 * - Anggaran  = SUMIFS RKA (jenis kegiatan CSR + tahun)
 * - Realisasi per bulan = SUM total evaluasi RAB yang terhubung ke Laporan
 *   dengan tanggal kegiatan di bulan itu, dikelompokkan per jenis kegiatan CSR
 * - Jumlah Realisasi = SUM(realisasi 12 bulan)
 * - Saldo Anggaran = Anggaran - Jumlah Realisasi
 * - Penyerapan (%) = Jumlah Realisasi / Anggaran
 */
function useRekapData(rka, rab, laporan, tahun) {
  return useMemo(() => {
    const rabById = new Map(rab.map((r) => [r.idNumber, r]));

    return OPT.jenisKegiatanCsr.map((kegiatan) => {
      const anggaran = rka
        .filter((r) => r.expenditureType === kegiatan && r.tahun === tahun)
        .reduce((s, r) => s + (Number(r.jumlahRka) || 0), 0);

      const monthly = Array(12).fill(0);
      laporan.forEach((lp) => {
        const linkedRab = rabById.get(lp.id);
        if (!linkedRab || linkedRab.jenisKegiatanCsr !== kegiatan) return;
        if (!lp.tanggalKegiatan) return;
        const d = new Date(`${lp.tanggalKegiatan}T00:00:00`);
        if (Number.isNaN(d.getTime()) || d.getFullYear() !== tahun) return;
        monthly[d.getMonth()] += Number(linkedRab.totalEvaluasi) || 0;
      });

      const jumlahRealisasi = monthly.reduce((s, v) => s + v, 0);
      const saldo = anggaran - jumlahRealisasi;
      const penyerapan = anggaran > 0 ? jumlahRealisasi / anggaran : 0;

      return { kegiatan, anggaran, monthly, jumlahRealisasi, saldo, penyerapan };
    });
  }, [rka, rab, laporan, tahun]);
}

export default function RekapAnggaranPage({ rka, rab, laporan }) {
  const [tahun, setTahun] = useState(THIS_YEAR);
  const rows = useRekapData(rka, rab, laporan, tahun);

  const totalAnggaran = rows.reduce((s, r) => s + r.anggaran, 0);
  const totalRealisasi = rows.reduce((s, r) => s + r.jumlahRealisasi, 0);
  const totalSaldo = totalAnggaran - totalRealisasi;
  const totalPenyerapan = totalAnggaran > 0 ? totalRealisasi / totalAnggaran : 0;

  const hasAnyData = rows.some((r) => r.anggaran > 0 || r.jumlahRealisasi > 0);

  return (
    <div>
      <PageHeader
        eyebrow="Rekapitulasi Realisasi Anggaran"
        title="Rekap Anggaran"
        description="Ringkasan anggaran vs realisasi CSR per jenis kegiatan, dihitung otomatis dari data RKA dan Laporan Realisasi."
        right={
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: T.inputBg,
              color: T.text,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>Tahun {y}</option>
            ))}
          </select>
        }
      />

      {!hasAnyData ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            label={`Belum ada data anggaran/realisasi untuk tahun ${tahun}`}
            hint="Tambahkan RKA di menu RKA, dan pastikan RAB sudah diberi Jenis Kegiatan CSR serta ada Laporan Realisasi yang terhubung."
          />
        </Card>
      ) : (
        <>
          {/* Ringkasan total */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
            <SummaryTile label="Total Anggaran" value={rupiah(totalAnggaran)} tone={T.navy} />
            <SummaryTile label="Total Realisasi" value={rupiah(totalRealisasi)} tone={T.blue} />
            <SummaryTile label="Saldo Anggaran" value={rupiah(totalSaldo)} tone={totalSaldo >= 0 ? T.success : T.danger} />
            <SummaryTile label="Penyerapan" value={`${(totalPenyerapan * 100).toFixed(1)}%`} tone={T.yellowText || "#8A6D00"} />
          </div>

          {/* Chart: bar Anggaran vs Realisasi per kegiatan + donut penyerapan */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 16 }}>
            <Card>
              <ChartTitle icon={BarChart3}>Anggaran vs Realisasi per Kegiatan</ChartTitle>
              <BudgetBarChart rows={rows} />
            </Card>
            <Card>
              <ChartTitle icon={PieChart}>Penyerapan Keseluruhan</ChartTitle>
              <DonutChart value={totalPenyerapan} />
            </Card>
          </div>

          {/* Tabel rinci per kegiatan x bulan */}
          <Card padded={false}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ ...th, textAlign: "left", minWidth: 220 }}>Kegiatan</th>
                    <th style={{ ...th, minWidth: 110 }}>Anggaran</th>
                    {MONTHS.map((m) => (
                      <th key={m} style={th}>{m}</th>
                    ))}
                    <th style={{ ...th, minWidth: 110 }}>Jml Realisasi</th>
                    <th style={{ ...th, minWidth: 110 }}>Saldo</th>
                    <th style={{ ...th, minWidth: 80 }}>Penyerapan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.kegiatan} style={{ background: i % 2 ? T.rowAlt : T.card }}>
                      <td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{r.kegiatan}</td>
                      <td style={td}>{rupiah(r.anggaran)}</td>
                      {r.monthly.map((v, mi) => (
                        <td key={mi} style={{ ...td, color: v ? T.text : T.muted }}>
                          {v ? rupiah(v) : "-"}
                        </td>
                      ))}
                      <td style={{ ...td, fontWeight: 700 }}>{rupiah(r.jumlahRealisasi)}</td>
                      <td style={{ ...td, color: r.saldo >= 0 ? T.success : T.danger, fontWeight: 700 }}>
                        {rupiah(r.saldo)}
                      </td>
                      <td style={td}>
                        <PenyerapanBadge value={r.penyerapan} />
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: T.blueSoft, fontWeight: 700 }}>
                    <td style={{ ...td, textAlign: "left" }}>JUMLAH</td>
                    <td style={td}>{rupiah(totalAnggaran)}</td>
                    {Array.from({ length: 12 }, (_, mi) => (
                      <td key={mi} style={td}>
                        {rupiah(rows.reduce((s, r) => s + r.monthly[mi], 0))}
                      </td>
                    ))}
                    <td style={td}>{rupiah(totalRealisasi)}</td>
                    <td style={{ ...td, color: totalSaldo >= 0 ? T.success : T.danger }}>{rupiah(totalSaldo)}</td>
                    <td style={td}><PenyerapanBadge value={totalPenyerapan} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: 12,
      background: T.card,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${tone}`,
    }}>
      <div style={{ fontSize: 10.5, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: font.display, fontSize: 19, color: T.heading, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function ChartTitle({ icon: Icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontFamily: font.display, fontSize: 14.5, color: T.heading }}>
      <Icon size={16} color={T.blue} />
      {children}
    </div>
  );
}

function PenyerapanBadge({ value }) {
  const pct = value * 100;
  const color = pct >= 90 ? T.success : pct >= 50 ? "#8A6D00" : T.danger;
  const bg = pct >= 90 ? T.successSoft : pct >= 50 ? "#FFF4D0" : T.dangerSoft;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      background: bg, color, fontSize: 11, fontWeight: 700,
    }}>
      {pct.toFixed(1)}%
    </span>
  );
}

// ---------- Simple hand-rolled SVG charts (no chart library dependency) ----------

function BudgetBarChart({ rows }) {
  const maxVal = Math.max(1, ...rows.map((r) => Math.max(r.anggaran, r.jumlahRealisasi)));
  const chartH = 190;
  const barGroupW = 100 / rows.length;

  return (
    <div>
      <svg viewBox={`0 0 300 ${chartH + 30}`} width="100%" height={chartH + 30} preserveAspectRatio="xMidYMid meet">
        {rows.map((r, i) => {
          const gx = i * (300 / rows.length);
          const gw = 300 / rows.length;
          const bw = gw * 0.28;
          const hAnggaran = maxVal ? (r.anggaran / maxVal) * chartH : 0;
          const hRealisasi = maxVal ? (r.jumlahRealisasi / maxVal) * chartH : 0;
          return (
            <g key={r.kegiatan}>
              <rect x={gx + gw * 0.18} y={chartH - hAnggaran} width={bw} height={hAnggaran} fill={T.border} rx={2} />
              <rect x={gx + gw * 0.54} y={chartH - hRealisasi} width={bw} height={hRealisasi} fill={BAR_COLORS[i % BAR_COLORS.length]} rx={2} />
              <text x={gx + gw / 2} y={chartH + 14} fontSize="7" fill={T.muted} textAnchor="middle">
                {`Kegiatan ${i + 1}`}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4, fontSize: 11, color: T.muted }}>
        <LegendDot color={T.border} label="Anggaran" />
        <LegendDot color={T.blue} label="Realisasi" />
      </div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((r, i) => (
          <div key={r.kegiatan} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: BAR_COLORS[i % BAR_COLORS.length], flexShrink: 0 }} />
            <span style={{ color: T.text }}>Kegiatan {i + 1}: {r.kegiatan}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

function DonutChart({ value }) {
  const pct = Math.max(0, Math.min(1, value));
  const r = 54, cx = 70, cy = 70, stroke = 16;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;
  const color = pct >= 0.9 ? T.success : pct >= 0.5 ? "#E6A700" : T.danger;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.bg} strokeWidth={stroke} />
        <circle
          cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill={T.heading}>
          {(pct * 100).toFixed(0)}%
        </text>
      </svg>
      <div style={{ fontSize: 11.5, color: T.muted, marginTop: 8, textAlign: "center" }}>
        Realisasi terhadap total anggaran tahun berjalan
      </div>
    </div>
  );
}

const th = {
  padding: "9px 10px",
  background: T.bg,
  borderBottom: `1px solid ${T.border}`,
  color: T.muted,
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  textAlign: "center",
  whiteSpace: "nowrap",
};
const td = {
  padding: "9px 10px",
  borderBottom: `1px solid ${T.border}`,
  color: T.text,
  textAlign: "center",
  whiteSpace: "nowrap",
};
