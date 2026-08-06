import { useState } from "react";
import { ChevronLeft, LogOut, Moon, Sun } from "lucide-react";
import { T, font } from "../lib/theme";
import { MENU, MENU_GROUPS, ROLES } from "../lib/data";
import { roleInitials } from "../lib/utils";
import AutoLogo from "./AutoLogo";

function groupMenu(userRole, isAdmin) {
  const visible = MENU.filter((m) => {
    if (m.roles && !m.roles.includes(userRole)) return false;
    if (m.adminOnly && !isAdmin) return false;
    return true;
  });
  return MENU_GROUPS.map((g) => ({
    ...g,
    items: visible.filter((m) => m.group === g.key),
  })).filter((g) => g.items.length > 0);
}

function RailTooltip({ label, visible }) {
  if (!visible) return null;
  return (
    <span
      style={{
        position: "absolute",
        left: "calc(100% + 10px)",
        top: "50%",
        transform: "translateY(-50%)",
        background: T.heading,
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: font.body,
        padding: "6px 10px",
        borderRadius: 7,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 60,
        boxShadow: T.shadowMd,
      }}
    >
      {label}
    </span>
  );
}

export default function Sidebar({
  active,
  onSelect,
  user,
  onLogout,
  onBackToPortal,
  collapsed,
  setCollapsed,
  themeMode,
  onToggleTheme,
}) {
  const groups = groupMenu(user.role, user.isAdmin);
  const flatItems = groups.flatMap((g) => g.items);
  const [hoveredKey, setHoveredKey] = useState(null);

  return (
    <div
      style={{
        padding: "16px 0 16px 16px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: collapsed ? 68 : 252,
          height: "calc(100vh - 32px)",
          background: T.card,
          borderRadius: 24,
          border: `1px solid ${T.border}`,
          boxShadow: "0 4px 18px rgba(3,91,113,0.07)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width .2s ease",
        }}
      >
        {collapsed ? (
          /* ================= RAIL (collapsed) — flat, rapat, gak ada gap antar grup ================= */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", padding: "14px 0" }}>
            <button
              onClick={() => setCollapsed(false)}
              title="Buka sidebar"
              style={{
                width: 36, height: 36, borderRadius: 12,
                border: `1px solid ${T.border}`, background: T.bg,
                color: T.muted, cursor: "pointer",
                display: "grid", placeItems: "center",
                marginBottom: 16, flexShrink: 0,
                transition: "background-color .15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.blueSoft)}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.bg)}
            >
              <ChevronLeft size={15} style={{ transform: "rotate(180deg)" }} />
            </button>

            <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, overflowY: "auto", padding: "0 10px" }}>
              {flatItems.map((m) => {
                const Icon = m.icon;
                const isActive = active === m.key;
                return (
                  <div key={m.key} style={{ position: "relative", width: "100%" }}>
                    <button
                      onClick={() => onSelect(m.key)}
                      onMouseEnter={() => setHoveredKey(m.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      aria-label={m.label}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        borderRadius: 13,
                        border: "none",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        background: isActive ? T.navy : "transparent",
                        color: isActive ? "#fff" : T.muted,
                        transition: "background-color .15s ease, color .15s ease",
                      }}
                      onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = T.blueSoft; }}
                      onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <Icon size={17} />
                    </button>
                    <RailTooltip label={m.label} visible={hoveredKey === m.key} />
                  </div>
                );
              })}
            </div>

            <button
              onClick={onLogout}
              title="Keluar"
              aria-label="Keluar"
              style={{
                width: 36, height: 36, borderRadius: 12,
                border: "none", background: "transparent",
                color: T.muted, cursor: "pointer",
                display: "grid", placeItems: "center",
                marginTop: 10, flexShrink: 0,
                transition: "background-color .15s ease, color .15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.dangerSoft; e.currentTarget.style.color = T.danger; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.muted; }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          /* ================= PANEL (expanded) ================= */
          <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "16px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingLeft: 2 }}>
              <button
                onClick={() => setCollapsed(true)}
                title="Tutup sidebar"
                style={{
                  width: 26, height: 26, borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.bg,
                  color: T.muted, cursor: "pointer",
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}
              >
                <ChevronLeft size={13} />
              </button>
              <div style={{ fontFamily: font.display, fontSize: 13.5, fontWeight: 700, color: T.heading, flex: 1 }}>
                SIKAS PLN
              </div>
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  title={themeMode === "dark" ? "Mode Terang" : "Mode Gelap"}
                  style={{
                    width: 26, height: 26, borderRadius: 8,
                    border: `1px solid ${T.border}`, background: T.bg,
                    color: T.muted, cursor: "pointer",
                    display: "grid", placeItems: "center", flexShrink: 0,
                  }}
                >
                  {themeMode === "dark" ? <Moon size={13} /> : <Sun size={13} />}
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 8px", background: T.bg, borderRadius: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <AutoLogo alt="Logo PLN" style={{ width: 20, height: 20, objectFit: "contain" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: T.heading, fontFamily: font.body, fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>
                  Sistem Informasi Kas
                </div>
                <div style={{ color: T.muted, fontSize: 10, fontFamily: font.body }}>
                  PLN Indonesia Power
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 16 }}>
              {groups.map((g) => (
                <div key={g.key}>
                  <div style={{
                    fontFamily: font.body, fontSize: 10.5, fontWeight: 700,
                    letterSpacing: 0.8, color: "#A9B3B6", textTransform: "uppercase",
                    padding: "0 8px 6px",
                  }}>
                    {g.label}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {g.items.map((m) => {
                      const Icon = m.icon;
                      const isActive = active === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => onSelect(m.key)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8.5px 10px",
                            borderRadius: 10,
                            border: "none",
                            cursor: "pointer",
                            background: isActive ? T.navy : "transparent",
                            color: isActive ? "#fff" : T.text,
                            fontWeight: isActive ? 600 : 500,
                            fontSize: 13.2,
                            fontFamily: font.body,
                            textAlign: "left",
                            transition: "background-color .15s ease, color .15s ease",
                          }}
                          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = T.blueSoft; }}
                          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                        >
                          <Icon size={15} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {onBackToPortal && (
              <button
                onClick={onBackToPortal}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                  background: T.bg,
                  color: T.muted,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: font.body,
                }}
              >
                Kembali ke Portal
              </button>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", background: T.navy, color: "#fff",
                display: "grid", placeItems: "center", fontFamily: font.display, fontWeight: 700, fontSize: 11, flexShrink: 0,
              }}>
                {roleInitials(user.role)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.heading, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.username || "User"}
                </div>
                <div style={{ fontSize: 10, color: T.muted }}>
                  {ROLES.find((r) => r.value === user.role)?.label}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Keluar"
                aria-label="Keluar"
                style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: 8,
                  display: "grid", placeItems: "center",
                  border: "none", background: "transparent", color: T.muted, cursor: "pointer",
                  transition: "background-color .15s ease, color .15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.dangerSoft; e.currentTarget.style.color = T.danger; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.muted; }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
