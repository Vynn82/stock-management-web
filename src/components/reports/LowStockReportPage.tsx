"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { downloadCSV } from "./reports-data";
import { LiveState } from "@/components/common/live-state";
import { shortDate, useReportData } from "@/features/reports/reports-live";

import BackButton from "@/components/ui/BackButton";
export default function LowStockReportPage() {
  const data = useReportData();
  const lowStockData = data.lowStock;
  const warehousesList = useMemo(
    () => ["All Warehouses", ...Array.from(new Set(lowStockData.map((i) => i.warehouse))).sort()],
    [lowStockData]
  );
  const [selectedWarehouse, setSelectedWarehouse] = useState("All Warehouses");
  const [whDropdownOpen, setWhDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  const filteredItems = useMemo(() => {
    if (selectedWarehouse === "All Warehouses") {
      return lowStockData;
    }
    return lowStockData.filter((i) => i.warehouse === selectedWarehouse);
  }, [selectedWarehouse, lowStockData]);

  const outOfStockCount = useMemo(() => {
    return filteredItems.filter((i) => i.status === "Out of Stock").length;
  }, [filteredItems]);

  const affectedWarehousesCount = useMemo(() => {
    const set = new Set(filteredItems.map((i) => i.warehouse));
    return set.size;
  }, [filteredItems]);

  function handleExport() {
    const lines = [
      "==================================================",
      "STOCKFLOW - LOW STOCK REPORT",
      `Warehouse Filter: ${selectedWarehouse}`,
      `Total Items Below Reorder Point: ${filteredItems.length}`,
      `Completely Out of Stock: ${outOfStockCount}`,
      `Generated: ${shortDate(new Date())}`,
      "==================================================",
      "",
      "PRODUCT,SKU,CATEGORY,WAREHOUSE,ON HAND,REORDER AT,STATUS",
      ...filteredItems.map(
        (i) =>
          `"${i.name}","${i.sku}","${i.category}","${
            i.warehouse
          }",${i.onHand},${i.reorderAt},"${i.status}"`
      ),
    ];

    downloadCSV("StockFlow_Low_Stock_Report.csv", lines.join("\n"));
    showToast("Low stock report exported successfully.");
  }

  return (
    <div className="low-stock-page">
      {/* Toast notification */}
      {toastMessage && (
        <div className="reports-toast" role="status" aria-live="polite">
          <span className="reports-toast-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="low-stock-header">
        <div className="low-stock-header-left">
          <BackButton href="/reports" />
          <nav className="low-stock-breadcrumb" aria-label="Breadcrumb">
            <Link href="/reports" className="low-stock-breadcrumb-link">
              Reports
            </Link>
            <span className="low-stock-breadcrumb-sep">/</span>
            <span className="low-stock-breadcrumb-current">Low Stock</span>
          </nav>
          <h1 className="low-stock-title">Low Stock Report</h1>
        </div>

        <div className="low-stock-header-right">
          {/* Warehouse Dropdown */}
          <div className="low-stock-wh-container">
            <button
              type="button"
              className="low-stock-wh-btn"
              onClick={() => setWhDropdownOpen(!whDropdownOpen)}
              aria-expanded={whDropdownOpen}
              aria-label="Filter by warehouse"
            >
              <span>{selectedWarehouse}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`low-stock-wh-chevron ${whDropdownOpen ? "open" : ""}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {whDropdownOpen && (
              <div className="low-stock-wh-dropdown">
                <div className="low-stock-wh-dropdown-header">Filter Warehouse</div>
                {warehousesList.map((wh) => (
                  <button
                    key={wh}
                    type="button"
                    className={`low-stock-wh-item ${
                      selectedWarehouse === wh ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedWarehouse(wh);
                      setWhDropdownOpen(false);
                      showToast(`Filtered by ${wh}`);
                    }}
                  >
                    <span>{wh}</span>
                    {selectedWarehouse === wh && <span className="wh-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            className="low-stock-export-btn"
            onClick={handleExport}
            aria-label="Export low stock report"
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
      <div className="low-stock-kpi-grid">
        {/* Card 1: Items below reorder point */}
        <div className="low-stock-kpi-card">
          <div className="low-stock-kpi-top">
            <div className="low-stock-kpi-icon amber">
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
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <span className="low-stock-badge gray">by reorder point</span>
          </div>
          <div className="low-stock-kpi-metric">{filteredItems.length}</div>
          <div className="low-stock-kpi-label">Items below reorder point</div>
        </div>

        {/* Card 2: Completely out of stock */}
        <div className="low-stock-kpi-card">
          <div className="low-stock-kpi-top">
            <div className="low-stock-kpi-icon red">
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
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <span className="low-stock-badge red">↑ 1</span>
          </div>
          <div className="low-stock-kpi-metric">{outOfStockCount}</div>
          <div className="low-stock-kpi-label">Completely out of stock</div>
        </div>

        {/* Card 3: Warehouses affected */}
        <div className="low-stock-kpi-card">
          <div className="low-stock-kpi-top">
            <div className="low-stock-kpi-icon purple">
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
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 10h6" />
                <path d="M9 14h6" />
                <path d="M9 18h6" />
              </svg>
            </div>
            <span className="low-stock-badge gray">of 6 total</span>
          </div>
          <div className="low-stock-kpi-metric">{affectedWarehousesCount}</div>
          <div className="low-stock-kpi-label">Warehouses affected</div>
        </div>
      </div>

      {/* Bottom Table Card */}
      <LiveState
        loading={data.loading && !data.loaded}
        error={data.error}
        empty={data.loaded && filteredItems.length === 0}
        emptyText="Nothing is below its reorder point."
        onRetry={data.reload}
      >
      <div className="low-stock-table-card">
        <div className="low-stock-table-wrap">
          <table className="low-stock-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>WAREHOUSE</th>
                <th style={{ textAlign: "right" }}>ON HAND</th>
                <th style={{ textAlign: "right" }}>REORDER AT</th>
                <th style={{ textAlign: "center" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="col-product">
                    <div className="product-title">{item.name}</div>
                    <div className="product-sku">SKU: {item.sku}</div>
                  </td>
                  <td className="col-category">{item.category}</td>
                  <td className="col-warehouse">
                    <strong>{item.warehouse}</strong>
                  </td>
                  <td
                    className="col-onhand"
                    style={{ textAlign: "right" }}
                  >
                    <strong
                      className={item.onHand === 0 ? "qty-out-stock" : "qty-low-stock"}
                    >
                      {item.onHand}
                    </strong>
                  </td>
                  <td
                    className="col-reorder"
                    style={{ textAlign: "right" }}
                  >
                    {item.reorderAt}
                  </td>
                  <td
                    className="col-status"
                    style={{ textAlign: "center" }}
                  >
                    <span
                      className={`low-stock-tag ${
                        item.status === "Out of Stock"
                          ? "tag-out-stock"
                          : "tag-low-stock"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </LiveState>
    </div>
  );
}
