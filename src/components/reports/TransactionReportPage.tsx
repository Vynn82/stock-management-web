"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { downloadCSV } from "./reports-data";
import { LiveState } from "@/components/common/live-state";
import { shortDate, useReportData } from "@/features/reports/reports-live";

import BackButton from "@/components/ui/BackButton";
export type TransactionType = "All" | "In" | "Out" | "Transfer" | "Adjustment";

interface ChartDay {
  day: string;
  inHeight: number; // percentage (0 - 100)
  outHeight: number; // percentage (0 - 100)
  inQty: number;
  outQty: number;
  isHighlight?: boolean;
}

interface TransactionItem {
  id: string;
  date: string;
  product: string;
  type: "In" | "Out" | "Transfer" | "Adjustment";
  qty: string;
  qtyNumber: number;
  warehouse: string;
  performedBy: string;
}

const PRESETS = [
  { label: "Last 7 Days", days: 7 },
  { label: "Last 14 Days", days: 14 },
];

const TYPE_SHORT = { "Stock In": "In", "Stock Out": "Out", Transfer: "Transfer", Adjustment: "Adjustment" } as const;

export default function TransactionReportPage() {
  const data = useReportData();
  const [selectedType, setSelectedType] = useState<TransactionType>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(PRESETS[0].label);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  const days = PRESETS.find((p) => p.label === dateRange)?.days ?? 7;

  const transactionRows: TransactionItem[] = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    return data.history
      .filter((h) => new Date(h.at).getTime() >= start.getTime())
      .map((h) => ({
        id: h.id,
        date: shortDate(h.at),
        product: h.productName,
        type: TYPE_SHORT[h.type],
        qty: h.type === "Transfer" ? `${Math.abs(h.quantity)} units` : `${h.quantity > 0 ? "+" : ""}${h.quantity}`,
        qtyNumber: h.quantity,
        warehouse: h.destinationWarehouse ? `${h.warehouse} → ${h.destinationWarehouse}` : h.warehouse,
        performedBy: h.user,
      }));
  }, [data.history, days]);

  const chartData: ChartDay[] = useMemo(() => {
    const list = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (days - 1 - i));
      return { key: d.toDateString(), day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), inQty: 0, outQty: 0 };
    });
    for (const h of data.history) {
      const row = list.find((x) => x.key === new Date(h.at).toDateString());
      if (!row) continue;
      if (h.type === "Stock In") row.inQty += Math.abs(h.quantity);
      else if (h.type === "Stock Out") row.outQty += Math.abs(h.quantity);
    }
    const max = Math.max(1, ...list.flatMap((x) => [x.inQty, x.outQty]));
    return list.map((x, i) => ({
      day: x.day,
      inQty: x.inQty,
      outQty: x.outQty,
      inHeight: x.inQty > 0 ? Math.max(4, (x.inQty / max) * 100) : 0,
      outHeight: x.outQty > 0 ? Math.max(4, (x.outQty / max) * 100) : 0,
      isHighlight: i === list.length - 1,
    }));
  }, [data.history, days]);

  const filteredRows = transactionRows.filter((r) => {
    if (selectedType === "All") return true;
    return r.type === selectedType;
  });

  function handleExport() {
    const lines = [
      "==================================================",
      "STOCKFLOW - TRANSACTION REPORT",
      `Period: ${dateRange}`,
      `Filter: ${selectedType}`,
      `Generated: ${shortDate(new Date())}`,
      "==================================================",
      "",
      "DATE,PRODUCT,TYPE,QTY,WAREHOUSE,PERFORMED BY",
      ...filteredRows.map(
        (r) =>
          `"${r.date}","${r.product}","${r.type === "In" ? "Stock In" : r.type === "Out" ? "Stock Out" : r.type}","${r.qty}","${r.warehouse}","${r.performedBy}"`
      ),
      "",
      "DAILY MOVEMENT SUMMARY (IN VS OUT)",
      "Day,Stock In Units,Stock Out Units",
      ...chartData.map((c) => `"${c.day}",${c.inQty},${c.outQty}`),
    ];

    downloadCSV("StockFlow_Transaction_Report.csv", lines.join("\n"));
    showToast("Transaction report exported successfully.");
  }

  const presets = PRESETS.map((p) => p.label);

  return (
    <div className="tx-rep-page">
      {/* Toast notification */}
      {toastMessage && (
        <div className="reports-toast" role="status" aria-live="polite">
          <span className="reports-toast-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Breadcrumb and Controls */}
      <div className="tx-rep-header">
        <div className="tx-rep-header-left">
          <BackButton href="/reports" />
          <nav className="tx-rep-breadcrumb" aria-label="Breadcrumb">
            <Link href="/reports" className="tx-rep-breadcrumb-link">
              Reports
            </Link>
            <span className="tx-rep-breadcrumb-sep">/</span>
            <span className="tx-rep-breadcrumb-current">Transaction Report</span>
          </nav>
          <h1 className="tx-rep-title">Transaction Report</h1>
        </div>

        <div className="tx-rep-header-right">
          {/* Date range picker pill */}
          <div className="tx-rep-date-container">
            <button
              type="button"
              className="tx-rep-date-btn"
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              aria-expanded={datePickerOpen}
              aria-label="Select date range"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{dateRange}</span>
            </button>

            {datePickerOpen && (
              <div className="tx-rep-date-dropdown">
                <div className="tx-rep-dropdown-header">Select Period</div>
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`tx-rep-dropdown-item ${
                      dateRange === p ? "selected" : ""
                    }`}
                    onClick={() => {
                      setDateRange(p);
                      setDatePickerOpen(false);
                      showToast(`Date filter updated: ${p}`);
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            className="tx-rep-export-btn"
            onClick={handleExport}
            aria-label="Export transaction report"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (Pills) */}
      <div className="tx-rep-filters" role="tablist" aria-label="Transaction type filter">
        {(["All", "In", "Out", "Transfer", "Adjustment"] as const).map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={selectedType === type}
            className={`tx-rep-filter-pill ${selectedType === type ? "active" : ""}`}
            onClick={() => setSelectedType(type)}
          >
            {type === "In" ? "Stock In" : type === "Out" ? "Stock Out" : type}
          </button>
        ))}
      </div>

      <LiveState loading={data.loading && !data.loaded} error={data.error} onRetry={data.reload}>
      {/* Card 1: Stock Movement — In vs Out Chart */}
      <div className="tx-rep-chart-card">
        <div className="tx-rep-chart-header">
          <h2 className="tx-rep-chart-title">Stock movement — Stock In vs Stock Out</h2>
          <div className="tx-rep-chart-legend">
            <span className="tx-rep-legend-item">
              <span className="tx-rep-legend-dot in" />
              <span>Stock In</span>
            </span>
            <span className="tx-rep-legend-item">
              <span className="tx-rep-legend-dot out" />
              <span>Stock Out</span>
            </span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="tx-rep-bars-container">
          {chartData.map((item) => (
            <div
              key={item.day}
              className={`tx-rep-bar-group ${item.isHighlight ? "highlight" : ""}`}
              onMouseEnter={() => setHoveredBar(item.day)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div className="tx-rep-bars-wrapper">
                {/* IN BAR (Purple) */}
                <div
                  className="tx-rep-bar in-bar"
                  style={{ height: `${item.inHeight}%` }}
                  title={`In: +${item.inQty} units`}
                />
                {/* OUT BAR (Light lavender) */}
                <div
                  className="tx-rep-bar out-bar"
                  style={{ height: `${item.outHeight}%` }}
                  title={`Out: -${item.outQty} units`}
                />
              </div>

              {/* Day Label */}
              <span
                className={`tx-rep-day-label ${
                  item.isHighlight ? "highlight" : ""
                }`}
              >
                {item.day}
              </span>

              {/* Tooltip on hover */}
              {hoveredBar === item.day && (
                <div className="tx-rep-bar-tooltip">
                  <div className="tooltip-row in">
                    <span>In:</span> +{item.inQty}
                  </div>
                  <div className="tooltip-row out">
                    <span>Out:</span> -{item.outQty}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Transactions Table */}
      <div className="tx-rep-table-card">
        <div className="tx-rep-table-wrap">
          <table className="tx-rep-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>PRODUCT</th>
                <th>TYPE</th>
                <th>QTY</th>
                <th>WAREHOUSE</th>
                <th>PERFORMED BY</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#72758b" }}>
                    No transactions found for filter "{selectedType}".
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="col-date">{row.date}</td>
                    <td className="col-product">
                      <strong>{row.product}</strong>
                    </td>
                    <td className="col-type">
                      <span
                        className={`tx-rep-tag ${
                          row.type === "In"
                            ? "tag-in"
                            : row.type === "Out"
                            ? "tag-out"
                            : row.type === "Transfer"
                            ? "tag-transfer"
                            : "tag-adjustment"
                        }`}
                      >
                        {row.type === "In" ? "Stock In" : row.type === "Out" ? "Stock Out" : row.type}
                      </span>
                    </td>
                    <td className="col-qty">
                      <strong
                        className={
                          row.type === "In"
                            ? "qty-in"
                            : row.type === "Out" || row.type === "Adjustment"
                            ? "qty-out"
                            : "qty-neutral"
                        }
                      >
                        {row.qty}
                      </strong>
                    </td>
                    <td className="col-warehouse">{row.warehouse}</td>
                    <td className="col-user">
                      <strong>{row.performedBy}</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </LiveState>
    </div>
  );
}
