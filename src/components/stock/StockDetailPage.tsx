"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Modal, Drawer, message, Tooltip } from "antd";
import {
  EditOutlined,
  SwapOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useStockStore, DetailedStockItem } from "@/store/stockStore";

interface StockDetailPageProps {
  productId?: string;
}

export default function StockDetailPage({ productId = "1" }: StockDetailPageProps) {
  const {
    items,
    getItem,
    updateProductInfo,
    recordStockOut,
    recordTransfer,
    recordAdjustment,
  } = useStockStore();

  const [messageApi, contextHolder] = message.useMessage();

  // Find product or fallback to item 1 (Wireless Mouse M185)
  const product: DetailedStockItem =
    getItem(productId) || items[0];

  // Modals state
  const [activeModal, setActiveModal] = useState<
    "none" | "edit" | "transfer" | "adjust" | "stockOut" | "allTransactions"
  >("none");

  // Form states
  const [editName, setEditName] = useState(product.name);
  const [editSku, setEditSku] = useState(product.sku);
  const [editCategory, setEditCategory] = useState(product.category);
  const [editUnitCost, setEditUnitCost] = useState(product.unitCost);
  const [editReorderPoint, setEditReorderPoint] = useState(product.reorderPoint);

  const [sourceWarehouse, setSourceWarehouse] = useState(
    product.warehouses[0]?.warehouse || "Phnom Penh Main Warehouse"
  );
  const [targetWarehouse, setTargetWarehouse] = useState(
    product.warehouses[1]?.warehouse || "Siem Reap Branch Warehouse"
  );
  const [actionQty, setActionQty] = useState<number>(5);
  const [adjustCount, setAdjustCount] = useState<number>(
    product.warehouses[0]?.onHand || 0
  );
  const [actionReason, setActionReason] = useState("");

  const handleOpenEdit = () => {
    setEditName(product.name);
    setEditSku(product.sku);
    setEditCategory(product.category);
    setEditUnitCost(product.unitCost);
    setEditReorderPoint(product.reorderPoint);
    setActiveModal("edit");
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editSku.trim()) {
      messageApi.error("Product name and SKU are required.");
      return;
    }
    updateProductInfo(product.id, {
      name: editName.trim(),
      sku: editSku.trim(),
      category: editCategory.trim(),
      unitCost: Number(editUnitCost) || product.unitCost,
      reorderPoint: Number(editReorderPoint) || product.reorderPoint,
    });
    messageApi.success("Product details updated successfully.");
    setActiveModal("none");
  };

  const handleOpenTransfer = () => {
    const src = product.warehouses[0]?.warehouse || "Phnom Penh Main Warehouse";
    setSourceWarehouse(src);
    const dest =
      product.warehouses.find((w) => w.warehouse !== src)?.warehouse ||
      "Siem Reap Branch Warehouse";
    setTargetWarehouse(dest);
    setActionQty(5);
    setActionReason("Branch replenishment");
    setActiveModal("transfer");
  };

  const handleExecuteTransfer = () => {
    if (sourceWarehouse === targetWarehouse) {
      messageApi.error("Source and destination warehouses must be different.");
      return;
    }
    if (actionQty <= 0) {
      messageApi.error("Quantity must be greater than zero.");
      return;
    }
    const available =
      product.warehouses.find((w) => w.warehouse === sourceWarehouse)?.onHand || 0;
    if (actionQty > available) {
      messageApi.error(
        `Insufficient stock at ${sourceWarehouse}! Available: ${available} units.`
      );
      return;
    }
    recordTransfer(
      product.id,
      sourceWarehouse,
      targetWarehouse,
      actionQty,
      actionReason || "Inter-warehouse transfer"
    );
    messageApi.success(
      `Transferred ${actionQty} units from ${sourceWarehouse} to ${targetWarehouse}.`
    );
    setActiveModal("none");
  };

  const handleOpenAdjust = () => {
    const wh = product.warehouses[0]?.warehouse || "Phnom Penh Main Warehouse";
    setSourceWarehouse(wh);
    const cur = product.warehouses.find((w) => w.warehouse === wh)?.onHand || 0;
    setAdjustCount(cur);
    setActionReason("Routine cycle count");
    setActiveModal("adjust");
  };

  const handleExecuteAdjust = () => {
    recordAdjustment(
      product.id,
      sourceWarehouse,
      adjustCount,
      actionReason || "Physical inventory count"
    );
    messageApi.success(
      `Stock level for ${product.name} at ${sourceWarehouse} updated to ${adjustCount} units.`
    );
    setActiveModal("none");
  };

  const handleOpenStockOut = () => {
    const wh = product.warehouses[0]?.warehouse || "Phnom Penh Main Warehouse";
    setSourceWarehouse(wh);
    setActionQty(1);
    setActionReason("Order fulfillment");
    setActiveModal("stockOut");
  };

  const handleExecuteStockOut = () => {
    if (actionQty <= 0) {
      messageApi.error("Quantity must be greater than zero.");
      return;
    }
    const available =
      product.warehouses.find((w) => w.warehouse === sourceWarehouse)?.onHand || 0;
    if (actionQty > available) {
      messageApi.error(
        `Insufficient stock! Only ${available} units available at ${sourceWarehouse}.`
      );
      return;
    }
    recordStockOut(
      product.id,
      sourceWarehouse,
      actionQty,
      actionReason || "Manual stock dispatch"
    );
    messageApi.success(
      `Dispatched ${actionQty} units from ${sourceWarehouse}.`
    );
    setActiveModal("none");
  };

  return (
    <div className="stock-detail-page-container">
      {contextHolder}

      {/* Breadcrumb matching screenshot */}
      <nav className="stock-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/stock" className="stock-breadcrumb-link">
          Stock
        </Link>
        <span className="stock-breadcrumb-separator">/</span>
        <span className="stock-breadcrumb-current">{product.name}</span>
      </nav>

      {/* Product Title Bar */}
      <div className="stock-detail-header">
        <div className="stock-detail-identity">
          {/* 3D Isometric Cardboard Box Icon Thumbnail */}
          <div className="stock-detail-thumb">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.5L3.5 7.2L12 12L20.5 7.2L12 2.5Z" fill="#E2A669" />
              <path d="M3.5 7.2L12 12V21.5L3.5 16.7V7.2Z" fill="#C68244" />
              <path d="M20.5 7.2L12 12V21.5L20.5 16.7V7.2Z" fill="#B36E32" />
              <path d="M10 3.6L14 5.8V11.2L10 9V3.6Z" fill="#F8DFB5" opacity="0.85" />
              <path d="M10 9L14 11.2V20.5L10 18.3V9Z" fill="#E8C795" opacity="0.85" />
            </svg>
          </div>

          <div>
            <h1 className="stock-detail-title">{product.name}</h1>
            <p className="stock-detail-meta">
              SKU: {product.sku} • {product.category}
            </p>
          </div>
        </div>

        {/* Edit Button */}
        <button
          type="button"
          className="stock-edit-btn"
          onClick={handleOpenEdit}
        >
          <EditOutlined style={{ fontSize: 13 }} />
          <span>Edit</span>
        </button>
      </div>

      {/* Main Two-Column Content Grid */}
      <div className="stock-detail-grid">
        {/* Left Column: Stock by warehouse + Recent transactions */}
        <div className="stock-detail-main-col">
          {/* Card 1: Stock by warehouse */}
          <section className="stock-detail-card">
            <h2 className="stock-card-title">Stock by warehouse</h2>
            <div className="stock-warehouse-table-wrap">
              <table className="stock-warehouse-table">
                <thead>
                  <tr>
                    <th style={{ width: "56%" }}>WAREHOUSE</th>
                    <th style={{ width: "24%" }}>ON HAND</th>
                    <th style={{ width: "20%" }}>RESERVED</th>
                  </tr>
                </thead>
                <tbody>
                  {product.warehouses.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", color: "#6b7280", padding: "24px 0" }}>
                        No warehouse stock recorded for this product.
                      </td>
                    </tr>
                  ) : (
                    product.warehouses.map((wh) => (
                      <tr key={wh.warehouse}>
                        <td className="stock-wh-name">{wh.warehouse}</td>
                        <td className="stock-wh-onhand">{wh.onHand}</td>
                        <td className="stock-wh-reserved">{wh.reserved}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Card 2: Recent transactions */}
          <section className="stock-detail-card" style={{ marginTop: 20 }}>
            <div className="stock-card-header-row">
              <h2 className="stock-card-title" style={{ margin: 0 }}>
                Recent transactions
              </h2>
              <Link
                href="/stock/transactions"
                className="stock-view-all-link"
                style={{ textDecoration: "none" }}
              >
                <span>View all</span>
                <span style={{ fontSize: 13 }}>→</span>
              </Link>
            </div>

            <div className="stock-transactions-table-wrap">
              <table className="stock-transactions-table">
                <thead>
                  <tr>
                    <th style={{ width: "24%" }}>DATE</th>
                    <th style={{ width: "20%" }}>TYPE</th>
                    <th style={{ width: "16%" }}>QTY</th>
                    <th style={{ width: "40%" }}>WAREHOUSE</th>
                  </tr>
                </thead>
                <tbody>
                  {product.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#6b7280", padding: "24px 0" }}>
                        No recent transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    product.transactions.slice(0, 4).map((tx) => (
                      <tr key={tx.id}>
                        <td className="stock-tx-date">{tx.date}</td>
                        <td>
                          <span
                            className={`stock-tx-badge ${
                              tx.type === "In"
                                ? "in"
                                : tx.type === "Out"
                                ? "out"
                                : "transfer"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td
                          className={`stock-tx-qty ${
                            tx.qty > 0
                              ? "positive"
                              : tx.qty < 0
                              ? "negative"
                              : "neutral"
                          }`}
                        >
                          {tx.qty > 0 ? `+${tx.qty}` : tx.qty}
                        </td>
                        <td className="stock-tx-warehouse">{tx.warehouse}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Total Stock Summary + Quick actions */}
        <div className="stock-detail-side-col">
          {/* Card 1: TOTAL STOCK */}
          <section className="stock-detail-card">
            <span className="stock-side-label">TOTAL STOCK</span>
            <div className="stock-total-value-row">
              <span className="stock-total-number">{product.onHand}</span>
              <span className="stock-total-unit">units</span>
            </div>

            <div className="stock-side-meta-list">
              <div className="stock-side-meta-row">
                <span className="stock-meta-name">Reorder point</span>
                <strong className="stock-meta-val">{product.reorderPoint} units</strong>
              </div>

              <div className="stock-side-meta-row">
                <span className="stock-meta-name">Unit cost</span>
                <strong className="stock-meta-val">
                  ${product.unitCost.toFixed(2)}
                </strong>
              </div>

              <div className="stock-side-meta-row">
                <span className="stock-meta-name">Category</span>
                <strong className="stock-meta-val">{product.category}</strong>
              </div>

              <div className="stock-side-meta-row" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <span className="stock-meta-name">Status</span>
                <span
                  className={`stock-status-pill ${
                    product.status === "Active"
                      ? "active"
                      : product.status === "Low Stock"
                      ? "low"
                      : "out"
                  }`}
                >
                  {product.status}
                </span>
              </div>
            </div>
          </section>

          {/* Card 2: Quick actions */}
          <section className="stock-detail-card" style={{ marginTop: 20 }}>
            <h2 className="stock-card-title" style={{ marginBottom: 16 }}>
              Quick actions
            </h2>

            <div className="stock-quick-actions-col">
              {/* Button 1: Transfer (Solid Purple) */}
              <Link
                href={`/stock/${product.id}/transfer`}
                className="stock-btn-transfer"
                style={{ textDecoration: "none" }}
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
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                <span>Transfer</span>
              </Link>

              {/* Button 2: Adjust (White with dark border) */}
              <Link
                href={`/stock/${product.id}/adjust`}
                className="stock-btn-adjust"
                style={{ textDecoration: "none" }}
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
                  <line x1="12" y1="3" x2="12" y2="21" />
                  <polyline points="8 7 12 3 16 7" />
                  <polyline points="8 17 12 21 16 17" />
                </svg>
                <span>Adjust</span>
              </Link>

              {/* Button 3: Stock Out (Red border & text) */}
              <Link
                href={`/stock/${product.id}/stock-out`}
                className="stock-btn-stockout"
                style={{ textDecoration: "none" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <span>Stock Out</span>
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* MODAL: Edit Product Information */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#f3eeff",
                color: "#6d28d9",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              ✎
            </span>
            <span>Edit Product</span>
          </div>
        }
        open={activeModal === "edit"}
        onOk={handleSaveEdit}
        onCancel={() => setActiveModal("none")}
        okText="Save Changes"
        okButtonProps={{ style: { background: "#6d28d9", borderColor: "#6d28d9" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Product Name
            </label>
            <input
              type="text"
              className="stock-modal-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                SKU
              </label>
              <input
                type="text"
                className="stock-modal-input"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Category
              </label>
              <input
                type="text"
                className="stock-modal-input"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="stock-modal-input"
                value={editUnitCost}
                onChange={(e) => setEditUnitCost(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Reorder Point (units)
              </label>
              <input
                type="number"
                min="0"
                className="stock-modal-input"
                value={editReorderPoint}
                onChange={(e) => setEditReorderPoint(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: Transfer Stock */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#f3eeff",
                color: "#6d28d9",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              ⇄
            </span>
            <span>Transfer {product.name}</span>
          </div>
        }
        open={activeModal === "transfer"}
        onOk={handleExecuteTransfer}
        onCancel={() => setActiveModal("none")}
        okText="Confirm Transfer"
        okButtonProps={{ style: { background: "#6d28d9", borderColor: "#6d28d9" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                From Warehouse
              </label>
              <select
                className="stock-modal-select"
                value={sourceWarehouse}
                onChange={(e) => setSourceWarehouse(e.target.value)}
              >
                {product.warehouses.map((w) => (
                  <option key={w.warehouse} value={w.warehouse}>
                    {w.warehouse} ({w.onHand})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                To Warehouse
              </label>
              <select
                className="stock-modal-select"
                value={targetWarehouse}
                onChange={(e) => setTargetWarehouse(e.target.value)}
              >
                {[
                  "Phnom Penh Main Warehouse",
                  "Siem Reap Branch Warehouse",
                  "Battambang Warehouse",
                  "Sihanoukville Warehouse",
                  "Kampong Cham Warehouse",
                  "Kandal Warehouse",
                ]
                  .filter((w) => w !== sourceWarehouse)
                  .map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Transfer Quantity
            </label>
            <input
              type="number"
              min={1}
              className="stock-modal-input"
              value={actionQty}
              onChange={(e) => setActionQty(parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Reason / Transfer Note
            </label>
            <input
              type="text"
              placeholder="e.g. Branch replenishment"
              className="stock-modal-input"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL: Adjust Stock */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#f3eeff",
                color: "#6d28d9",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              ↕
            </span>
            <span>Adjust Inventory Count</span>
          </div>
        }
        open={activeModal === "adjust"}
        onOk={handleExecuteAdjust}
        onCancel={() => setActiveModal("none")}
        okText="Save Adjustment"
        okButtonProps={{ style: { background: "#6d28d9", borderColor: "#6d28d9" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Warehouse to Adjust
            </label>
            <select
              className="stock-modal-select"
              value={sourceWarehouse}
              onChange={(e) => {
                const wh = e.target.value;
                setSourceWarehouse(wh);
                const cur =
                  product.warehouses.find((w) => w.warehouse === wh)?.onHand || 0;
                setAdjustCount(cur);
              }}
            >
              {product.warehouses.map((w) => (
                <option key={w.warehouse} value={w.warehouse}>
                  {w.warehouse} ({w.onHand} units recorded)
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "#faf8f5",
              border: "1px solid #f0eef5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: "#6b7280" }}>Current count:</span>
            <strong style={{ fontSize: 14 }}>
              {product.warehouses.find((w) => w.warehouse === sourceWarehouse)?.onHand || 0} units
            </strong>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              New Actual Count
            </label>
            <input
              type="number"
              min={0}
              className="stock-modal-input"
              style={{ fontSize: 15, fontWeight: 600 }}
              value={adjustCount}
              onChange={(e) => setAdjustCount(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          {(() => {
            const cur =
              product.warehouses.find((w) => w.warehouse === sourceWarehouse)?.onHand || 0;
            const diff = adjustCount - cur;
            return (
              <div style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ color: "#6b7280" }}>Calculated Variance:</span>
                <strong
                  style={{
                    color: diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#6b7280",
                  }}
                >
                  {diff > 0 ? `+${diff}` : diff} units
                </strong>
              </div>
            );
          })()}

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Adjustment Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Physical inventory count discrepancy"
              className="stock-modal-input"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL: Stock Out */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#fee2e2",
                color: "#ef4444",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              ↓
            </span>
            <span>Dispatch Stock Out</span>
          </div>
        }
        open={activeModal === "stockOut"}
        onOk={handleExecuteStockOut}
        onCancel={() => setActiveModal("none")}
        okText="Confirm Stock Out"
        okButtonProps={{ style: { background: "#ef4444", borderColor: "#ef4444" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Source Warehouse
            </label>
            <select
              className="stock-modal-select"
              value={sourceWarehouse}
              onChange={(e) => setSourceWarehouse(e.target.value)}
            >
              {product.warehouses.map((w) => (
                <option key={w.warehouse} value={w.warehouse}>
                  {w.warehouse} ({w.onHand} units available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Quantity to Dispatch
            </label>
            <input
              type="number"
              min={1}
              className="stock-modal-input"
              value={actionQty}
              onChange={(e) => setActionQty(parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
              Order / Dispatch Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Customer Order #SO-3104"
              className="stock-modal-input"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* DRAWER: All Transactions */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#f3eeff",
                color: "#6d28d9",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
              }}
            >
              ⏱
            </span>
            <span>All Transactions — {product.name}</span>
          </div>
        }
        placement="right"
        width={480}
        onClose={() => setActiveModal("none")}
        open={activeModal === "allTransactions"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {product.transactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #ece8f0",
                background: "#ffffff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  className={`stock-tx-badge ${
                    tx.type === "In"
                      ? "in"
                      : tx.type === "Out"
                      ? "out"
                      : "transfer"
                  }`}
                >
                  {tx.type}
                </span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{tx.date}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                <span style={{ fontWeight: 600, color: "#111827" }}>
                  {tx.destinationWarehouse
                    ? `${tx.warehouse} → ${tx.destinationWarehouse}`
                    : tx.warehouse}
                </span>
                <span
                  className={`stock-tx-qty ${
                    tx.qty > 0
                      ? "positive"
                      : tx.qty < 0
                      ? "negative"
                      : "neutral"
                  }`}
                >
                  {tx.qty > 0 ? `+${tx.qty}` : tx.qty} units
                </span>
              </div>

              {tx.reason && (
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  {tx.reason} {tx.user ? `• by ${tx.user}` : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
