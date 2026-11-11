"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { REQUEST_SENT_MESSAGE, useLiveStock } from "@/features/stock/stock-live";
import { useNeedsApproval } from "@/hooks/use-needs-approval";
import { useApprovalChain } from "@/features/requests/use-approval-chain";
import ApprovalChainCard, { CHAIN_HELP_STOCK } from "@/components/requests/ApprovalChainCard";
import SearchSelect from "@/components/ui/SearchSelect";

import BackButton from "@/components/ui/BackButton";
const REASONS = ["Supplier restock", "Purchase order received", "Customer return", "Found during count", "Other"];

const BOX_ICON = (size: number) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2.5L3.5 7.2L12 12L20.5 7.2L12 2.5Z" fill="#E2A669" />
    <path d="M3.5 7.2L12 12V21.5L3.5 16.7V7.2Z" fill="#C68244" />
    <path d="M20.5 7.2L12 12V21.5L20.5 16.7V7.2Z" fill="#B36E32" />
    <path d="M10 3.6L14 5.8V11.2L10 9V3.6Z" fill="#F8DFB5" opacity="0.85" />
    <path d="M10 9L14 11.2V20.5L10 18.3V9Z" fill="#E8C795" opacity="0.85" />
  </svg>
);

const CHEVRON = (
  <svg className="stock-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function StockInPage({ productId }: { productId?: string }) {
  const router = useRouter();
  const live = useLiveStock();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    void live.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const products = live.products;
  const warehouses = live.warehouses;

  const [selectedId, setSelectedId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [warehouseCode, setWarehouseCode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pick the product from the route once the list has loaded.
  useEffect(() => {
    if (selectedId || products.length === 0) return;
    const wanted = productId && products.find((p) => p.id === productId);
    setSelectedId((wanted || products[0]).id);
  }, [products, productId, selectedId]);

  useEffect(() => {
    if (!warehouseCode && warehouses.length > 0) setWarehouseCode(warehouses[0].code);
  }, [warehouses, warehouseCode]);

  const product = useMemo(() => products.find((p) => p.id === selectedId), [products, selectedId]);
  const variants = product?.variants ?? [];
  const variant = variants.find((v) => v.id === variantId);

  // A product with variants: always have one chosen.
  useEffect(() => {
    if (variants.length === 0) {
      if (variantId) setVariantId("");
      return;
    }
    if (!variants.some((v) => v.id === variantId)) setVariantId(variants[0].id);
  }, [variants, variantId]);

  const photo = variant?.image ?? product?.image ?? variants.find((v) => v.image)?.image;
  const warehouseName = warehouses.find((w) => w.code === warehouseCode)?.name ?? "";

  const currentStock = useMemo(() => {
    if (!product) return 0;
    if (variant) return variant.byWarehouse[warehouseCode] ?? 0;
    return product.warehouses.find((w) => w.code === warehouseCode)?.qty ?? 0;
  }, [product, variant, warehouseCode]);
  const afterStock = currentStock + (quantity || 0);

  const askFirst = useNeedsApproval("STOCK_ADJUST");
  const chain = useApprovalChain(askFirst);

  const handleConfirm = async () => {
    if (!product) return;
    if (!warehouseCode) return void messageApi.error("Choose the warehouse the stock goes into.");
    if (variants.length > 0 && !variant) return void messageApi.error("Choose a variant.");
    if (!quantity || quantity < 1) return void messageApi.error("Enter a quantity of at least 1.");

    if (askFirst) {
      const chainError = chain.validate();
      if (chainError) {
        messageApi.error(chainError);
        return;
      }
    }

    setSubmitting(true);
    try {
      const reasonText = notes.trim() ? `${reason} — ${notes.trim()}` : reason;
      const outcome = await live.stockIn(product, warehouseCode, quantity, reasonText, variant?.code, askFirst ? chain.payload() : undefined);
      if (outcome === "requested") {
        messageApi.success(REQUEST_SENT_MESSAGE);
        setTimeout(() => router.push("/requests"), 900);
        return;
      }
      messageApi.success(`Added ${quantity} units of ${variant ? `${product.name} (${variant.name})` : product.name} to ${warehouseName}.`);
      setTimeout(() => router.push("/stock"), 700);
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : "Could not record the stock in.");
      setSubmitting(false);
    }
  };

  if (!live.loaded) {
    return (
      <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--muted)" }} role={live.error ? "alert" : "status"}>
        <p style={{ margin: "0 0 14px" }}>{live.error || "Loading stock…"}</p>
        {live.error && (
          <button type="button" className="stock-action-btn" onClick={() => void live.load(true)}>
            Try again
          </button>
        )}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--muted)" }}>
        <p style={{ margin: "0 0 14px" }}>No products yet.</p>
        <Link href="/products/create">Create a product</Link>
      </div>
    );
  }
  if (!product) return null;

  return (
    <div className="stock-out-page-container">
      {contextHolder}

      <BackButton href="/stock" />
      <nav className="stock-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/stock" className="stock-breadcrumb-link">
          Stock
        </Link>
        <span className="stock-breadcrumb-separator">/</span>
        <span className="stock-breadcrumb-current">Stock In</span>
      </nav>

      <div className="stock-out-header">
        <h1 className="stock-out-title">Stock In</h1>
      </div>

      <div className="stock-out-grid">
        <div className="stock-out-main-card">
          <h2 className="stock-section-title">Stock in details</h2>

          <div className="stock-form-field">
            <label htmlFor="stockin-product-select" className="stock-field-label">
              Product
            </label>
            <div className="stock-product-select-wrap">
              <div className="stock-product-select-left">
                <div className="stock-select-thumb" style={{ overflow: "hidden" }}>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    BOX_ICON(20)
                  )}
                </div>
                <span className="stock-select-product-name">{product.name}</span>
              </div>
              <SearchSelect
                id="stockin-product-select"
                className="stock-select-overlay"
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setVariantId("");
                }}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </SearchSelect>
              {CHEVRON}
            </div>
          </div>

          {variants.length > 0 && (
            <div className="stock-form-field" style={{ marginTop: 18 }}>
              <label htmlFor="stockin-variant-select" className="stock-field-label">
                Variant
              </label>
              <div className="stock-input-select-wrap">
                <SearchSelect id="stockin-variant-select" className="stock-native-select" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name || v.code}
                    </option>
                  ))}
                </SearchSelect>
                {CHEVRON}
              </div>
            </div>
          )}

          <div className="stock-form-row" style={{ marginTop: 18 }}>
            <div className="stock-form-field">
              <label htmlFor="stockin-warehouse-select" className="stock-field-label">
                Destination warehouse
              </label>
              <div className="stock-input-select-wrap">
                <SearchSelect id="stockin-warehouse-select" className="stock-native-select" value={warehouseCode} onChange={(e) => setWarehouseCode(e.target.value)}>
                  {warehouses.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </SearchSelect>
                {CHEVRON}
              </div>
            </div>

            <div className="stock-form-field">
              <label htmlFor="stockin-quantity-input" className="stock-field-label">
                Quantity received
              </label>
              <div className="stock-qty-input-wrap">
                <input
                  id="stockin-quantity-input"
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

          <div className="stock-form-field" style={{ marginTop: 18 }}>
            <label htmlFor="stockin-reason-select" className="stock-field-label">
              Reason
            </label>
            <div className="stock-input-select-wrap">
              <select id="stockin-reason-select" className="stock-native-select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {CHEVRON}
            </div>
          </div>

          <div className="stock-form-field" style={{ marginTop: 18 }}>
            <label htmlFor="stockin-notes-input" className="stock-field-label">
              Reference / PO # / Supplier (optional)
            </label>
            <textarea
              id="stockin-notes-input"
              rows={3}
              className="stock-notes-textarea"
              placeholder="e.g. Supplier PO #4092"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="stock-out-side-col">
          <div className="stock-out-side-card">
            <h2 className="stock-side-title">Stock impact</h2>
            <div className="stock-impact-box">
              <div className="stock-impact-col">
                <span className="stock-impact-label">CURRENT</span>
                <span className="stock-impact-val">{currentStock}</span>
              </div>
              <div className="stock-impact-arrow">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
              <div className="stock-impact-col">
                <span className="stock-impact-label">AFTER</span>
                <span className="stock-impact-val-after" style={{ color: "#16a34a" }}>
                  {afterStock}
                </span>
              </div>
            </div>
          </div>

          <div className="stock-out-side-card">
            <h2 className="stock-side-title">Product</h2>
            <div className="stock-out-product-row">
              <div className="stock-product-card-thumb" style={{ overflow: "hidden" }}>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  BOX_ICON(24)
                )}
              </div>
              <div className="stock-product-card-info">
                <h3 className="stock-product-card-name">{variant ? `${product.name} — ${variant.name}` : product.name}</h3>
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
          <button type="button" className="stock-out-btn-cancel" onClick={() => router.push("/stock")}>
            Cancel
          </button>
          <button type="button" className="stock-out-btn-confirm" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Processing..." : askFirst ? "Submit Request" : "Confirm Stock In"}
          </button>
        </div>
      </div>
    </div>
  );
}
