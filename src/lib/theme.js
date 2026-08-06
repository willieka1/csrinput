export const font = {
  display: "var(--font-display)",
  body: "var(--font-body)",
  mono: "var(--font-mono)",
};

export const T = {
  bg: "var(--bg)",
  card: "var(--card)",
  inputBg: "var(--input-bg)",
  rowAlt: "var(--row-alt)",
  border: "var(--border)",
  text: "var(--text)",
  muted: "var(--muted)",
  heading: "var(--heading)",
  navy: "var(--navy)",
  blue: "var(--blue)",
  blueSoft: "var(--blue-soft)",
  danger: "var(--danger)",
  dangerSoft: "var(--danger-soft)",
  success: "var(--success)",
  successSoft: "var(--success-soft)",
  topbarBg: "var(--topbar-bg)",

  navyDeep: "#023244",
  yellow: "#F5C518",
  yellowDeep: "#D9AC00",
  yellowText: "#7A5C00",

  shadowSm: "var(--shadow-sm)",
  shadowMd: "var(--shadow-md)",
  shadowLg: "var(--shadow-lg)",
};

export function setTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
}
