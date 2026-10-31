"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SearchOutlined,
  PlusOutlined,
  DownOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import {
  PurchaseOrder,
  POStatus,
  initialPurchaseOrders,
  loadSavedPurchaseOrders,
  savePurchaseOrders,
  formatCurrency,
} from "./purchasing-data";
import NewPOModal from "./NewPOModal";
import PODetailsModal from "./PODetailsModal";

const statusFilterOptions: { label: string; value: string }[] = [
  { label: "All Status", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Received", value: "Received" },
  { label: "Draft", value: "Draft" },
];

export default function PurchasingPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    const loaded = loadSavedPurchaseOrders();
    setOrders(loaded);
  }, []);

  // Close status dropdown on click outside or escape
  useEffect(() => {
    if (!statusMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(e.target as Node)
      ) {
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

  // Next PO ID generator
  const nextPoId = useMemo(() => {
    const maxNum = orders.reduce((max, order) => {
      const match = order.id.match(/PO-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        return Math.max(max, isNaN(n) ? 0 : n);
      }
      return max;
    }, 2041);
    return `PO-${maxNum + 1}`;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.supplier.toLowerCase().includes(query);

      const matchesStatus =
        selectedStatus === "All" || order.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  const handleCreatePO = (newPO: PurchaseOrder) => {
    const updated = [newPO, ...orders];
    setOrders(updated);
    savePurchaseOrders(updated);
  };

  const handleUpdateStatus = (id: string, status: POStatus) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(updated);
    savePurchaseOrders(updated);
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const handleDeletePO = (id: string) => {
    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    savePurchaseOrders(updated);
    setSelectedOrder(null);
  };

  const currentStatusLabel =
    statusFilterOptions.find((o) => o.value === selectedStatus)?.label ||
    "All Status";

  return (
    <div className="purchasing-page">
      <div className="purchasing-heading">
        <h1>Purchase Orders</h1>
        <Link href="/purchasing/new" className="purchasing-new-button">
          <PlusOutlined /> New PO
        </Link>
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
                const count =
                  opt.value === "All"
                    ? orders.length
                    : orders.filter((o) => o.status === opt.value).length;
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
        <table className="purchasing-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: "13%" }}>PO NUMBER</th>
              <th scope="col" style={{ width: "24%" }}>SUPPLIER</th>
              <th scope="col" style={{ width: "10%" }}>ITEMS</th>
              <th scope="col" style={{ width: "13%" }}>TOTAL</th>
              <th scope="col" style={{ width: "12%" }}>STATUS</th>
              <th scope="col" style={{ width: "14%" }}>ORDER DATE</th>
              <th scope="col" style={{ width: "14%" }}>EXPECTED</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                onClick={() => router.push(`/purchasing/${order.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td className="po-number">
                  <Link
                    href={`/purchasing/${order.id}`}
                    className="po-number-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {order.id}
                  </Link>
                </td>
                <td className="po-supplier">{order.supplier}</td>
                <td className="po-items">{order.items}</td>
                <td className="po-total">{formatCurrency(order.total)}</td>
                <td>
                  <span className={`po-status-badge status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td className="po-date">{order.orderDate}</td>
                <td className="po-expected">{order.expectedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="purchasing-no-results">
            No purchase orders match your filters.
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
      </div>

      <NewPOModal
        isOpen={isNewPOModalOpen}
        onClose={() => setIsNewPOModalOpen(false)}
        onCreate={handleCreatePO}
        nextId={nextPoId}
      />

      <PODetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeletePO}
      />
    </div>
  );
}
