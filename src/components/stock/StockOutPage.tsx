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
interface StockOutPageProps {
  productId?: string;
}

function StockOutPageInner({ productId = "2" }: StockOutPageProps) {
  const router = useRouter();
  const { items, getItem, recordStockOut, warehouseNames } = useStockStore();
  const [messageApi, contextHolder] = message.useMessage();

  // Selected product (defaults to USB-C Cable 2m / id "2" to match screenshot)
  const [selectedProductId, setSelectedProductId] = useState<string>(productId);
  const product: DetailedStockItem = useMemo(() => {
    return getItem(selectedProductId) || items.find((i) => i.id === "2") || items[0];
  }, [getItem, selectedProductId, items]);

  // Warehouse selection
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(
    product.warehouses[0]?.warehouse || warehouseNames[0] || ""
  );

  // Quantity (5 by default matching screenshot)
  const [quantity, setQuantity] = useState<number>(5);

  // Reason ("Damaged" by default matching screenshot)
  const [reason, setReason] = useState<string>("Damaged");

  // Notes (prefilled matching screenshot)
  const [notes, setNotes] = useState<string>(
    ""
  );

  const [submitting, setSubmitting] = useState(false);
  const askFirst = useNeedsApproval("STOCK_ADJUST");
  const chain = useApprovalChain(askFirst);

  // Warehouse options
  const warehouseOptions = useMemo(() => {
    return product.warehouses.filter((w) => w.onHand > 0).map((w) => w.warehouse);
  }, [product, warehouseNames]);

  // Current stock on hand for selected warehouse
  const currentStock = useMemo(() => {
    const wh = product.warehouses.find((w) => w.warehouse === selectedWarehouse);
    return wh ? wh.onHand : 0;
  }, [product, selectedWarehouse]);

  // Computed after stock
  const afterStock = Math.max(0, currentStock - (quantity || 0));
  const isOverStock = (quantity || 0) > currentStock;
  const isBelowReorder = afterStock < product.reorderPoint;

  // Handle Confirm Stock Out
  const handleConfirmStockOut = async () => {
    if (quantity <= 0) {
      messageApi.error("Please enter a valid stock out quantity greater than 0.");
      return;
    }

    if (quantity > currentStock) {
      messageApi.error(
        `Cannot dispatch ${quantity} units. Only ${currentStock} units available at ${selectedWarehouse}.`
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

      const outcome = await recordStockOut(
        product.id,
        selectedWarehouse,
        quantity,
        reasonText,
        askFirst ? chain.payload() : undefined
      );

      if (outcome === "requested") {
        messageApi.success(REQUEST_SENT_MESSAGE);
        setTimeout(() => router.push("/requests"), 900);
        return;
      }

      messageApi.success(
        `Successfully recorded stock out of ${quantity} units for ${product.name}.`
      );

      setTimeout(() => {
        router.push(`/stock/${product.id}`);
      }, 700);
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : "An error occurred while processing stock out.");
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/stock/${product.id}`);
  };

  return (
    <div className="stock-out-page-container">
      {contextHolder}

      {/* Top Breadcrumb matching screenshot: Stock / Stock Out */}
      <BackButton href="/stock" />
      <nav className="stock-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/stock" className="stock-breadcrumb-link">
          Stock
        </Link>
        <span className="stock-breadcrumb-separator">/</span>
        <span className="stock-breadcrumb-current">Stock Out</span>
      </nav>

      {/* Page Header Bar */}
      <div className="stock-out-header">
        <h1 className="stock-out-title">Stock Out</h1>

      </div>

      {/* Two-Column Grid Layout */}
      <div className="stock-out-grid">
        {/* Left Column: Stock out details form card */}
        <div className="stock-out-main-card">
          <h2 className="stock-section-title">Stock out details</h2>

          {/* Row 1: Product (Full Width) */}
          <div className="stock-form-field">
            <label htmlFor="stockout-product-select" className="stock-field-label">
              Product
            </label>
            <div className="stock-product-select-wrap">
              <div className="stock-product-select-left">
                {/* 3D Box Icon Thumbnail */}
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
                id="stockout-product-select"
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

          {/* Row 2: Warehouse & Quantity (2 columns) */}
          <div className="stock-form-row" style={{ marginTop: 18 }}>
            {/* Warehouse */}
            <div className="stock-form-field">
              <label htmlFor="stockout-warehouse-select" className="stock-field-label">
                Warehouse
              </label>
              <div className="stock-input-select-wrap">
                <SearchSelect
                  id="stockout-warehouse-select"
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

            {/* Quantity */}
            <div className="stock-form-field">
              <label htmlFor="stockout-quantity-input" className="stock-field-label">
                Quantity
              </label>
              <div className="stock-qty-input-wrap">
                <input
                  id="stockout-quantity-input"
                  type="number"
                  min={1}
                  className="stock-qty-input"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <span className="stock-qty-suffix">units</span>
              </div>
            </div>
          </div>

          {/* Row 3: Reason (Full Width) */}
          <div className="stock-form-field" style={{ marginTop: 18 }}>
            <label htmlFor="stockout-reason-select" className="stock-field-label">
              Reason
            </label>
            <div className="stock-input-select-wrap">
              <select
                id="stockout-reason-select"
                className="stock-native-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="Damaged">Damaged</option>
                <option value="Expired / Spoiled">Expired / Spoiled</option>
                <option value="Scrap / Obsolete">Scrap / Obsolete</option>
                <option value="Theft / Loss">Theft / Loss</option>
                <option value="Customer Order">Customer Order</option>
                <option value="Promotion / Sample">Promotion / Sample</option>
                <option value="Internal Consumption">Internal Consumption</option>
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

          {/* Row 4: Notes (optional) */}
          <div className="stock-form-field" style={{ marginTop: 18 }}>
            <label htmlFor="stockout-notes-input" className="stock-field-label">
              Notes (optional)
            </label>
            <textarea
              id="stockout-notes-input"
              rows={3}
              className="stock-notes-textarea"
              placeholder="Add details regarding this stock out..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Stacked Cards (Stock impact + Product) */}
        <div className="stock-out-side-col">
          {/* Card 1: Stock impact */}
          <div className="stock-out-side-card">
            <h2 className="stock-side-title">Stock impact</h2>

            {/* Impact numbers container */}
            <div className="stock-impact-box">
              {/* CURRENT */}
              <div className="stock-impact-col">
                <span className="stock-impact-label">CURRENT</span>
                <span className="stock-impact-val">{currentStock}</span>
              </div>

              {/* Purple arrow */}
              <div className="stock-impact-arrow">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>

              {/* AFTER (Red text) */}
              <div className="stock-impact-col">
                <span className="stock-impact-label">AFTER</span>
                <span className="stock-impact-val-after">{afterStock}</span>
              </div>
            </div>

            {/* Reorder Warning Banner */}
            {isBelowReorder && (
              <div className="stock-out-reorder-banner">
                <svg
                  className="stock-reorder-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="stock-reorder-text">
                  Resulting stock ({afterStock}) will fall below the reorder point of{" "}
                  {product.reorderPoint} units for this product at {selectedWarehouse}.
                  Consider creating a restock request.
                </div>
              </div>
            )}

            {/* Over-stock warning if quantity exceeds current */}
            {isOverStock && (
              <div className="stock-adjust-warning-banner" style={{ marginTop: 12 }}>
                <strong>Warning:</strong> Quantity ({quantity} units) exceeds available stock ({currentStock} units).
              </div>
            )}
          </div>

          {/* Card 2: Product Card */}
          <div className="stock-out-side-card">
            <h2 className="stock-side-title">Product</h2>

            <div className="stock-out-product-row">
              {/* 3D Box Icon Thumbnail */}
              <div className="stock-product-card-thumb">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2.5L3.5 7.2L12 12L20.5 7.2L12 2.5Z" fill="#E2A669" />
                  <path d="M3.5 7.2L12 12V21.5L3.5 16.7V7.2Z" fill="#C68244" />
                  <path d="M20.5 7.2L12 12V21.5L20.5 16.7V7.2Z" fill="#B36E32" />
                  <path d="M10 3.6L14 5.8V11.2L10 9V3.6Z" fill="#F8DFB5" opacity="0.85" />
                  <path d="M10 9L14 11.2V20.5L10 18.3V9Z" fill="#E8C795" opacity="0.85" />
                </svg>
              </div>

              <div className="stock-product-card-info">
                <h3 className="stock-product-card-name">{product.name}</h3>
                <p className="stock-product-card-meta">
                  {product.category} • SKU {product.sku}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {askFirst && (
        <div style={{ margin: "0 0 4px" }}>
          <ApprovalChainCard chain={chain} helpText={CHAIN_HELP_STOCK} />
        </div>
      )}
      <div className="page-form-actions">
        <div className="stock-out-actions">
          <button
            type="button"
            className="stock-out-btn-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="stock-out-btn-confirm"
            onClick={handleConfirmStockOut}
            disabled={submitting}
          >
            {submitting ? "Processing..." : askFirst ? "Submit Request" : "Confirm Stock Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StockOutPage(props: React.ComponentProps<typeof StockOutPageInner>) {
  return (
    <StockGate productId={props.productId}>
      <StockOutPageInner {...props} />
    </StockGate>
  );
}
