"use client";

import React from "react";
import { Pill } from "@/components/customer-orders/co-ui";
import type { CustomerStatusValue } from "@/features/customer-orders/customer-orders.types";

const META: Record<CustomerStatusValue, { label: string; tone: "ok" | "warn" | "bad" | "muted" }> = {
  ACTIVE: { label: "Active", tone: "ok" },
  PENDING: { label: "Pending approval", tone: "warn" },
  REJECTED: { label: "Rejected", tone: "bad" },
  SUSPENDED: { label: "Suspended", tone: "warn" },
  BLOCKED: { label: "Blocked", tone: "bad" },
};

export const CUSTOMER_STATUSES = META;

export function CustomerStatusPill({ status }: { status: CustomerStatusValue }) {
  const m = META[status] ?? { label: status, tone: "muted" as const };
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

/** Loyalty tier as a small colored chip. */
export function TierChip({ name, color }: { name: string | null; color: string | null }) {
  if (!name) return <span style={{ color: "var(--muted)" }}>—</span>;
  const c = color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : "#7C3AED";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: c,
        border: `1px solid ${c}`,
        background: "transparent",
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </span>
  );
}
