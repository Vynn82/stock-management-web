"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { message } from "antd";
import StockGate from "./StockGate";
import { useStockStore, DetailedStockItem } from "@/store/stockStore";
import { REQUEST_SENT_MESSAGE } from "@/features/stock/stock-live";
import { useNeedsApproval } from "@/hooks/use-needs-approval";
import { useApprovalChain } from "@/features/requests/use-approval-chain";
import ApprovalChainCard, { CHAIN_HELP_STOCK } from "@/components/requests/ApprovalChainCard";
import SearchSelect from "@/components/ui/SearchSelect";

import BackButton from "@/components/ui/BackButton";
interface AdjustStockPageProps {
  productId?: string;
}

function AdjustStockPageInner({ productId = "1" }: AdjustStockPageProps) {
  const router = useRouter();
  const { items, getItem, recordAdjustment, warehouseNames } = useStockStore();
  const [messageApi, contextHolder] = message.useMessage();

  // Selected product
  const [selectedProductId, setSelectedProductId] = useState<string>(productId);
  const product: DetailedStockItem = useMemo(() => {
    return getItem(selectedProductId) || items[0];
  }, [getItem, selectedProductId, items]);

  // Warehouse selection
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(
    product.warehouses[0]?.warehouse || warehouseNames[0] || ""
  );

  // Adjustment type: "decrease" by default matching screenshot
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">("decrease");

  // Quantity: 4 by default matching screenshot
  const [quantity, setQuantity] = useState<number>(4);

  // Reason: "Damaged" by default matching screenshot
  const [reason, setReason] = useState<string>("Damaged");

  // Notes: matching screenshot pre-filled note
  const [notes, setNotes] = useState<string>(
    ""
  );

  const [submitting, setSubmitting] = useState(false);
  const askFirst = useNeedsApproval("STOCK_ADJUST");
  const chain = useApprovalChain(askFirst);

  // Warehouse options
  const warehouseOptions = useMemo(() => {
    if (product.warehouses && product.warehouses.length > 0) {
      return product.warehouses.map((w) => w.warehouse);
    }
    return warehouseNames;
  }, [product, warehouseNames]);

  // Current stock on hand for selected warehouse
  const currentStock = useMemo(() => {
    const wh = product.warehouses.find((w) => w.warehouse === selectedWarehouse);
    return wh ? wh.onHand : 0;
  }, [product, selectedWarehouse]);

  // Computed new stock
  const newStock = useMemo(() => {
    if (adjustmentType === "decrease") {
      return Math.max(0, currentStock - (quantity || 0));
    } else {
      return currentStock + (quantity || 0);
    }
  }, [currentStock, adjustmentType, quantity]);

  const isOverDecrease = adjustmentType === "decrease" && quantity > currentStock;

  // Handle Confirm Adjustment
  const handleConfirmAdjustment = async () => {
    if (quantity <= 0) {
      messageApi.error("Please enter a valid quantity greater than 0.");
      return;
    }

    if (adjustmentType === "decrease" && quantity > currentStock) {
      messageApi.error(
        `Cannot decrease by ${quantity} units. Only ${currentStock} units currently on hand at ${selectedWarehouse}.`
      );
      return;
    }

    if (askFirst) {
      const chainError = chain.validate();
      if (chainError) {
        messageApi.error(chainError);
        return;
      }
    }

    setSubmitting(true);
    try {
      const reasonText = notes.trim()
        ? `${reason} — ${notes.trim()}`
        : reason;

      const outcome = await recordAdjustment(
        product.id,
        selectedWarehouse,
        newStock,
        reasonText,
        askFirst ? chain.payload() : undefined
      );

      if (outcome === "requested") {
        messageApi.success(REQUEST_SENT_MESSAGE);
        setTimeout(() => router.push("/requests"), 900);
        return;
      }

      messageApi.success(
        `Successfully adjusted stock for ${product.name} at ${selectedWarehouse}.`
      );

      setTimeout(() => {
        router.push(`/stock/${product.id}`);
      }, 700);
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : "An error occurred while saving the stock adjustment.");
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/stock/${product.id}`);
  };

  return (
    <div className="stock-adjust-page-container">
      {contextHolder}

      {/* Top Breadcrumb */}
      <BackButton href="/stock" />
      <nav className="stock-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/stock" className="stock-breadcrumb-link">
          Stock
        </Link>
        <span className="stock-breadcrumb-separator">/</span>
        <Link href={`/stock/${product.id}`} className="stock-breadcrumb-link">
          {product.name}
        </Link>
        <span className="stock-breadcrumb-separator">/</span>
        <span className="stock-breadcrumb-current">Adjust Stock</span>
      </nav>

      {/* Page Header Bar */}
      <div className="stock-adjust-header">
        <h1 className="stock-adjust-title">Adjust Stock</h1>

      </div>

      {/* Two-Column Grid Layout */}
      <div className="stock-adjust-grid">
        {/* Left Column: Adjustment details form card */}
        <div className="stock-adjust-main-card">
          <h2 className="stock-section-title">Adjustment details</h2>

          {/* Row 1: Product & Warehouse (2-columns) */}
          <div className="stock-form-row">
            {/* Product */}
            <div className="stock-form-field">
              <label htmlFor="adjust-product-select" className="stock-field-label">
                Product
              </label>
              <div className="stock-product-select-wrap">
                <div className="stock-product-select-left">
                  {/* 3D Box Icon */}
                  <div className="stock-select-thumb">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2.5L3.5 7.2L12 12L20.5 7.2L12 2.5Z" fill="#E2A669" />
                      <path d="M3.5 7.2L12 12V21.5L3.5 16.7V7.2Z" fill="#C68244" />
                      <path d="M20.5 7.2L12 12V21.5L20.5 16.7V7.2Z" fill="#B36E32" />
                      <path d="M10 3.6L14 5.8V11.2L10 9V3.6Z" fill="#F8DFB5" opacity="0.85" />
                      <path d="M10 9L14 11.2V20.5L10 18.3V9Z" fill="#E8C795" opacity="0.85" />
                    </svg>
                  </div>
                  <span className="stock-select-product-name">{product.name}</span>
                </div>

                <SearchSelect
                  id="adjust-product-select"
                  className="stock-select-overlay"
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const p = getItem(e.target.value);
                    if (p?.warehouses[0]) {
                      setSelectedWarehouse(p.warehouses[0].warehouse);
                    }
                  }}
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </option>
                  ))}
                </SearchSelect>

                <svg
                  className="stock-select-chevron"
                  width="14"
                  height="14"
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

            {/* Warehouse */}
            <div className="stock-form-field">
              <label htmlFor="adjust-warehouse-select" className="stock-field-label">
                Warehouse
              </label>
              <div className="stock-input-select-wrap">
                <SearchSelect
                  id="adjust-warehouse-select"
                  className="stock-native-select"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  {warehouseOptions.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </SearchSelect>
                <svg
                  className="stock-select-chevron"
                  width="14"
                  height="14"
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
          </div>

          {/* Row 2: Adjustment type */}
          <div className="stock-form-field" style={{ marginTop: 18 }}>
            <span className="stock-field-label">Adjustment type</span>
            <div className="stock-adjust-type-toggle-row">
              <button
                type="button"
                className={`stock-adjust-type-btn ${
                  adjustmentType === "increase" ? "active" : ""
                }`}
                onClick={() => setAdjustmentType("increase")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
                <span>Increase</span>
              </button>

              <button
                type="button"
                className={`stock-adjust-type-btn ${
                  adjustmentType === "decrease" ? "active" : ""
                }`}
                onClick={() => setAdjustmentType("decrease")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
                <span>Decrease</span>
              </button>
            </div>
          </div>

          {/* Row 3: Quantity & Reason (2-columns) */}
          <div className="stock-form-row" style={{ marginTop: 18 }}>
            {/* Quantity */}
            <div className="stock-form-field">
              <label htmlFor="adjust-quantity-input" className="stock-field-label">
                Quantity
              </label>
              <div className="stock-qty-input-wrap">
                <input
                  id="adjust-quantity-input"
                  type="number"
                  min={1}
                  className="stock-qty-input"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <span className="stock-qty-suffix">units</span>
              </div>
            </div>

            {/* Reason */}
            <div className="stock-form-field">
              <label htmlFor="adjust-reason-select" className="stock-field-label">
                Reason
              </label>
              <div className="stock-input-select-wrap">
                <select
                  id="adjust-reason-select"
                  className="stock-native-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="Damaged">Damaged</option>
                  <option value="Inventory count discrepancy">Inventory count discrepancy</option>
                  <option value="Found stock">Found stock</option>
                  <option value="Loss / Theft">Loss / Theft</option>
                  <option value="Expired / Obsolete">Expired / Obsolete</option>
                  <option value="Return / Restock">Return / Restock</option>
                  <option value="Promotion / Sample">Promotion / Sample</option>
                  <option value="Other">Other</option>
                </select>
                <svg
                  className="stock-select-chevron"
                  width="14"
                  height="14"
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
          </div>

          {/* Row 4: Notes */}
          <div className="stock-form-field" style={{ marginTop: 18 }}>
            <label htmlFor="adjust-notes-input" className="stock-field-label">
              Notes
            </label>
            <textarea
              id="adjust-notes-input"
              rows={3}
              className="stock-notes-textarea"
              placeholder="Add details regarding this stock adjustment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Preview card */}
        <div className="stock-adjust-side-card">
          <h2 className="stock-side-title">Preview</h2>

          {/* Numbers display: Current -> New */}
          <div className="stock-adjust-preview-numbers">
            <div className="stock-adjust-num-col">
              <span className="stock-adjust-num-val">{currentStock}</span>
              <span className="stock-adjust-num-label">Current</span>
            </div>

            <div className="stock-adjust-arrow">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>

            <div className="stock-adjust-num-col">
              <span className="stock-adjust-num-val">{newStock}</span>
              <span className="stock-adjust-num-label">New</span>
            </div>
          </div>

          {/* Centered delta badge */}
          <div className="stock-adjust-badge-wrap">
            <span
              className={`stock-adjust-delta-badge ${
                adjustmentType === "decrease" ? "negative" : "positive"
              }`}
            >
              {adjustmentType === "decrease" ? `-${quantity} units` : `+${quantity} units`}
            </span>
          </div>

          {/* Warning banner if decrease exceeds stock */}
          {isOverDecrease && (
            <div className="stock-adjust-warning-banner">
              <strong>Warning:</strong> Cannot decrease by {quantity} units. Only {currentStock} units available on hand.
            </div>
          )}

          {/* Informational audit text box */}
          <div className="stock-adjust-info-box">
            This adjustment will be logged in the transaction history for {product.name}.
          </div>
        </div>
      </div>
      {askFirst && (
        <div style={{ margin: "0 0 4px" }}>
          <ApprovalChainCard chain={chain} helpText={CHAIN_HELP_STOCK} />
        </div>
      )}
      <div className="page-form-actions">
        <div className="stock-adjust-actions">
          <button
            type="button"
            className="stock-adjust-btn-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="stock-adjust-btn-confirm"
            onClick={handleConfirmAdjustment}
            disabled={submitting}
          >
            {submitting ? "Saving..." : askFirst ? "Submit Request" : "Confirm Adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdjustStockPage(props: React.ComponentProps<typeof AdjustStockPageInner>) {
  return (
    <StockGate productId={props.productId}>
      <AdjustStockPageInner {...props} />
    </StockGate>
  );
}
