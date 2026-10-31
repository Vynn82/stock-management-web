"use client";

import { useState } from "react";
import Link from "next/link";
import { downloadCSV } from "./reports-data";

interface CategoryBar {
  name: string;
  value: number;
  formattedValue: string;
  percentage: number;
  color: string;
}

interface WarehouseSegment {
  name: string;
  percentage: number;
  value: number;
  formattedValue: string;
  color: string;
}

const categoryBars: CategoryBar[] = [
  {
    name: "Electronics",
    value: 96400,
    formattedValue: "$96,400",
    percentage: 66,
    color: "#5b21b6",
  },
  {
    name: "Office",
    value: 58200,
    formattedValue: "$58,200",
    percentage: 40,
    color: "#7948e6",
  },
  {
    name: "Furniture",
    value: 52800,
    formattedValue: "$52,800",
    percentage: 36,
    color: "#8b5cf6",
  },
  {
    name: "Cables",
    value: 41100,
    formattedValue: "$41,100",
    percentage: 28,
    color: "#a78bfa",
  },
  {
    name: "Packaging",
    value: 36000,
    formattedValue: "$36,000",
    percentage: 24.5,
    color: "#c4b5fd",
  },
];

const warehouseSegments: WarehouseSegment[] = [
  {
    name: "Phnom Penh Main",
    percentage: 42,
    value: 119490,
    formattedValue: "$119,490",
    color: "#6320ee",
  },
  {
    name: "Siem Reap",
    percentage: 26,
    value: 73970,
    formattedValue: "$73,970",
    color: "#8b5cf6",
  },
  {
    name: "Battambang",
    percentage: 19,
    value: 54055,
    formattedValue: "$54,055",
    color: "#a78bfa",
  },
  {
    name: "Kampong Cham",
    percentage: 13,
    value: 36985,
    formattedValue: "$36,985",
    color: "#ddd6fe",
  },
];

