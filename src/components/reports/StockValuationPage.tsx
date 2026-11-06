"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { downloadCSV } from "./reports-data";
import { LiveState } from "@/components/common/live-state";
import { shortDate, usd, useReportData } from "@/features/reports/reports-live";

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

const CATEGORY_COLORS = ["#5b21b6", "#7948e6", "#8b5cf6", "#a78bfa", "#c4b5fd"];
const WAREHOUSE_COLORS = ["#6320ee", "#8b5cf6", "#a78bfa", "#ddd6fe"];
const CIRCUMFERENCE = 2 * Math.PI * 60;

export default function StockValuationPage() {
  const data = useReportData();
  const categoryBars: CategoryBar[] = useMemo(() => {
    const top = data.categories.slice(0, 5);
    const max = Math.max(1, ...top.map((c) => c.value));
    return top.map((c, i) => ({
      name: c.category,
      value: c.value,
      formattedValue: usd(c.value),
      percentage: Math.max(2, (c.value / max) * 100),
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [data.categories]);
  const warehouseSegments: WarehouseSegment[] = useMemo(() => {
    const top = data.warehouses.slice(0, 3);
    const rest = data.warehouses.slice(3);
    const rows = top.map((w) => ({ name: w.warehouse, value: w.value, percentage: w.percentage }));
    if (rest.length > 0) {
      rows.push({
        name: rest.length === 1 ? rest[0].warehouse : `${rest.length} other warehouses`,
        value: rest.reduce((s, w) => s + w.value, 0),
        percentage: Math.round(rest.reduce((s, w) => s + w.percentage, 0) * 10) / 10,
      });
    }
    return rows.map((r, i) => ({ ...r, formattedValue: usd(r.value), color: WAREHOUSE_COLORS[i % WAREHOUSE_COLORS.length] }));
  }, [data.warehouses]);
  const skuCount = data.products.length;
  const avgPerSku = skuCount > 0 ? data.totalValue / skuCount : 0;
  const total = data.totalValue;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(`As of today (${shortDate(new Date())})`);
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
      `Generated: ${shortDate(new Date())}`,
      "==================================================",
      "",
      "KPI SUMMARY",
      "Metric,Value,Change",
      `Total Value,"${usd(total)}"`,
      `SKUs Tracked,"${skuCount}"`,
      `Avg. Value per SKU,"${usd(avgPerSku)}"`,
      "",
      "VALUE BY CATEGORY",
      "Category,Inventory Value,Share (%)",
      ...categoryBars.map(
        (c) =>
          `"${c.name}",${c.value},${(total > 0 ? (c.value / total) * 100 : 0).toFixed(1)}%`
      ),
      `"Total",${Math.round(total)},100%`,
      "",
      "VALUE BY WAREHOUSE",
      "Warehouse,Inventory Value,Share (%)",
      ...warehouseSegments.map(
        (w) => `"${w.name}",${w.value},${w.percentage}%`
      ),
      `"Total",${Math.round(total)},100%`,
    ];

    downloadCSV("StockFlow_Stock_Valuation_Report.csv", lines.join("\n"));
    showToast("Stock valuation report exported successfully.");
  }

  const presets = [`As of today (${shortDate(new Date())})`];

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

      <LiveState loading={data.loading && !data.loaded} error={data.error} onRetry={data.reload}>
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
            <span className="stock-val-badge gray">{data.warehouses.length} warehouses</span>
          </div>
          <div className="stock-val-kpi-metric">{usd(total)}</div>
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
            <span className="stock-val-badge gray">{data.totalUnits.toLocaleString("en-US")} units</span>
          </div>
          <div className="stock-val-kpi-metric">{skuCount}</div>
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
            <span className="stock-val-badge gray">on hand</span>
          </div>
          <div className="stock-val-kpi-metric">{usd(avgPerSku)}</div>
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
                  {warehouseSegments.map((seg, i) => {
                    const len = (seg.percentage / 100) * CIRCUMFERENCE;
                    const offset = warehouseSegments.slice(0, i).reduce((sum, x) => sum + (x.percentage / 100) * CIRCUMFERENCE, 0);
                    return (
                      <circle
                        key={seg.name}
                        cx="90"
                        cy="90"
                        r="60"
                        stroke={seg.color}
                        strokeWidth="22"
                        strokeDasharray={`${len} ${CIRCUMFERENCE}`}
                        strokeDashoffset={-offset}
                        className="stock-val-donut-segment"
                      />
                    );
                  })}
                </g>

                {/* Center text */}
                <text
                  x="90"
                  y="87"
                  textAnchor="middle"
                  className="stock-val-donut-center-val"
                >
                  {total >= 1000 ? `$${(total / 1000).toFixed(1)}K` : usd(total)}
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
      </LiveState>
    </div>
  );
}
