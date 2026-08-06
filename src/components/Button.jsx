import { T, font } from "../lib/theme";

const VARIANTS = {
  primary: {
    background: T.navy,
    color: "#fff",
    boxShadow: "0 1px 2px rgba(10,42,80,0.15)",
    hover: T.navyDeep,
  },
  accent: {
    background: T.yellow,
    color: T.navyDeep,
    boxShadow: "0 1px 2px rgba(230,167,0,0.25)",
    hover: T.yellowDeep,
  },
  ghost: {
    background: T.card,
    color: T.heading,
    border: `1px solid ${T.border}`,
    hover: T.blueSoft,
  },
  danger: {
    background: T.dangerSoft,
    color: T.danger,
    hover: "#F5D7D0",
  },
  subtle: {
    background: T.bg,
    color: T.text,
    border: `1px solid ${T.border}`,
    hover: "#E7EBF1",
  },
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  icon: Icon,
  type = "button",
  disabled,
  style,
}) {
  const v = VARIANTS[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 42,
        padding: "0 18px",
        borderRadius: 10,
        fontFamily: font.body,
        fontWeight: 600,
        fontSize: 13.5,
        border: v.border || "1px solid transparent",
        background: v.background,
        color: v.color,
        boxShadow: v.boxShadow,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        whiteSpace: "nowrap",
        transition: "background-color .15s ease, box-shadow .15s ease, transform .1s ease",
        ...style,
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = v.hover)}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = v.background)}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => !disabled && (e.currentTarget.style.transform = "scale(1)")}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}
