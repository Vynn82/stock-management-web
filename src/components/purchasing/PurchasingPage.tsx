"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchOutlined, PlusOutlined, DownOutlined, CheckOutlined } from "@ant-design/icons";
import { LiveState, errorText } from "@/components/common/live-state";
import { fetchPurchaseOrders, formatDate, poBadge, type PoListRow } from "@/features/purchasing/purchasing-live";
import { formatCurrency } from "./purchasing-data";
import Can from "@/components/common/Can";

const statusFilterOptions: { label: string; value: string }[] = [
  { label: "All Status", value: "All" },
  { label: "Draft", value: "Draft" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Partial", value: "Partial" },
  { label: "Received", value: "Received" },
  { label: "Closed", value: "Closed" },
  { label: "Rejected", value: "Rejected" },
];

export default function PurchasingPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PoListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await fetchPurchaseOrders());
    } catch (e) {
      setError(errorText(e, "Couldn't load purchase orders."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Close status dropdown on click outside or escape
  useEffect(() => {
    if (!statusMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStatusMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [statusMenuOpen]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !query || order.poNumber.toLowerCase().includes(query) || order.supplier.toLowerCase().includes(query);
      const matchesStatus = selectedStatus === "All" || poBadge(order.status).label === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  const currentStatusLabel = statusFilterOptions.find((o) => o.value === selectedStatus)?.label || "All Status";

  return (
    <div className="purchasing-page">
      <div className="purchasing-heading">
        <h1>Purchase Orders</h1>
        <Can any={"PO_CREATE"}><Link href="/purchasing/new" className="purchasing-new-button">
          <PlusOutlined /> New PO
        </Link></Can>
      </div>

      <div className="purchasing-toolbar">
        <label className="purchasing-search">
          <SearchOutlined />
          <input
            type="search"
            placeholder="Search PO number, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search PO number or supplier"
          />
        </label>

        <div className="purchasing-status-filter" ref={statusMenuRef}>
          <button
            type="button"
            className={`purchasing-status-trigger ${statusMenuOpen ? "is-open" : ""}`}
            onClick={() => setStatusMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={statusMenuOpen}
          >
            <span>{currentStatusLabel}</span>
            <DownOutlined className="purchasing-status-chevron" />
          </button>

          {statusMenuOpen && (
            <div className="purchasing-status-menu" role="menu">
              <span className="purchasing-status-menu-title">Filter by status</span>
              {statusFilterOptions.map((opt) => {
                const count = opt.value === "All" ? orders.length : orders.filter((o) => poBadge(o.status).label === opt.value).length;
                const isSelected = selectedStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    className={`purchasing-status-option ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedStatus(opt.value);
                      setStatusMenuOpen(false);
                    }}
                  >
                    <span className="purchasing-status-option-label">
                      <span>{opt.label}</span>
                      <span className="purchasing-status-option-count">({count})</span>
                    </span>
                    {isSelected && <CheckOutlined className="purchasing-status-check" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="purchasing-table-wrap">
        <LiveState loading={loading} error={error} onRetry={load} loadingText="Loading purchase orders…">
          <table className="purchasing-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "13%" }}>PO NUMBER</th>
                <th scope="col" style={{ width: "22%" }}>SUPPLIER</th>
                <th scope="col" style={{ width: "10%" }}>ITEMS</th>
                <th scope="col" style={{ width: "13%" }}>TOTAL</th>
                <th scope="col" style={{ width: "12%" }}>STATUS</th>
                <th scope="col" style={{ width: "14%" }}>ORDER DATE</th>
                <th scope="col" style={{ width: "16%" }}>WAREHOUSE</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const badge = poBadge(order.status);
                return (
                  <tr key={order.id} onClick={() => router.push(`/purchasing/${order.id}`)} style={{ cursor: "pointer" }}>
                    <td className="po-number">
                      <Link href={`/purchasing/${order.id}`} className="po-number-link" onClick={(e) => e.stopPropagation()}>
                        {order.poNumber}
                      </Link>
                    </td>
                    <td className="po-supplier">{order.supplier}</td>
                    <td className="po-items">{order.itemCount}</td>
                    <td className="po-total">{formatCurrency(order.total)}</td>
                    <td>
                      <span className={`po-status-badge status-${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="po-date">{formatDate(order.createdAt)}</td>
                    <td className="po-expected">{order.warehouse}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="purchasing-no-results">
              {orders.length === 0 ? "No purchase orders yet." : "No purchase orders match your filters."}
              {selectedStatus !== "All" || searchQuery ? (
                <button
                  type="button"
                  className="purchasing-reset-filter-btn"
                  onClick={() => {
                    setSelectedStatus("All");
                    setSearchQuery("");
                  }}
                >
                  Reset filters
                </button>
              ) : null}
            </div>
          )}
        </LiveState>
      </div>
    </div>
  );
}
