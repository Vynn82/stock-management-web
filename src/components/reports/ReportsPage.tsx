"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  downloadCSV,
  generateConsolidatedCSV,
  type AuditLogEntry,
  type LowStockItem,
} from "./reports-data";
import { usd, useReportData } from "@/features/reports/reports-live";

type ActiveModal = "valuation" | "transactions" | "low_stock" | "audit" | null;

export default function ReportsPage() {
  const data = useReportData();
  const warehouseValuations = data.warehouses;
  const categoryValuations = data.categories;
  const movementSummaries = data.movements;
  const recentTransactions = useMemo(
    () => data.transactions.slice(0, 10).map((t) => ({ ...t, reference: t.reference })),
    [data.transactions]
  );
  const lowStockItems: LowStockItem[] = useMemo(
    () =>
      data.lowStock.map((i) => ({
        id: i.id,
        sku: i.sku,
        name: i.name,
        category: i.category,
        warehouse: i.warehouse,
        currentStock: i.onHand,
        reorderPoint: i.reorderAt,
        unit: "units",
        deficit: i.deficit,
        unitCost: i.unitCost,
        status: i.onHand <= i.reorderAt / 2 ? "Critical" : "Low",
      })),
    [data.lowStock]
  );
  const recentAuditLogs: AuditLogEntry[] = useMemo(
    () =>
      data.history.slice(0, 15).map((h) => ({
        id: h.id.slice(0, 8).toUpperCase(),
        timestamp: new Date(h.at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
        user: h.user,
        userRole: "—",
        action: h.type,
        target: h.sku,
        details: `${h.productName}: ${h.quantity > 0 ? "+" : ""}${h.quantity} at ${h.destinationWarehouse ? `${h.warehouse} → ${h.destinationWarehouse}` : h.warehouse}${h.reason ? ` (${h.reason})` : ""}`,
        status: h.type === "Adjustment" ? ("Flagged" as const) : ("Success" as const),
      })),
    [data.history]
  );
  const avgPerUnit = data.totalUnits > 0 ? data.totalValue / data.totalUnits : 0;
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lowStockFilter, setLowStockFilter] = useState<"All" | "Critical" | "Low">("All");

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  function handleQuickExportCSV() {
    const csv = generateConsolidatedCSV({
      warehouses: warehouseValuations,
      movements: movementSummaries,
      lowStock: lowStockItems,
      audit: recentAuditLogs,
      totalValue: data.totalValue,
      totalUnits: data.totalUnits,
    });
    downloadCSV(`StockFlow_Consolidated_Reports_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    showToast("Consolidated report CSV exported successfully.");
  }

  function handleQuickExportPDF() {
    showToast("Preparing printable report summary...");
    setTimeout(() => {
      window.print();
    }, 300);
  }

  function handleExportValuationCSV() {
    const lines = [
      "Warehouse,Total Units,Valuation (USD),Share (%)",
      ...warehouseValuations.map(
        (w) => `"${w.warehouse}",${w.units},${w.value},${w.percentage}%`
      ),
      `"Total",${data.totalUnits},${Math.round(data.totalValue)},100%`,
    ];
    downloadCSV("StockFlow_Valuation_Report.csv", lines.join("\n"));
    showToast("Stock valuation report CSV downloaded.");
  }

  function handleExportTransactionsCSV() {
    const lines = [
      "Transaction ID,Timestamp,Type,Product,SKU,Quantity,Warehouse,User,Reference",
      ...recentTransactions.map(
        (t) =>
          `"${t.id}","${t.timestamp}","${t.type}","${t.product}","${t.sku}",${t.quantity},"${t.warehouse}","${t.user}","${t.reference}"`
      ),
    ];
    downloadCSV("StockFlow_Transaction_Summary.csv", lines.join("\n"));
    showToast("Transaction summary CSV downloaded.");
  }

  function handleExportLowStockCSV() {
    const lines = [
      "SKU,Product Name,Category,Warehouse,Current Stock,Reorder Point,Deficit,Unit Cost,Status",
      ...lowStockItems.map(
        (i) =>
          `"${i.sku}","${i.name}","${i.category}","${i.warehouse}",${i.currentStock},${i.reorderPoint},${i.deficit},${i.unitCost},"${i.status}"`
      ),
    ];
    downloadCSV("StockFlow_Low_Stock_Report.csv", lines.join("\n"));
    showToast("Low stock report CSV downloaded.");
  }

  function handleExportAuditCSV() {
    const lines = [
      "Audit ID,Timestamp,User,Role,Action,Target,Details,Status",
      ...recentAuditLogs.map(
        (a) =>
          `"${a.id}","${a.timestamp}","${a.user}","${a.userRole}","${a.action}","${a.target}","${a.details.replace(/"/g, '""')}","${a.status}"`
      ),
    ];
    downloadCSV("StockFlow_Audit_Log.csv", lines.join("\n"));
    showToast("Audit log CSV downloaded.");
  }

  const filteredLowStock = lowStockItems.filter((item) => {
    if (lowStockFilter === "All") return true;
    return item.status === lowStockFilter;
  });

  return (
    <div className="reports-page">
      {/* Toast notification */}
      {toastMessage && (
        <div className="reports-toast" role="status" aria-live="polite">
          <span className="reports-toast-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="reports-header">
        <h1 className="reports-title">Reports</h1>
        <p className="reports-subtitle">
          Generate, review and export inventory reports.
        </p>
      </div>

      {/* 2x2 Grid */}
      <div className="reports-grid">
        {/* Card 1: Stock Valuation */}
        <Link
          href="/reports/valuation"
          className="report-card"
          aria-label={`Stock Valuation: Current on-hand value of all inventory across every warehouse. ${usd(data.totalValue)} current value`}
        >
          <div className="report-card-top">
            <div className="report-card-icon purple">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
            </div>
            <div className="report-card-chevron">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          <div className="report-card-body">
            <h2 className="report-card-title">Stock Valuation</h2>
            <p className="report-card-desc">
              Current on-hand value of all inventory across every warehouse.
            </p>
          </div>

          <div className="report-card-footer">
            <span className="report-metric-val">{usd(data.totalValue)}</span>
            <span className="report-metric-label">current value</span>
          </div>
        </Link>

        {/* Card 2: Transaction Summary */}
        <Link
          href="/reports/transactions"
          className="report-card"
          aria-label={`Transaction Summary: All stock in, out, transfer and adjustment movements over a period. ${data.movementCount} movements in the last 30 days`}
        >
          <div className="report-card-top">
            <div className="report-card-icon purple">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="report-card-chevron">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          <div className="report-card-body">
            <h2 className="report-card-title">Transaction Summary</h2>
            <p className="report-card-desc">
              All stock in, out, transfer and adjustment movements over a period.
            </p>
          </div>

          <div className="report-card-footer">
            <span className="report-metric-val">{data.movementCount.toLocaleString("en-US")}</span>
            <span className="report-metric-label">movements, last 30 days</span>
          </div>
        </Link>

        {/* Card 3: Low Stock Report */}
        <Link
          href="/reports/low-stock"
          className="report-card"
          aria-label={`Low Stock Report: Items at or below their configured reorder point, by warehouse. ${lowStockItems.length} items below reorder point`}
        >
          <div className="report-card-top">
            <div className="report-card-icon amber">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="report-card-chevron">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          <div className="report-card-body">
            <h2 className="report-card-title">Low Stock Report</h2>
            <p className="report-card-desc">
              Items at or below their configured reorder point, by warehouse.
            </p>
          </div>

          <div className="report-card-footer">
            <span className="report-metric-val amber">18</span>
            <span className="report-metric-label">items below reorder point</span>
          </div>
        </Link>

        {/* Card 4: Audit Log */}
        <Link
          href="/reports/audit"
          className="report-card"
          aria-label={`Audit Log: Full, timestamped history of every stock action and approval. ${data.history.length} logged actions`}
        >
          <div className="report-card-top">
            <div className="report-card-icon purple">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
              </svg>
            </div>
            <div className="report-card-chevron">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          <div className="report-card-body">
            <h2 className="report-card-title">Audit Log</h2>
            <p className="report-card-desc">
              Full, timestamped history of every stock action and approval.
            </p>
          </div>

          <div className="report-card-footer">
            <span className="report-metric-val">{data.history.length.toLocaleString("en-US")}</span>
            <span className="report-metric-label">logged actions</span>
          </div>
        </Link>
      </div>

      {/* Quick Export Bar */}
      <div className="report-export-bar">
        <div className="report-export-info">
          <h3 className="report-export-title">Quick export</h3>
          <p className="report-export-subtitle">
            Export the full reports set for the current period, for offline use.
          </p>
        </div>
        <div className="report-export-actions">
          <button
            type="button"
            className="report-btn-csv"
            onClick={handleQuickExportCSV}
          >
            <svg
              width="15"
              height="15"
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
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="report-btn-pdf"
            onClick={handleQuickExportPDF}
          >
            <svg
              width="15"
              height="15"
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
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* DETAIL MODALS */}
      {/* 1. Stock Valuation Modal */}
      {activeModal === "valuation" && (
        <div
          className="report-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="report-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="valuation-modal-title"
          >
            <div className="report-modal-header">
              <div>
                <h2 id="valuation-modal-title" className="report-modal-title">
                  Stock Valuation Breakdown
                </h2>
                <p className="report-modal-desc">
                  Detailed inventory distribution and value across all 4 warehouses.
                </p>
              </div>
              <button
                type="button"
                className="report-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="report-modal-stats-row">
              <div className="report-stat-pill">
                <span className="stat-label">Total On-Hand Value</span>
                <strong className="stat-value purple">{usd(data.totalValue)}</strong>
              </div>
              <div className="report-stat-pill">
                <span className="stat-label">Total Units</span>
                <strong className="stat-value">{data.totalUnits.toLocaleString("en-US")}</strong>
              </div>
              <div className="report-stat-pill">
                <span className="stat-label">Avg. Value per Unit</span>
                <strong className="stat-value">${avgPerUnit.toFixed(2)}</strong>
              </div>
            </div>

            <div className="report-modal-section">
              <h4 className="report-section-title">Valuation by Warehouse</h4>
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Warehouse</th>
                      <th style={{ textAlign: "right" }}>Units</th>
                      <th style={{ textAlign: "right" }}>Valuation (USD)</th>
                      <th style={{ textAlign: "right" }}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseValuations.map((w) => (
                      <tr key={w.id}>
                        <td>
                          <strong>{w.warehouse}</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {w.units.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          ${Math.round(w.value).toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="report-share-badge">{w.percentage}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-modal-section">
              <h4 className="report-section-title">Valuation by Category</h4>
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th style={{ textAlign: "right" }}>Catalog Items</th>
                      <th style={{ textAlign: "right" }}>Inventory Value</th>
                      <th style={{ textAlign: "right" }}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryValuations.map((c) => (
                      <tr key={c.category}>
                        <td>{c.category}</td>
                        <td style={{ textAlign: "right" }}>{c.itemCount}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          ${Math.round(c.value).toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="report-share-badge">{c.percentage}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-modal-footer">
              <button
                type="button"
                className="report-btn-csv"
                onClick={handleExportValuationCSV}
              >
                Export Valuation CSV
              </button>
              <button
                type="button"
                className="report-btn-pdf"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Transaction Summary Modal */}
      {activeModal === "transactions" && (
        <div
          className="report-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="report-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-modal-title"
          >
            <div className="report-modal-header">
              <div>
                <h2 id="tx-modal-title" className="report-modal-title">
                  Transaction Summary
                </h2>
                <p className="report-modal-desc">
                  {data.movementCount.toLocaleString("en-US")} stock movements logged over the last 30 calendar days.
                </p>
              </div>
              <button
                type="button"
                className="report-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="report-movements-grid">
              {movementSummaries.map((m) => (
                <div key={m.type} className="movement-stat-card">
                  <span className="movement-type">{m.type}</span>
                  <strong className="movement-count">{m.count}</strong>
                  <span className="movement-sub">
                    {m.units.toLocaleString()} units · {m.trend}
                  </span>
                </div>
              ))}
            </div>

            <div className="report-modal-section">
              <h4 className="report-section-title">Recent Movement Log</h4>
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Ref & Time</th>
                      <th>Type</th>
                      <th>Product</th>
                      <th style={{ textAlign: "right" }}>Qty</th>
                      <th>Warehouse</th>
                      <th>User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <strong>{tx.reference}</strong>
                          <div className="report-subtext">{tx.timestamp}</div>
                        </td>
                        <td>
                          <span
                            className={`report-tag-type ${
                              tx.type === "Stock In"
                                ? "tag-green"
                                : tx.type === "Stock Out"
                                ? "tag-blue"
                                : tx.type === "Transfer"
                                ? "tag-purple"
                                : "tag-amber"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td>
                          <div>{tx.product}</div>
                          <div className="report-subtext">{tx.sku}</div>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 600,
                            color: tx.quantity > 0 ? "#10b981" : "#ef4444",
                          }}
                        >
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </td>
                        <td>{tx.warehouse}</td>
                        <td>{tx.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-modal-footer">
              <button
                type="button"
                className="report-btn-csv"
                onClick={handleExportTransactionsCSV}
              >
                Export Movements CSV
              </button>
              <button
                type="button"
                className="report-btn-pdf"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Low Stock Report Modal */}
      {activeModal === "low_stock" && (
        <div
          className="report-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="report-modal"
            style={{ maxWidth: 880 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lowstock-modal-title"
          >
            <div className="report-modal-header">
              <div>
                <h2 id="lowstock-modal-title" className="report-modal-title">
                  Low Stock Items ({lowStockItems.length} Alerted)
                </h2>
                <p className="report-modal-desc">
                  Products currently at or below minimum threshold requiring replenishment.
                </p>
              </div>
              <button
                type="button"
                className="report-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="report-filter-row">
              <div className="report-pill-tabs">
                {(["All", "Critical", "Low"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`report-pill-tab ${lowStockFilter === f ? "active" : ""}`}
                    onClick={() => setLowStockFilter(f)}
                  >
                    {f} {f === "Critical" ? "(7)" : f === "Low" ? "(11)" : "(18)"}
                  </button>
                ))}
              </div>
              <Link href="/purchasing/new" className="report-create-po-btn">
                + Create Purchase Order
              </Link>
            </div>

            <div className="report-table-wrapper" style={{ maxHeight: 380, overflowY: "auto" }}>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Product & SKU</th>
                    <th>Warehouse</th>
                    <th style={{ textAlign: "right" }}>On Hand</th>
                    <th style={{ textAlign: "right" }}>Reorder Pt</th>
                    <th style={{ textAlign: "right" }}>Deficit</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLowStock.map((item: LowStockItem) => (
                    <tr key={item.id}>
                      <td>
                        <span
                          className={`report-tag-type ${
                            item.status === "Critical" ? "tag-red" : "tag-amber"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                        <div className="report-subtext">{item.sku} · {item.category}</div>
                      </td>
                      <td>{item.warehouse}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#d97706" }}>
                        {item.currentStock} {item.unit}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {item.reorderPoint} {item.unit}
                      </td>
                      <td style={{ textAlign: "right", color: "#dc2626", fontWeight: 600 }}>
                        -{item.deficit}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Link
                          href={`/purchasing/new?sku=${item.sku}&qty=${item.deficit}`}
                          className="report-table-action-link"
                        >
                          Reorder
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="report-modal-footer">
              <button
                type="button"
                className="report-btn-csv"
                onClick={handleExportLowStockCSV}
              >
                Export Low Stock CSV
              </button>
              <button
                type="button"
                className="report-btn-pdf"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Audit Log Modal */}
      {activeModal === "audit" && (
        <div
          className="report-modal-backdrop"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="report-modal"
            style={{ maxWidth: 880 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-modal-title"
          >
            <div className="report-modal-header">
              <div>
                <h2 id="audit-modal-title" className="report-modal-title">
                  System Audit Log
                </h2>
                <p className="report-modal-desc">
                  Full, immutable action history of stock transactions, updates, and approvals.
                </p>
              </div>
              <button
                type="button"
                className="report-modal-close"
                onClick={() => setActiveModal(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="report-modal-stats-row">
              <div className="report-stat-pill">
                <span className="stat-label">Total Logged Actions</span>
                <strong className="stat-value purple">{data.history.length.toLocaleString("en-US")}</strong>
              </div>
              <div className="report-stat-pill">
                <span className="stat-label">Last 30 Days</span>
                <strong className="stat-value">{data.movementCount.toLocaleString("en-US")}</strong>
              </div>
              <div className="report-stat-pill">
                <span className="stat-label">Flagged Exceptions</span>
                <strong className="stat-value" style={{ color: "#d97706" }}>{recentAuditLogs.filter((l) => l.status === "Flagged").length}</strong>
              </div>
            </div>

            <div className="report-table-wrapper" style={{ maxHeight: 380, overflowY: "auto" }}>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User & Role</th>
                    <th>Action</th>
                    <th>Target & Details</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAuditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <strong>{log.id}</strong>
                        <div className="report-subtext">{log.timestamp}</div>
                      </td>
                      <td>
                        <strong>{log.user}</strong>
                        <div className="report-subtext">{log.userRole}</div>
                      </td>
                      <td>
                        <span className="report-action-pill">{log.action}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.target}</div>
                        <div className="report-subtext">{log.details}</div>
                      </td>
                      <td>
                        <span
                          className={`report-tag-type ${
                            log.status === "Success" ? "tag-green" : "tag-amber"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="report-modal-footer">
              <button
                type="button"
                className="report-btn-csv"
                onClick={handleExportAuditCSV}
              >
                Export Audit Log CSV
              </button>
              <button
                type="button"
                className="report-btn-pdf"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
