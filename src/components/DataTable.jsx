import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { T, font } from "../lib/theme";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns,
  rows,
  emptyLabel,
  onRowClick,
  searchable = true,
  searchPlaceholder = "Cari data…",
  maxHeight,
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, columns]);

  return (
    <div>
      {searchable && rows.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 16px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div style={{ position: "relative", width: 280, maxWidth: "100%" }}>
            <Search
              size={14}
              color={T.muted}
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: "100%",
                boxSizing: "border-box",
                height: 40,
                padding: "0 12px 0 34px",
                borderRadius: 9,
                border: `1px solid ${T.border}`,
                background: T.bg,
                color: T.text,
                fontSize: 13,
                fontFamily: font.body,
                transition: "border-color .15s ease, box-shadow .15s ease",
              }}
              onFocus={(e) => { e.target.style.borderColor = T.blue; e.target.style.boxShadow = `0 0 0 3px ${T.blueSoft}`; }}
              onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <span style={{ fontSize: 12, color: T.muted, whiteSpace: "nowrap" }}>
            {filtered.length} dari {rows.length} baris
          </span>
        </div>
      )}

      {!filtered.length ? (
        <EmptyState
          label={rows.length ? "Tidak ada hasil yang cocok dengan pencarian." : emptyLabel}
        />
      ) : (
        <div
          style={{
            overflowX: "auto",
            overflowY: maxHeight ? "auto" : "visible",
            maxHeight: maxHeight || "none",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      background: T.bg,
                      borderBottom: `1px solid ${T.border}`,
                      color: T.muted,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      position: maxHeight ? "sticky" : "static",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.id || i}
                  onClick={() => onRowClick && onRowClick(r)}
                  style={{
                    cursor: onRowClick ? "pointer" : "default",
                    background: i % 2 ? T.rowAlt : T.card,
                    transition: "background-color .12s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.blueSoft)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = i % 2 ? T.rowAlt : T.card)
                  }
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        padding: "13px 16px",
                        borderBottom: `1px solid ${T.border}`,
                        color: T.text,
                      }}
                    >
                      {c.render ? c.render(r) : (r[c.key] ?? (
                        <span style={{ color: T.muted }}>-</span>
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
