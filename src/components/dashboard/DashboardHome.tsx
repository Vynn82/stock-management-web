"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircleOutlined, InboxOutlined, ShopOutlined, DatabaseOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks/use-auth";
import { errorText } from "@/components/common/live-state";
import { fetchDashboard, type DashboardSummary } from "@/features/dashboard/dashboard-live";
import { fetchRequests, type LiveRequest } from "@/features/requests/requests-live";
import { useLiveStock } from "@/features/stock/stock-live";
import { useT, useTx, type MessageKey } from "@/lib/i18n";

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 1000) / 10}%` : "—";
}

export default function DashboardHome() {
  const { user } = useAuth();
  const t = useT();
  const tx = useTx();
  const { history, load: loadStock } = useLiveStock();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [requests, setRequests] = useState<LiveRequest[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard()
      .then(setSummary)
      .catch((e) => setError(errorText(e, t("dash.loadError"))));
    // Requests and stock history need their own permissions; the page still works without them.
    fetchRequests()
      .then((rows) => setRequests(rows.slice(0, 4)))
      .catch(() => setRequests([]));
    void loadStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadStock]);

  const k = summary?.kpis;
  const v = (n: number | undefined) => (k ? n!.toLocaleString("en-US") : "—");

  const stats = [
    {
      value: v(k?.requests.pendingRequests),
      label: t("dash.newRequests"),
      change: k ? t("dash.reqChange", { out: k.requests.pendingStockOut, transfer: k.requests.pendingTransfer }) : "",
      icon: <InboxOutlined />,
      red: (k?.requests.pendingRequests ?? 0) > 0,
    },
    {
      value: v(k?.orders.confirmedOrders),
      label: t("dash.confirmedOrders"),
      change: k ? t("dash.delivered", { n: k.orders.deliveredOrders }) : "",
      icon: <CheckCircleOutlined />,
    },
    {
      value: v(k?.inventory.totalProducts),
      label: t("dash.totalProducts"),
      change: k ? t("dash.lowStockN", { n: k.inventory.lowStockCount }) : "",
      icon: <DatabaseOutlined />,
      red: (k?.inventory.lowStockCount ?? 0) > 0,
    },
    {
      value: v(k?.inventory.totalWarehouses),
      label: t("dash.activeWarehouses"),
      change: k ? t("dash.units", { n: k.inventory.totalStockQuantity.toLocaleString("en-US") }) : "",
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
      return { key: d.toDateString(), label: t(`dash.day.${d.getDay()}` as MessageKey), inQty: 0, outQty: 0 };
    });
    for (const h of history) {
      const day = days.find((d) => d.key === new Date(h.timestamp).toDateString());
      if (!day) continue;
      if (h.type === "Stock In") day.inQty += Math.abs(h.quantity);
      else if (h.type === "Stock Out") day.outQty += Math.abs(h.quantity);
    }
    const max = Math.max(1, ...days.flatMap((d) => [d.inQty, d.outQty]));
    return days.map((d) => ({ ...d, inPct: (d.inQty / max) * 100, outPct: (d.outQty / max) * 100 }));
  }, [history, t]);

  const name = user?.firstName || user?.name?.split(" ")[0] || "";

  return (
    <div className="page-content dashboard-home">
      <div className="page-heading dashboard-heading">
        <h1>{t("dash.title")}</h1>
        <p>{name ? t("dash.welcomeName", { name }) : t("dash.welcome")}</p>
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
            <span className="panel-title">{t("dash.stockMovement")}</span>
            <div className="legend">
              <span>
                <i className="dot" />
                {t("dash.in")}
              </span>
              <span>
                <i className="dot light" />
                {t("dash.out")}
              </span>
            </div>
          </div>
          <div className="chart">
            {week.map((d) => (
              <div className="chart-day" key={d.key}>
                <div className="bars">
                  <div className="bar" style={{ height: `${Math.max(d.inPct, d.inQty > 0 ? 4 : 0)}%` }} title={t("dash.inN", { n: d.inQty })} />
                  <div className="bar light" style={{ height: `${Math.max(d.outPct, d.outQty > 0 ? 4 : 0)}%` }} title={t("dash.outN", { n: d.outQty })} />
                </div>
                <div className="day-label">{d.label}</div>
              </div>
            ))}
          </div>
        </Link>
        <Link href="/requests" className="panel-card dashboard-card">
          <div className="panel-header">
            <span className="panel-title">{t("dash.recentRequests")}</span>
            <span className="panel-action">{t("dash.seeAll")}</span>
          </div>
          <table className="request-table">
            <thead>
              <tr>
                <th>{t("col.requester")}</th>
                <th>{t("col.route")}</th>
                <th>{t("col.status")}</th>
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
                    <span className={`status-pill ${request.status.toLowerCase()}`}>{tx("status", request.status)}</span>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "var(--muted)" }}>
                    {t("dash.noRequests")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Link>
      </div>
      <div className="metrics-row">
        <Metric value={k ? money(k.revenue.unpaidRevenue) : "—"} label={t("dash.unpaidRevenue")} />
        <Metric value={k ? money(k.inventory.totalStockValue) : "—"} label={t("dash.stockValue")} />
        <Metric value={k ? percent(k.orders.deliveredOrders, k.orders.totalOrders) : "—"} label={t("dash.deliveryRate")} ring />
        <Metric
          value={k ? percent(k.inventory.totalProducts - k.inventory.lowStockCount - k.inventory.outOfStockCount, k.inventory.totalProducts) : "—"}
          label={t("dash.inStockRate")}
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
