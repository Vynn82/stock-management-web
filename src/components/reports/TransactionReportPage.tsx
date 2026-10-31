"use client";

import { useState } from "react";
import Link from "next/link";
import { downloadCSV } from "./reports-data";

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

const chartData: ChartDay[] = [
  { day: "Aug 22", inHeight: 52, outHeight: 38, inQty: 140, outQty: 85 },
  { day: "Aug 23", inHeight: 74, outHeight: 38, inQty: 210, outQty: 80 },
  { day: "Aug 24", inHeight: 45, outHeight: 62, inQty: 110, outQty: 165 },
  { day: "Aug 25", inHeight: 88, outHeight: 32, inQty: 280, outQty: 75 },
  { day: "Aug 26", inHeight: 68, outHeight: 54, inQty: 195, outQty: 130 },
  { day: "Aug 27", inHeight: 38, outHeight: 72, inQty: 95, outQty: 190 },
  { day: "Aug 28", inHeight: 80, outHeight: 30, inQty: 250, outQty: 68 },
  { day: "Aug 29", inHeight: 94, outHeight: 48, inQty: 320, outQty: 125, isHighlight: true },
];

const transactionRows: TransactionItem[] = [
  {
    id: "tx-1",
    date: "Aug 29, 2026",
    product: "Wireless Mouse M185",
    type: "In",
    qty: "+120",
    qtyNumber: 120,
    warehouse: "Phnom Penh Main",
    performedBy: "Visal Khem",
  },
  {
    id: "tx-2",
    date: "Aug 28, 2026",
    product: "USB-C Cable 2m",
    type: "Out",
    qty: "-18",
    qtyNumber: -18,
    warehouse: "Siem Reap",
    performedBy: "Sokha Chan",
  },
  {
    id: "tx-3",
    date: "Aug 28, 2026",
    product: "A4 Paper Ream",
    type: "Transfer",
    qty: "40 units",
    qtyNumber: 40,
    warehouse: "Battambang — Phnom Penh Main",
    performedBy: "Dara Pich",
  },
  {
    id: "tx-4",
    date: "Aug 27, 2026",
    product: "Desk Lamp LED",
    type: "Adjustment",
    qty: "-3",
    qtyNumber: -3,
    warehouse: "Kampong Cham",
    performedBy: "Lina Sok",
  },
  {
    id: "tx-5",
    date: "Aug 26, 2026",
    product: "Wireless Mouse M185",
    type: "Out",
    qty: "-25",
    qtyNumber: -25,
    warehouse: "Phnom Penh Main",
    performedBy: "Ravy Meas",
  },
  {
    id: "tx-6",
    date: "Aug 25, 2026",
    product: "USB-C Cable 2m",
    type: "In",
    qty: "+200",
    qtyNumber: 200,
    warehouse: "Siem Reap",
    performedBy: "Visal Khem",
  },
  {
    id: "tx-7",
    date: "Aug 24, 2026",
    product: "A4 Paper Ream",
    type: "Out",
    qty: "-60",
    qtyNumber: -60,
    warehouse: "Phnom Penh Main",
    performedBy: "Sokha Chan",
  },
];

export default function TransactionReportPage() {
  const [selectedType, setSelectedType] = useState<TransactionType>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("22.08.2026 – 29.08.2026");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

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
      "Generated: Aug 29, 2026",
      "==================================================",
      "",
      "DATE,PRODUCT,TYPE,QTY,WAREHOUSE,PERFORMED BY",
      ...filteredRows.map(
        (r) =>
          `"${r.date}","${r.product}","${r.type}","${r.qty}","${r.warehouse}","${r.performedBy}"`
      ),
      "",
      "DAILY MOVEMENT SUMMARY (IN VS OUT)",
      "Day,Stock In Units,Stock Out Units",
      ...chartData.map((c) => `"${c.day}",${c.inQty},${c.outQty}`),
    ];

    downloadCSV("StockFlow_Transaction_Report.csv", lines.join("\n"));
    showToast("Transaction report exported successfully.");
  }

  const presets = [
    "22.08.2026 – 29.08.2026",
    "Last 7 Days (22.08 – 29.08.2026)",
    "Last 14 Days (15.08 – 29.08.2026)",
    "This Month (01.08 – 29.08.2026)",
    "Last Month (01.07 – 31.07.2026)",
  ];

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
            {type}
          </button>
        ))}
      </div>

      {/* Card 1: Stock Movement — In vs Out Chart */}
      <div className="tx-rep-chart-card">
        <div className="tx-rep-chart-header">
          <h2 className="tx-rep-chart-title">Stock movement — In vs Out</h2>
          <div className="tx-rep-chart-legend">
            <span className="tx-rep-legend-item">
              <span className="tx-rep-legend-dot in" />
              <span>In</span>
            </span>
            <span className="tx-rep-legend-item">
              <span className="tx-rep-legend-dot out" />
              <span>Out</span>
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
                        {row.type}
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
    </div>
  );
}
