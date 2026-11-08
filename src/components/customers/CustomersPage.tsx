"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { errorText, fetchCustomers } from "@/features/customer-orders/customer-orders.api";
import type { CustomerRow, CustomerStatusValue } from "@/features/customer-orders/customer-orders.types";
import { Card, dateTime, money, mutedText, pageTitle, pageWrap } from "@/components/customer-orders/co-ui";
import { CUSTOMER_STATUSES, CustomerStatusPill, TierChip } from "./customer-ui";

type Filter = "ALL" | CustomerStatusValue;
const FILTERS: Filter[] = ["ALL", "ACTIVE", "PENDING", "SUSPENDED", "BLOCKED", "REJECTED"];

export default function CustomersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchCustomers());
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
    const c: Record<string, number> = { ALL: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "ALL" && r.status !== filter) return false;
      if (!q) return true;
      return `${r.title} ${r.company ?? ""} ${r.name ?? ""} ${r.phone ?? ""} ${r.telegramAccounts.join(" ")} ${r.address ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, filter, search]);

  const columns: ColumnsType<CustomerRow> = [
    {
      title: "Customer",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: "var(--ink)" }}>{r.title}</div>
          {r.company && r.company !== r.title && <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.company}</div>}
        </div>
      ),
    },
    { title: "Phone", dataIndex: "phone", render: (v: string | null) => v ?? "—" },
    { title: "Telegram", dataIndex: "telegram", render: (v: string | null) => v ?? "—" },
    { title: "Tier", render: (_, r) => <TierChip name={r.tierName} color={r.tierColor} /> },
    { title: "Orders", dataIndex: "orderCount", align: "right", width: 80, sorter: (a, b) => a.orderCount - b.orderCount },
    {
      title: "Total spent",
      dataIndex: "totalSpent",
      align: "right",
      sorter: (a, b) => a.totalSpent - b.totalSpent,
      render: (v: number) => <strong>{money(v)}</strong>,
    },
    { title: "Last order", dataIndex: "lastOrderAt", render: (v: string | null) => <span style={mutedText}>{dateTime(v) || "—"}</span> },
    { title: "Status", dataIndex: "status", render: (v: CustomerStatusValue) => <CustomerStatusPill status={v} /> },
  ];

  return (
    <div style={{ ...pageWrap, maxWidth: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 style={pageTitle}>Customers</h1>
          <p style={{ ...mutedText, margin: "4px 0 0" }}>Everyone registered through the Telegram Mini App, with their orders and spending.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} action={<Button size="small" onClick={load}>Retry</Button>} />}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
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
              {f === "ALL" ? "All" : CUSTOMER_STATUSES[f].label}
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
                {counts[f] ?? 0}
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
            placeholder="Search name, company, phone, Telegram or address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 420 }}
          />
        </div>
        <Table<CustomerRow>
          rowKey="id"
          columns={columns}
          dataSource={visible}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
          scroll={{ x: 860 }}
          onRow={(r) => ({ onClick: () => router.push(`/customers/${r.id}`), style: { cursor: "pointer" } })}
          locale={{ emptyText: rows.length === 0 ? "No customers yet." : "No customers match." }}
        />
      </Card>
    </div>
  );
}
