"use client";

import React from "react";
import dayjs from "dayjs";
import { CoStatus } from "@/features/customer-orders/customer-orders.types";

/** Colors work on both the light and dark theme (translucent backgrounds). */
type Tone = "warn" | "brand" | "ok" | "bad" | "muted";

const TONES: Record<Tone, { color: string; bg: string }> = {
  warn: { color: "#D97706", bg: "rgba(245,158,11,0.16)" },
  brand: { color: "var(--purple)", bg: "rgba(124,58,237,0.12)" },
  ok: { color: "#16A34A", bg: "rgba(34,197,94,0.15)" },
  bad: { color: "#DC2626", bg: "rgba(239,68,68,0.15)" },
  muted: { color: "var(--muted)", bg: "rgba(114,117,139,0.14)" },
};

export const STATUS_META: Record<CoStatus, { label: string; tone: Tone }> = {
  PENDING_REVIEW: { label: "Pending review", tone: "warn" },
  WAITING_CUSTOMER: { label: "Waiting customer", tone: "warn" },
  CONFIRMED: { label: "Confirmed", tone: "brand" },
  WAITING_STOCK: { label: "Waiting stock", tone: "warn" },
  PROCESSING: { label: "Processing", tone: "brand" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", tone: "brand" },
  DELIVERED: { label: "Delivered", tone: "ok" },
  COMPLETED: { label: "Completed", tone: "ok" },
  REJECTED: { label: "Rejected", tone: "bad" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

export const isOpenStatus = (s: CoStatus) => s !== "COMPLETED" && s !== "REJECTED" && s !== "CANCELLED";

export function Pill({ tone, children, dot = true }: { tone: Tone; children: React.ReactNode; dot?: boolean }) {
  const t = TONES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        background: t.bg,
        color: t.color,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />}
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: CoStatus }) {
  const m = STATUS_META[status] ?? { label: status, tone: "muted" as Tone };
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

export function PaidPill({ paid }: { paid: boolean }) {
  return <Pill tone={paid ? "ok" : "warn"}>{paid ? "Paid" : "Unpaid"}</Pill>;
}

export const money = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const qty = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));

export const dateTime = (iso: string | null) => (iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : "");

export function Card({
  children,
  style,
  title,
  extra,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: 16,
        padding: 20,
        minWidth: 0,
        boxShadow: "0 8px 24px -16px rgba(22,18,31,0.18)",
        ...style,
      }}
    >
      {(title || extra) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{title}</h2>
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}

export const pageWrap: React.CSSProperties = { padding: "26px 30px 40px", color: "var(--ink)", maxWidth: 1400 };

export const pageTitle: React.CSSProperties = { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px", color: "var(--ink)" };

export const mutedText: React.CSSProperties = { fontSize: 13, color: "var(--muted)" };
