import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { T, font } from "../lib/theme";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseDateStr(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function displayLabel(s) {
  const d = parseDateStr(s);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}
function buildGrid(viewYear, viewMonth) {
  const first = new Date(viewYear, viewMonth, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

/**
 * Kalender custom (full React, tanpa popup native browser) — dipakai sebagai
 * pengganti <input type="date"> supaya tidak kena bug Chrome di mana native
 * date-picker bisa "nyangkut" kebuka ulang terus-menerus di dalam Modal.
 * value/onChange pakai format string "YYYY-MM-DD", drop-in replacement.
 */
export default function DatePicker({ value, onChange, placeholder = "Pilih tanggal", disabled }) {
  const [open, setOpen] = useState(false);
  const selected = parseDateStr(value);
  const [viewDate, setViewDate] = useState(() => selected || new Date());
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const recalcPos = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const panelWidth = 268;
    let left = r.left;
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelWidth - 8);
    }
    setPos({ top: r.bottom + 6, left, width: r.width });
  };

  useLayoutEffect(() => {
    if (open) recalcPos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", recalcPos, true);
    window.addEventListener("resize", recalcPos);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", recalcPos, true);
      window.removeEventListener("resize", recalcPos);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    if (!open) setViewDate(selected || new Date());
    setOpen((o) => !o);
  };
  const pick = (d) => { onChange(toDateStr(d)); setOpen(false); };

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const grid = buildGrid(viewYear, viewMonth);
  const todayStr = toDateStr(new Date());
  const goMonth = (delta) => setViewDate(new Date(viewYear, viewMonth + delta, 1));

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        ref={btnRef}
        onClick={toggle}
        disabled={disabled}
        style={{
          width: "100%", boxSizing: "border-box",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 12px", borderRadius: 8,
          border: `1px solid ${T.border}`,
          background: disabled ? T.bg : T.inputBg,
          color: value ? T.text : T.muted,
          fontSize: 13, fontFamily: "inherit", textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <span>{value ? displayLabel(value) : placeholder}</span>
        <Calendar size={15} color={disabled ? T.muted : T.blue} style={{ flexShrink: 0 }} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed", zIndex: 1000, top: pos.top, left: pos.left,
              width: 268, background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 12, boxShadow: T.shadowLg, padding: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <button type="button" onClick={() => goMonth(-1)} style={navBtnStyle} aria-label="Bulan sebelumnya">
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontFamily: font.display, fontSize: 13.5, color: T.heading }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={() => goMonth(1)} style={navBtnStyle} aria-label="Bulan berikutnya">
                <ChevronRight size={15} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
              {WEEKDAYS.map((w) => (
                <div key={w} style={{ textAlign: "center", fontSize: 10.5, color: T.muted, fontFamily: font.mono, padding: "4px 0" }}>
                  {w}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {grid.map((d, i) => {
                const dStr = toDateStr(d);
                const inMonth = d.getMonth() === viewMonth;
                const isSelected = dStr === value;
                const isToday = dStr === todayStr;
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => pick(d)}
                    style={{
                      aspectRatio: "1", borderRadius: 7,
                      border: isToday && !isSelected ? `1px solid ${T.blue}` : "1px solid transparent",
                      background: isSelected ? T.navy : "transparent",
                      color: isSelected ? "#fff" : inMonth ? T.text : T.muted,
                      opacity: inMonth ? 1 : 0.45,
                      fontSize: 12.5, fontFamily: font.body,
                      fontWeight: isSelected || isToday ? 700 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} style={linkBtnStyle}>
                Bersihkan
              </button>
              <button type="button" onClick={() => pick(new Date())} style={{ ...linkBtnStyle, color: T.blue }}>
                Hari ini
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

const navBtnStyle = {
  width: 26, height: 26, borderRadius: 7,
  border: `1px solid ${T.border}`, background: T.bg, color: T.text,
  display: "grid", placeItems: "center", cursor: "pointer",
};
const linkBtnStyle = {
  border: "none", background: "transparent", color: T.muted,
  fontSize: 12, fontFamily: font.body, cursor: "pointer", padding: 0,
};
