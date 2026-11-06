import StockFlowLogo from "./StockFlowLogo";

/**
 * Full StockFlow lockup: logo tile + "StockFlow" wordmark + Khmer "ស្តុក" + "STOCK MANAGEMENT".
 * `size` is the logo tile in px; everything else scales from it.
 * `light` is for dark / purple backgrounds.
 */
export default function StockFlowLockup({ size = 96, light = false }: { size?: number; light?: boolean }) {
  const ink = light ? "#FFFFFF" : "#16121F";
  const khmer = light ? "#DDD6FE" : "#6D28D9";
  const rule = light ? "rgba(255,255,255,.4)" : "#C4B5FD";
  const sub = light ? "rgba(255,255,255,.78)" : "#6B7280";
  const tagline = Math.max(Math.round(size * 0.085), 9);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.15), whiteSpace: "nowrap" }} aria-label="StockFlow — Stock Management">
      <StockFlowLogo size={size} />
      <span style={{ display: "grid", gap: Math.round(size * 0.04) }}>
        <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: Math.round(size * 0.36), lineHeight: 1, letterSpacing: "-0.02em", color: ink }}>StockFlow</span>
        <span style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.1) }}>
          <span lang="km" style={{ fontFamily: '"Noto Sans Khmer", "Khmer OS", system-ui, sans-serif', fontWeight: 700, fontSize: Math.round(size * 0.22), lineHeight: 1.2, color: khmer }}>ស្តុក</span>
          <span style={{ display: "grid", gap: 4, flex: 1 }}>
            <span style={{ height: Math.max(Math.round(size * 0.025), 2), borderRadius: 2, background: rule }} />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: tagline, letterSpacing: "0.16em", color: sub }}>STOCK MANAGEMENT</span>
          </span>
        </span>
      </span>
    </span>
  );
}
