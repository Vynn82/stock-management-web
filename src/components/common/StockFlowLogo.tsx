import { useId } from "react";

/**
 * The StockFlow logo: a shelf with boxes on a rounded purple tile.
 * Same drawing as the mobile app icon, as vectors so it is sharp at any size.
 */
export default function StockFlowLogo({ size = 32, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  const gid = useId().replace(/:/g, "");
  const tape = "#5B21B6";
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="StockFlow" className={className} style={{ flex: "none", display: "block", ...style }}>
      <defs>
        <linearGradient id={`sf-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="133" fill={`url(#sf-${gid})`} />
      <g transform="translate(256 256) scale(1.0779) translate(-256 -259)">
        <g fill="#fff">
          <rect x="104" y="104" width="16" height="310" rx="8" />
          <rect x="392" y="104" width="16" height="310" rx="8" />
          <rect x="104" y="188" width="304" height="14" rx="7" />
          <rect x="104" y="288" width="304" height="14" rx="7" />
          <rect x="104" y="388" width="304" height="14" rx="7" />
          <rect x="140" y="124" width="74" height="64" rx="12" />
          <rect x="300" y="132" width="64" height="56" rx="12" />
          <rect x="212" y="216" width="84" height="72" rx="12" />
          <rect x="140" y="324" width="96" height="64" rx="12" />
          <rect x="250" y="338" width="50" height="50" rx="12" />
        </g>
        <g fill="#C4B5FD">
          <rect x="228" y="144" width="54" height="44" rx="12" />
          <rect x="140" y="236" width="56" height="52" rx="12" />
        </g>
        <g fill={tape} fillOpacity="0.25">
          <rect x="173" y="124" width="8" height="26.88" rx="4" />
          <rect x="250" y="216" width="8" height="30.24" rx="4" />
          <rect x="184" y="324" width="8" height="26.88" rx="4" />
        </g>
        <path d="M322 238h50M354 220l18 18-18 18" fill="none" stroke="#DDD6FE" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
