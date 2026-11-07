"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircleOutlined, InboxOutlined, ShopOutlined, DatabaseOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks/use-auth";
import { errorText } from "@/components/common/live-state";
import { fetchDashboard, type DashboardSummary } from "@/features/dashboard/dashboard-live";
import { fetchRequests, type LiveRequest } from "@/features/requests/requests-live";
import { useLiveStock } from "@/features/stock/stock-live";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 1000) / 10}%` : "—";
}

export default function DashboardHome() {
  const { user } = useAuth();
  const { history, load: loadStock } = useLiveStock();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [requests, setRequests] = useState<LiveRequest[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard()
      .then(setSummary)
      .catch((e) => setError(errorText(e, "Couldn't load the dashboard numbers.")));
    // Requests and stock history need their own permissions; the page still works without them.
    fetchRequests()
      .then((rows) => setRequests(rows.slice(0, 4)))
      .catch(() => setRequests([]));
    void loadStock();
  }, [loadStock]);

  const k = summary?.kpis;
  const v = (n: number | undefined) => (k ? n!.toLocaleString("en-US") : "—");

  const stats = [
    {
      value: v(k?.requests.pendingRequests),
      label: "New requests",
      change: k ? `${k.requests.pendingStockOut} out · ${k.requests.pendingTransfer} transfer` : "",
      icon: <InboxOutlined />,
      red: (k?.requests.pendingRequests ?? 0) > 0,
    },
    {
      value: v(k?.orders.confirmedOrders),
      label: "Confirmed orders",
      change: k ? `${k.orders.deliveredOrders} delivered` : "",
      icon: <CheckCircleOutlined />,
    },
    {
      value: v(k?.inventory.totalProducts),
      label: "Total products",
      change: k ? `${k.inventory.lowStockCount} low stock` : "",
      icon: <DatabaseOutlined />,
      red: (k?.inventory.lowStockCount ?? 0) > 0,
    },
    {
      value: v(k?.inventory.totalWarehouses),
      label: "Active warehouses",
      change: k ? `${k.inventory.totalStockQuantity.toLocaleString("en-US")} units` : "",
      icon: <ShopOutlined />,
      neutral: true,
    },
  ];

  // Stock in / out for the last 7 days, from the stock history.
  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toDateString(), label: DAY_LABELS[d.getDay()], inQty: 0, outQty: 0 };
    });
    for (const h of history) {
      const day = days.find((d) => d.key === new Date(h.timestamp).toDateString());
      if (!day) continue;
      if (h.type === "Stock In") day.inQty += Math.abs(h.quantity);
      else if (h.type === "Stock Out") day.outQty += Math.abs(h.quantity);
    }
    const max = Math.max(1, ...days.flatMap((d) => [d.inQty, d.outQty]));
    return days.map((d) => ({ ...d, inPct: (d.inQty / max) * 100, outPct: (d.outQty / max) * 100 }));
  }, [history]);

  const name = user?.firstName || user?.name?.split(" ")[0] || "";

  return (
    <div className="page-content dashboard-home">
      <div className="page-heading dashboard-heading">
        <h1>Dashboard</h1>
        <p>{name ? `Welcome back, ${name}. ` : "Welcome back. "}Here&apos;s what&apos;s happening today.</p>
      </div>
      {error && <p role="alert" style={{ color: "#dc2626", margin: "0 0 12px" }}>{error}</p>}
      <div className="stats-grid">
        {stats.map((stat) => (
          <Link href="#" className="stat-card dashboard-card" key={stat.label}>
            <div className="stat-top">
              <span className="stat-icon">{stat.icon}</span>
              <span className={`stat-change ${stat.red ? "red" : ""}`}>{stat.change}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <Link href="/stock/transactions" className="panel-card dashboard-card">
          <div className="panel-header">
            <span className="panel-title">Stock movement</span>
            <div className="legend">
              <span>
                <i className="dot" />
                In
              </span>
              <span>
                <i className="dot light" />
                Out
              </span>
            </div>
          </div>
          <div className="chart">
            {week.map((d) => (
              <div className="chart-day" key={d.key}>
                <div className="bars">
                  <div className="bar" style={{ height: `${Math.max(d.inPct, d.inQty > 0 ? 4 : 0)}%` }} title={`${d.inQty} in`} />
                  <div className="bar light" style={{ height: `${Math.max(d.outPct, d.outQty > 0 ? 4 : 0)}%` }} title={`${d.outQty} out`} />
                </div>
                <div className="day-label">{d.label}</div>
              </div>
            ))}
          </div>
        </Link>
        <Link href="/requests" className="panel-card dashboard-card">
          <div className="panel-header">
            <span className="panel-title">Recent requests</span>
            <span className="panel-action">See all</span>
          </div>
          <table className="request-table">
            <thead>
              <tr>
                <th>REQUESTER</th>
                <th>ROUTE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>{request.requester}</strong>
                  </td>
                  <td>{request.route}</td>
                  <td>
                    <span className={`status-pill ${request.status.toLowerCase()}`}>{request.status}</span>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "var(--muted)" }}>
                    No requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Link>
      </div>
      <div className="metrics-row">
        <Metric value={k ? money(k.revenue.unpaidRevenue) : "—"} label="Unpaid revenue" />
        <Metric value={k ? money(k.inventory.totalStockValue) : "—"} label="Stock value" />
        <Metric value={k ? percent(k.orders.deliveredOrders, k.orders.totalOrders) : "—"} label="Delivery rate" ring />
        <Metric
          value={k ? percent(k.inventory.totalProducts - k.inventory.lowStockCount - k.inventory.outOfStockCount, k.inventory.totalProducts) : "—"}
          label="In-stock rate"
          ring
          green
        />
      </div>
    </div>
  );
}

function Metric({ value, label, ring, green }: { value: string; label: string; ring?: boolean; green?: boolean }) {
  return (
    <Link href="#" className="metric-card dashboard-card">
      {ring && <div className={`progress-ring ${green ? "green" : ""}`} />}
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </Link>
  );
}
