"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, DatePicker, Input, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { fetchCustomerOrders, errorText } from "@/features/customer-orders/customer-orders.api";
import { CoStatus, CustomerOrderSummary } from "@/features/customer-orders/customer-orders.types";
import { Card, PaidPill, StatusPill, dateTime, money, mutedText, pageTitle, pageWrap, STATUS_META } from "./co-ui";

import { markSeen } from "@/features/seen/seen-store";
type Filter = "ALL" | CoStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchCustomerOrders();
      setOrders(rows);
      // Having the list in front of you counts as seeing the orders waiting for review.
      markSeen("orders", rows.filter((o) => o.status === "PENDING_REVIEW").map((o) => o.id));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const [from, to] = range ?? [null, null];
    return orders.filter((o) => {
      if (filter !== "ALL" && o.status !== filter) return false;
      if (q) {
        const hay = `${o.orderNo} ${o.customer.title} ${o.customer.company ?? ""} ${o.customer.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (from || to) {
        if (!o.createdAt) return false;
        const d = dayjs(o.createdAt);
        if (from && d.isBefore(from.startOf("day"))) return false;
        if (to && d.isAfter(to.endOf("day"))) return false;
      }
      return true;
    });
  }, [orders, filter, search, range]);

  const columns: ColumnsType<CustomerOrderSummary> = [
    {
      title: "Order",
      dataIndex: "orderNo",
      render: (v: string, o) => (
        <div>
          <div style={{ fontWeight: 700, color: "var(--ink)" }}>{v}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{o.fromMiniApp ? "Mini App" : "Staff"}</div>
        </div>
      ),
    },
    {
      title: "Customer",
      render: (_, o) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--ink)" }}>{o.customer.title}</div>
          {o.customer.company && o.customer.company !== o.customer.title && (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{o.customer.company}</div>
          )}
        </div>
      ),
    },
    { title: "Items", dataIndex: "itemCount", align: "right", width: 80 },
    { title: "Total", dataIndex: "totalAmount", align: "right", render: (v: number) => <strong>{money(v)}</strong> },
    { title: "Payment", dataIndex: "isPaid", render: (v: boolean) => <PaidPill paid={v} /> },
    { title: "Status", dataIndex: "status", render: (v: CoStatus) => <StatusPill status={v} /> },
    { title: "Created", dataIndex: "createdAt", render: (v: string | null) => <span style={mutedText}>{dateTime(v)}</span> },
  ];

  return (
    <div style={{ ...pageWrap, maxWidth: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 style={pageTitle}>Customer orders</h1>
          <p style={{ ...mutedText, margin: "4px 0 0" }}>Orders from the Telegram Mini App and from staff. Review, confirm and follow each one to delivery.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} action={<Button size="small" onClick={load}>Retry</Button>} />}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                border: `1px solid ${active ? "var(--purple)" : "var(--card-border)"}`,
                background: active ? "var(--purple)" : "var(--card-bg)",
                color: active ? "#fff" : "var(--muted)",
              }}
            >
              {f.label}
              <span
                style={{
                  minWidth: 20,
                  height: 18,
                  padding: "0 6px",
                  borderRadius: 999,
                  fontSize: 11,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? "rgba(255,255,255,0.25)" : "rgba(114,117,139,0.14)",
                }}
              >
                {counts[f.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search order no., customer or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />
          <DatePicker.RangePicker value={range} onChange={(v) => setRange(v as [Dayjs | null, Dayjs | null] | null)} />
        </div>
        <Table<CustomerOrderSummary>
          rowKey="id"
          columns={columns}
          dataSource={visible}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
          scroll={{ x: 760 }}
          onRow={(o) => ({ onClick: () => router.push(`/customer-orders/${o.id}`), style: { cursor: "pointer" } })}
          locale={{ emptyText: filter === "ALL" && !search && !range ? "No customer orders yet." : `No ${filter === "ALL" ? "" : STATUS_META[filter].label.toLowerCase() + " "}orders match.` }}
        />
      </Card>
    </div>
  );
}
