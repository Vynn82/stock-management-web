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
interface TransferStockPageProps {
  productId?: string;
}

function TransferStockPageInner({ productId = "1" }: TransferStockPageProps) {
  const router = useRouter();
  const { items, getItem, recordTransfer, warehouseNames } = useStockStore();
  const [messageApi, contextHolder] = message.useMessage();

  // Selected product
  const [selectedProductId, setSelectedProductId] = useState<string>(productId);
  const product: DetailedStockItem = useMemo(() => {
    return getItem(selectedProductId) || items[0];
  }, [getItem, selectedProductId, items]);

  // Form states matching screenshot
  const [sourceWarehouse, setSourceWarehouse] = useState<string>(
    product.warehouses[0]?.warehouse || warehouseNames[0] || ""
  );
  const [targetWarehouse, setTargetWarehouse] = useState<string>(
    product.warehouses[1]?.warehouse || warehouseNames.find((n) => n !== product.warehouses[0]?.warehouse) || ""
  );
  const [transferQty, setTransferQty] = useState<number>(18);
  const [notes, setNotes] = useState<string>(
    ""
  );
  const [submitting, setSubmitting] = useState(false);
  const askFirst = useNeedsApproval("STOCK_TRANSFER");
  const chain = useApprovalChain(askFirst);

  // Available warehouses list
  const warehouseOptions = useMemo(() => {
    if (product.warehouses && product.warehouses.length > 0) {
      return product.warehouses.map((w) => w.warehouse);
    }
    return warehouseNames;
  }, [product, warehouseNames]);

  // Destination options (exclude source warehouse)
  const destinationOptions = useMemo(() => {
    return warehouseNames.filter((w) => w !== sourceWarehouse);
  }, [sourceWarehouse, warehouseNames]);

  // Source warehouse stock calculations
  const sourceStock = useMemo(() => {
    const wh = product.warehouses.find((w) => w.warehouse === sourceWarehouse);
    const onHand = wh?.onHand ?? 0;
    const reserved = wh?.reserved ?? 0;
    const available = Math.max(0, onHand - reserved);
    return { onHand, reserved, available };
  }, [product, sourceWarehouse]);

  // Calculated remaining units
  const remainingAvailable = sourceStock.available - transferQty;
  const remainingOnHand = sourceStock.onHand - transferQty;
  const isOverQuantity = transferQty > sourceStock.available;

  // Handle transfer submission
  const handleConfirmTransfer = async () => {
    if (sourceWarehouse === targetWarehouse) {
      messageApi.error("Source and destination warehouses cannot be the same.");
      return;
    }

    if (transferQty <= 0) {
      messageApi.error("Please enter a valid transfer quantity greater than 0.");
      return;
    }

    if (transferQty > sourceStock.available) {
      messageApi.error(
        `Insufficient available stock! Only ${sourceStock.available} units available at ${sourceWarehouse}.`
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
      const outcome = await recordTransfer(
        product.id,
        sourceWarehouse,
        targetWarehouse,
        transferQty,
        notes.trim() || "Stock Transfer",
        askFirst ? chain.payload() : undefined
      );
      if (outcome === "requested") {
        messageApi.success(REQUEST_SENT_MESSAGE);
        setTimeout(() => router.push("/requests"), 900);
        return;
      }
      messageApi.success(
        `Successfully transferred ${transferQty} units to ${targetWarehouse}.`
      );
      setTimeout(() => {
        router.push(`/stock/${product.id}`);
      }, 700);
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : "An error occurred while processing the transfer.");
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/stock/${product.id}`);
  };

  return (
    <div className="stock-transfer-page-container">
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
        <span className="stock-breadcrumb-current">Transfer Stock</span>
      </nav>

      {/* Page Header Bar */}
      <div className="stock-transfer-header">
        <h1 className="stock-transfer-title">Transfer Stock</h1>

      </div>

      {/* Two-Column Layout */}
      <div className="stock-transfer-grid">
        {/* Left Column: Transfer details form */}
        <div className="stock-transfer-main-card">
          <h2 className="stock-section-title">Transfer details</h2>

          {/* Product Selector */}
          <div className="stock-form-field">
            <label htmlFor="product-select" className="stock-field-label">
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
                id="product-select"
                className="stock-select-overlay"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const p = getItem(e.target.value);
                  if (p?.warehouses[0]) {
                    setSourceWarehouse(p.warehouses[0].warehouse);
                    const dest =
                      p.warehouses.find((w) => w.warehouse !== p.warehouses[0].warehouse)
                        ?.warehouse ||
                      warehouseNames.find((n) => n !== p.warehouses[0].warehouse) ||
                      "";
                    setTargetWarehouse(dest);
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

          {/* Quantity Input */}
          <div className="stock-form-field" style={{ marginTop: 18 }}>
            <label htmlFor="quantity-input" className="stock-field-label">
              Quantity
            </label>
            <div className="stock-qty-input-wrap">
              <input
                id="quantity-input"
                type="number"
                min={1}
                max={sourceStock.available}
                className="stock-qty-input"
                value={transferQty}
                onChange={(e) => setTransferQty(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span className="stock-qty-suffix">units</span>
            </div>
          </div>

          {/* Route Section */}
          <div className="stock-route-section">
            <h3 className="stock-route-title">Route</h3>

            <div className="stock-route-box">
              {/* FROM WAREHOUSE */}
              <div className="stock-route-col">
                <span className="stock-route-sublabel">FROM WAREHOUSE</span>
                <div className="stock-warehouse-select-wrap">
                  <SearchSelect
                    className="stock-warehouse-select"
                    value={sourceWarehouse}
                    onChange={(e) => {
                      const nextSrc = e.target.value;
                      setSourceWarehouse(nextSrc);
                      if (nextSrc === targetWarehouse) {
                        const fallback =
                          destinationOptions.find((w) => w !== nextSrc) || "";
                        setTargetWarehouse(fallback);
                      }
                    }}
                  >
                    {warehouseOptions.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </SearchSelect>
                  <svg
                    className="stock-select-chevron"
                    width="12"
                    height="12"
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

              {/* Purple Arrow in Between */}
              <div className="stock-route-arrow-wrap">
                <svg
                  width="18"
                  height="18"
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

              {/* TO WAREHOUSE */}
              <div className="stock-route-col">
                <span className="stock-route-sublabel">TO WAREHOUSE</span>
                <div className="stock-warehouse-select-wrap">
                  <SearchSelect
                    className="stock-warehouse-select"
                    value={targetWarehouse}
                    onChange={(e) => setTargetWarehouse(e.target.value)}
                  >
                    {destinationOptions.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </SearchSelect>
                  <svg
                    className="stock-select-chevron"
                    width="12"
                    height="12"
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
          </div>

          {/* Notes Section */}
          <div className="stock-form-field" style={{ marginTop: 22 }}>
            <label htmlFor="notes-input" className="stock-field-label">
              Notes
            </label>
            <textarea
              id="notes-input"
              rows={3}
              className="stock-notes-textarea"
              placeholder="Add reason, courier details, or authorization note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Current stock — source summary */}
        <div className="stock-transfer-side-card">
          <h2 className="stock-side-title">Current stock — source</h2>
          <div className="stock-side-warehouse-name">{sourceWarehouse}</div>

          <div className="stock-side-metrics">
            <div className="stock-side-metric-row">
              <span className="stock-side-metric-label">On hand</span>
              <strong className="stock-side-metric-val">{sourceStock.onHand} units</strong>
            </div>

            <div className="stock-side-metric-row">
              <span className="stock-side-metric-label">Reserved</span>
              <strong className="stock-side-metric-val">{sourceStock.reserved} units</strong>
            </div>

            <div className="stock-side-metric-row" style={{ borderBottom: "none" }}>
              <span className="stock-side-metric-label">Available</span>
              <strong className="stock-side-metric-val">{sourceStock.available} units</strong>
            </div>
          </div>

          {/* Bottom Banner Note */}
          <div
            className={`stock-transfer-info-banner ${
              isOverQuantity ? "banner-warning" : ""
            }`}
          >
            {isOverQuantity ? (
              <span>
                <strong>Warning:</strong> Transfer quantity ({transferQty} units) exceeds available stock ({sourceStock.available} units).
              </span>
            ) : (
              <span>
                After this transfer,{" "}
                <strong>{Math.max(0, remainingOnHand)} units</strong> will remain available at {sourceWarehouse}.
              </span>
            )}
          </div>
        </div>
      </div>
      {askFirst && (
        <div style={{ margin: "0 0 4px" }}>
          <ApprovalChainCard chain={chain} helpText={CHAIN_HELP_STOCK} />
        </div>
      )}
      <div className="page-form-actions">
        <div className="stock-transfer-actions">
          <button
            type="button"
            className="stock-transfer-btn-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="stock-transfer-btn-confirm"
            onClick={handleConfirmTransfer}
            disabled={submitting}
          >
            {submitting ? "Transferring..." : askFirst ? "Submit Request" : "Confirm Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransferStockPage(props: React.ComponentProps<typeof TransferStockPageInner>) {
  return (
    <StockGate productId={props.productId}>
      <TransferStockPageInner {...props} />
    </StockGate>
  );
}
