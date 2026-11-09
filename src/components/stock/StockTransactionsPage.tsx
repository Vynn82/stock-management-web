"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { message } from "antd";
import StockGate from "./StockGate";
import { useStockStore, GlobalStockTransaction } from "@/store/stockStore";

import BackButton from "@/components/ui/BackButton";
function StockTransactionsPageInner() {
  const { globalTransactions } = useStockStore();
  const [messageApi, contextHolder] = message.useMessage();

  // Filters state matching screenshot
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [dateRange, setDateRange] = useState<string>("Aug 22 – Aug 29");

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return globalTransactions.filter((tx) => {
      // Type filter
      if (selectedType !== "All" && tx.type !== selectedType) {
        return false;
      }

      // Search term filter across product, warehouse, performedBy, and type
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesProduct = tx.productName.toLowerCase().includes(q);
        const matchesWarehouse = tx.warehouse.toLowerCase().includes(q);
        const matchesUser = tx.performedBy.toLowerCase().includes(q);
        const matchesType = (tx.type === "In" ? "stock in" : tx.type === "Out" ? "stock out" : tx.type.toLowerCase()).includes(q);
        if (!matchesProduct && !matchesWarehouse && !matchesUser && !matchesType) {
          return false;
        }
      }

      return true;
    });
  }, [globalTransactions, selectedType, searchTerm]);

  // Export CSV handler
  const handleExportCSV = () => {
    try {
      const headers = ["Date / Time", "Product", "Type", "Quantity", "Warehouse", "Performed By"];
      const rows = filteredTransactions.map((tx) => [
        `"${tx.dateTime}"`,
        `"${tx.productName}"`,
        `"${tx.type === "In" ? "Stock In" : tx.type === "Out" ? "Stock Out" : tx.type}"`,
        tx.qty > 0 ? `+${tx.qty}` : `${tx.qty}`,
        `"${tx.warehouse}"`,
        `"${tx.performedBy}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `stock_transactions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      messageApi.success(`Exported ${filteredTransactions.length} transactions to CSV.`);
    } catch {
      messageApi.error("Failed to export transactions.");
    }
  };

  return (
    <div className="stock-transactions-page-container">
      {contextHolder}

      {/* Breadcrumb: Stock / Transactions */}
      <BackButton href="/stock" />
      <nav className="stock-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/stock" className="stock-breadcrumb-link">
          Stock
        </Link>
        <span className="stock-breadcrumb-separator">/</span>
        <span className="stock-breadcrumb-current">Transactions</span>
      </nav>

      {/* Header Bar */}
      <div className="stock-transactions-header">
        <h1 className="stock-transactions-title">Stock Transactions</h1>

        <button
          type="button"
          className="stock-export-btn"
          onClick={handleExportCSV}
          title="Export transactions to CSV"
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
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export</span>
        </button>
      </div>

      {/* Filters Bar: Search + Type Dropdown + Date Range */}
      <div className="stock-transactions-filters-row">
        {/* Search Input */}
        <div className="stock-tx-search-box">
          <svg
            className="stock-tx-search-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="stock-tx-search-input"
            placeholder="Search product, warehouse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Type Filter */}
        <div className="stock-tx-filter-wrap stock-tx-filter-type">
          <select
            className="stock-tx-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="In">Stock In</option>
            <option value="Out">Stock Out</option>
            <option value="Transfer">Transfer</option>
            <option value="Adjustment">Adjustment</option>
          </select>
          <svg
            className="stock-select-chevron"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Date Range Filter */}
        <div className="stock-tx-filter-wrap stock-tx-filter-date">
          <svg
            className="stock-tx-calendar-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <select
            className="stock-tx-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="Aug 22 – Aug 29">Aug 22 – Aug 29</option>
            <option value="All Time">All Time</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
          </select>
          <svg
            className="stock-select-chevron"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="stock-transactions-card">
        <div className="stock-tx-table-container">
          <table className="stock-transactions-table">
            <thead>
              <tr>
                <th style={{ width: "18%" }}>DATE / TIME</th>
                <th style={{ width: "24%" }}>PRODUCT</th>
                <th style={{ width: "12%" }}>TYPE</th>
                <th style={{ width: "10%" }}>QTY</th>
                <th style={{ width: "23%" }}>WAREHOUSE</th>
                <th style={{ width: "13%" }}>PERFORMED BY</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="stock-tx-empty">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isPositive = tx.qty > 0;
                  const typeClass =
                    tx.type === "In"
                      ? "type-in"
                      : tx.type === "Out"
                      ? "type-out"
                      : tx.type === "Transfer"
                      ? "type-transfer"
                      : "type-adjustment";

                  return (
                    <tr key={tx.id} className="stock-tx-row">
                      {/* DATE / TIME */}
                      <td className="stock-tx-date-cell">{tx.dateTime}</td>

                      {/* PRODUCT */}
                      <td className="stock-tx-product-cell">
                        <Link
                          href={`/stock/${tx.productId}`}
                          className="stock-tx-product-link"
                        >
                          {tx.productName}
                        </Link>
                      </td>

                      {/* TYPE (Pill Badge) */}
                      <td>
                        <span className={`stock-tx-pill ${typeClass}`}>
                          {tx.type === "In" ? "Stock In" : tx.type === "Out" ? "Stock Out" : tx.type}
                        </span>
                      </td>

                      {/* QTY */}
                      <td
                        className={`stock-tx-qty-cell ${
                          isPositive ? "qty-positive" : "qty-negative"
                        }`}
                      >
                        {isPositive ? `+${tx.qty}` : `${tx.qty}`}
                      </td>

                      {/* WAREHOUSE */}
                      <td className="stock-tx-warehouse-cell">{tx.warehouse}</td>

                      {/* PERFORMED BY */}
                      <td className="stock-tx-user-cell">{tx.performedBy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function StockTransactionsPage() {
  return (
    <StockGate>
      <StockTransactionsPageInner />
    </StockGate>
  );
}