export default function StockValuationPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("01.08.2026 – 29.08.2026");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  function handleExport() {
    const lines = [
      "==================================================",
      "STOCKFLOW - STOCK VALUATION REPORT",
      `Period: ${dateRange}`,
      "Generated: Aug 29, 2026",
      "==================================================",
      "",
      "KPI SUMMARY",
      "Metric,Value,Change",
      'Total Value,"$284,500","+5.1%"',
      'SKUs Tracked,"312","+12"',
      'Avg. Value per SKU,"$912","no change"',
      "",
      "VALUE BY CATEGORY",
      "Category,Inventory Value,Share (%)",
      ...categoryBars.map(
        (c) =>
          `"${c.name}",${c.value},${((c.value / 284500) * 100).toFixed(1)}%`
      ),
      `"Total",284500,100%`,
      "",
      "VALUE BY WAREHOUSE",
      "Warehouse,Inventory Value,Share (%)",
      ...warehouseSegments.map(
        (w) => `"${w.name}",${w.value},${w.percentage}%`
      ),
      `"Total",284500,100%`,
    ];

    downloadCSV("StockFlow_Stock_Valuation_Report.csv", lines.join("\n"));
    showToast("Stock valuation report exported successfully.");
  }

  const presets = [
    "01.08.2026 – 29.08.2026",
    "Last 7 Days (22.08 – 29.08.2026)",
    "Last 30 Days (30.07 – 29.08.2026)",
    "Q3 2026 (01.07 – 30.09.2026)",
    "Year to Date (01.01 – 29.08.2026)",
  ];

  return (
    <div className="stock-val-page">
      {/* Toast notification */}
      {toastMessage && (
        <div className="reports-toast" role="status" aria-live="polite">
          <span className="reports-toast-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Header Row */}
      <div className="stock-val-header">
        <div className="stock-val-header-left">
          <nav className="stock-val-breadcrumb" aria-label="Breadcrumb">
            <Link href="/reports" className="stock-val-breadcrumb-link">
              Reports
            </Link>
            <span className="stock-val-breadcrumb-sep">/</span>
            <span className="stock-val-breadcrumb-current">Stock Valuation</span>
          </nav>
          <h1 className="stock-val-title">Stock Valuation Report</h1>
        </div>

        <div className="stock-val-header-right">
          {/* Date range picker trigger */}
          <div className="stock-val-date-container">
            <button
              type="button"
              className="stock-val-date-btn"
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              aria-expanded={datePickerOpen}
              aria-label="Filter date range"
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
              <div className="stock-val-date-dropdown">
                <div className="stock-val-dropdown-header">Select Period</div>
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`stock-val-dropdown-item ${
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
            className="stock-val-export-btn"
            onClick={handleExport}
            aria-label="Export valuation report"
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

      {/* Top 3 KPI Cards */}
      <div className="stock-val-kpi-grid">
        {/* KPI 1: Total value */}
        <div className="stock-val-kpi-card">
          <div className="stock-val-kpi-top">
            <div className="stock-val-kpi-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="stock-val-badge green">↑ 5.1%</span>
          </div>
          <div className="stock-val-kpi-metric">$284,500</div>
          <div className="stock-val-kpi-label">Total value</div>
        </div>

        {/* KPI 2: SKUs tracked */}
        <div className="stock-val-kpi-card">
          <div className="stock-val-kpi-top">
            <div className="stock-val-kpi-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="stock-val-badge green">↑ 12</span>
          </div>
          <div className="stock-val-kpi-metric">312</div>
          <div className="stock-val-kpi-label">SKUs tracked</div>
        </div>

        {/* KPI 3: Avg. value per SKU */}
        <div className="stock-val-kpi-card">
          <div className="stock-val-kpi-top">
            <div className="stock-val-kpi-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
            </div>
            <span className="stock-val-badge gray">no change</span>
          </div>
          <div className="stock-val-kpi-metric">$912</div>
          <div className="stock-val-kpi-label">Avg. value per SKU</div>
        </div>
      </div>

      {/* Bottom 2 Detail Cards */}
      <div className="stock-val-charts-grid">
        {/* Left Card: Value by category */}
        <div className="stock-val-card">
          <h2 className="stock-val-card-title">Value by category</h2>
          <div className="stock-val-category-list">
            {categoryBars.map((item) => (
              <div key={item.name} className="stock-val-category-row">
                <span className="stock-val-category-name">{item.name}</span>
                <div className="stock-val-category-track">
                  <div
                    className="stock-val-category-fill"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="stock-val-category-val">
                  {item.formattedValue}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Value by warehouse */}
        <div className="stock-val-card">
          <h2 className="stock-val-card-title">Value by warehouse</h2>
          <div className="stock-val-warehouse-content">
            {/* Donut Chart */}
            <div className="stock-val-donut-wrapper">
              <svg
                width="180"
                height="180"
                viewBox="0 0 180 180"
                className="stock-val-donut-svg"
              >
                {/* Background Track Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r="60"
                  fill="none"
                  stroke="#f1eff7"
                  strokeWidth="22"
                />

                {/* Donut Segments Group (rotated -90deg so it starts at 12 o'clock) */}
                <g transform="rotate(-90 90 90)">
                  {/* Segment 1: Phnom Penh Main (42%) */}
                  <circle
                    cx="90"
                    cy="90"
                    r="60"
                    fill="none"
                    stroke="#6320ee"
                    strokeWidth="22"
                    strokeDasharray="158.34 376.99"
                    strokeDashoffset="0"
                    className="stock-val-donut-segment"
                  />
                  {/* Segment 2: Siem Reap (26%) */}
                  <circle
                    cx="90"
                    cy="90"
                    r="60"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="22"
                    strokeDasharray="98.02 376.99"
                    strokeDashoffset="-158.34"
                    className="stock-val-donut-segment"
                  />
                  {/* Segment 3: Battambang (19%) */}
                  <circle
                    cx="90"
                    cy="90"
                    r="60"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="22"
                    strokeDasharray="71.63 376.99"
                    strokeDashoffset="-256.35"
                    className="stock-val-donut-segment"
                  />
                  {/* Segment 4: Kampong Cham (13%) */}
                  <circle
                    cx="90"
                    cy="90"
                    r="60"
                    fill="none"
                    stroke="#ddd6fe"
                    strokeWidth="22"
                    strokeDasharray="49.01 376.99"
                    strokeDashoffset="-327.98"
                    className="stock-val-donut-segment"
                  />
                </g>

                {/* Center text */}
                <text
                  x="90"
                  y="87"
                  textAnchor="middle"
                  className="stock-val-donut-center-val"
                >
                  $284.5K
                </text>
                <text
                  x="90"
                  y="103"
                  textAnchor="middle"
                  className="stock-val-donut-center-sub"
                >
                  total
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div className="stock-val-legend">
              {warehouseSegments.map((seg) => (
                <div key={seg.name} className="stock-val-legend-item">
                  <div className="stock-val-legend-left">
                    <span
                      className="stock-val-legend-dot"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="stock-val-legend-name">{seg.name}</span>
                  </div>
                  <span className="stock-val-legend-pct">
                    {seg.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
