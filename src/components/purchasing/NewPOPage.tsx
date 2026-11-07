"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HomeOutlined,
  DownOutlined,
  PlusOutlined,
  CloseOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { LiveState, errorText } from "@/components/common/live-state";
import { suppliersApi, warehousesApi, type SupplierRow, type WarehouseRow } from "@/features/live/master-data";
import {
  createPo,
  fetchPurchaseOrder,
  updatePo,
  fetchApprovers,
  fetchOrderableProducts,
  type Approver,
  type OrderableProduct,
} from "@/features/purchasing/purchasing-live";
import { formatCurrency } from "./purchasing-data";
import { ImportModal, ReorderModal, SupplierCompareModal } from "./PoTools";
import type { ImportRow, ReorderItem, SupplierOption } from "@/features/purchasing/purchasing-live";
import SearchSelect from "@/components/ui/SearchSelect";

interface DraftLine {
  key: string;
  productCode?: string;
  variantCode?: string;
  newProduct?: { name: string; categoryCode: string; brandCode?: string; unit?: string; sku?: string };
  label: string;
  qty: number;
  unitCost: number;
  lineTotal: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function NewPOPage({ orderId }: { orderId?: string }) {
  const editing = Boolean(orderId);
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [products, setProducts] = useState<OrderableProduct[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [supplierCode, setSupplierCode] = useState("");
  const [warehouseCode, setWarehouseCode] = useState("");
  const [approverId, setApproverId] = useState("");
  const [lineItems, setLineItems] = useState<DraftLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // New item draft inputs for inline adding
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newQty, setNewQty] = useState<number>(50);
  const [newUnitCost, setNewUnitCost] = useState<number>(0);

  // Order helpers (reorder suggestions / supplier comparison / Excel import)
  const [showReorder, setShowReorder] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [compareFor, setCompareFor] = useState<OrderableProduct | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [sup, wh, prod] = await Promise.all([suppliersApi.list(), warehousesApi.list(), fetchOrderableProducts()]);
      setSuppliers(sup);
      setWarehouses(wh);
      setProducts(prod);
      if (orderId) {
        const po = await fetchPurchaseOrder(orderId);
        if (po.status !== "DRAFT") {
          setLoadError("Only a draft purchase order can be edited.");
          return;
        }
        setSupplierCode(po.supplier.code);
        setWarehouseCode(po.warehouse.code);
        setLineItems(
          po.items.map((i) => ({
            key: !i.productCode && i.newProduct ? `new|${i.newProduct.name}|${i.newProduct.categoryCode}` : i.variantCode ? `${i.productCode}|${i.variantCode}` : String(i.productCode),
            productCode: i.productCode ?? undefined,
            newProduct:
              !i.productCode && i.newProduct && i.newProduct.categoryCode
                ? {
                    name: i.newProduct.name,
                    categoryCode: i.newProduct.categoryCode,
                    brandCode: i.newProduct.brandCode ?? undefined,
                    unit: i.newProduct.unit ?? undefined,
                    sku: i.newProduct.sku ?? undefined,
                  }
                : undefined,
            variantCode: i.variantCode ?? undefined,
            label: i.label,
            qty: i.quantity,
            unitCost: i.unitPrice,
            lineTotal: i.quantity * i.unitPrice,
          })),
        );
      } else {
        setSupplierCode((cur) => cur || sup[0]?.code || "");
        setWarehouseCode((cur) => cur || wh[0]?.code || "");
      }
      // Approvers need their own permission; the form still works without the list.
      fetchApprovers()
        .then((list) => {
          setApprovers(list);
          setApproverId((cur) => cur || list[0]?.id || "");
        })
        .catch(() => setApprovers([]));
    } catch (e) {
      setLoadError(errorText(e, "Couldn't load suppliers, warehouses and products."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const supplierInfo = useMemo(() => suppliers.find((s) => s.code === supplierCode), [suppliers, supplierCode]);
  const orderTotal = lineItems.reduce((acc, item) => acc + item.lineTotal, 0);

  const handleDeleteItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePickProduct = (key: string) => {
    setNewKey(key);
    const found = products.find((p) => p.key === key);
    if (found) setNewUnitCost(found.unitPrice);
  };

  const handleAddLineItem = () => {
    const found = products.find((p) => p.key === newKey);
    if (!found) {
      setIsAddingItem(true);
      return;
    }
    if (lineItems.some((l) => l.key === found.key)) {
      setSaveError(`${found.label} is already on this order.`);
      return;
    }
    setSaveError("");
    setLineItems((prev) => [
      ...prev,
      {
        key: found.key,
        productCode: found.productCode,
        variantCode: found.variantCode,
        label: found.label,
        qty: newQty,
        unitCost: newUnitCost,
        lineTotal: newQty * newUnitCost,
      },
    ]);
    setNewKey("");
    setNewQty(50);
    setNewUnitCost(0);
    setIsAddingItem(false);
  };

  const mergeLines = (incoming: DraftLine[]) => {
    setLineItems((prev) => {
      const have = new Set(prev.map((l) => l.key));
      return [...prev, ...incoming.filter((l) => !have.has(l.key))];
    });
  };

  const addFromReorder = (items: ReorderItem[]) => {
    const lines: DraftLine[] = [];
    for (const it of items) {
      const qty = Math.max(it.suggestedQuantity, 1);
      if (it.hasVariants) {
        // Split the suggested quantity across the variants; remove the ones you don't need.
        const vs = products.filter((p) => p.productCode === it.code && p.variantCode);
        if (vs.length === 0) continue;
        const each = Math.max(Math.ceil(qty / vs.length), 1);
        for (const v of vs) {
          lines.push({ key: v.key, productCode: v.productCode, variantCode: v.variantCode, label: v.label, qty: each, unitCost: v.unitPrice, lineTotal: each * v.unitPrice });
        }
      } else {
        const prod = products.find((p) => p.key === it.code);
        if (!prod) continue;
        lines.push({ key: prod.key, productCode: prod.productCode, label: prod.label, qty, unitCost: prod.unitPrice, lineTotal: qty * prod.unitPrice });
      }
    }
    mergeLines(lines);
  };

  const addFromImport = (rows: ImportRow[]) => {
    const lines: DraftLine[] = [];
    for (const r of rows) {
      if (r.quantity === null) continue;
      if (r.isNew) {
        if (!r.productName || !r.categoryCode) continue;
        const price = r.unitPrice ?? 0;
        lines.push({
          key: `new|${r.productName}|${r.categoryCode}`,
          newProduct: { name: r.productName, categoryCode: r.categoryCode, unit: r.unit ?? undefined, sku: r.sku ?? undefined },
          label: `${r.productName} (new product)`,
          qty: r.quantity,
          unitCost: price,
          lineTotal: r.quantity * price,
        });
        continue;
      }
      if (!r.productCode) continue;
      const key = r.variantCode ? `${r.productCode}|${r.variantCode}` : r.productCode;
      const prod = products.find((p) => p.key === key);
      const price = r.unitPrice ?? prod?.unitPrice ?? 0;
      lines.push({
        key,
        productCode: r.productCode,
        variantCode: r.variantCode ?? undefined,
        label: prod?.label ?? [r.productName, r.variantName].filter(Boolean).join(" — "),
        qty: r.quantity,
        unitCost: price,
        lineTotal: r.quantity * price,
      });
    }
    mergeLines(lines);
  };

  const pickSupplier = (s: SupplierOption) => {
    if (suppliers.some((x) => x.code === s.code)) setSupplierCode(s.code);
    setNewUnitCost(s.lastPrice);
    setCompareFor(null);
  };

  const savePO = async (submit: boolean) => {
    setSaveError("");
    if (!supplierCode || !warehouseCode) {
      setSaveError("Choose a supplier and a warehouse.");
      return;
    }
    if (lineItems.length === 0) {
      setSaveError("Add at least one line item.");
      return;
    }
    setSaving(true);
    try {
      const save = orderId ? (input: Parameters<typeof createPo>[0]) => updatePo(orderId, input) : createPo;
      const created = await save({
        supplierCode,
        warehouseCode,
        submit,
        approverId: approverId || undefined,
        items: lineItems.map((l) => ({ productCode: l.productCode, variantCode: l.variantCode, newProduct: l.newProduct, quantity: l.qty, unitPrice: l.unitCost })),
      });
      router.push(`/purchasing/${created.id}`);
    } catch (e) {
      setSaveError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    void savePO(true);
  };

  if (loading || loadError) {
    return (
      <div className="purchasing-page po-new-page">
        <LiveState loading={loading} error={loadError} onRetry={load} loadingText="Loading suppliers, warehouses and products…" />
      </div>
    );
  }

  return (
    <div className="purchasing-page po-new-page">
      <form onSubmit={handleSavePO}>
        {/* Top Header & Breadcrumb */}
        <div className="po-new-header">
          <div className="po-new-header-left">
            <nav className="po-detail-breadcrumb" aria-label="Breadcrumb">
              <Link href="/purchasing" className="po-detail-breadcrumb-link">
                Purchase Orders
              </Link>
              <span className="po-detail-breadcrumb-sep">/</span>
              <span className="po-detail-breadcrumb-curr">{editing ? "Edit PO" : "New PO"}</span>
            </nav>
            <h1 className="po-detail-title">{editing ? "Edit Purchase Order" : "New Purchase Order"}</h1>
          </div>

          <div className="po-new-header-actions">
            <Link href={orderId ? `/purchasing/${orderId}` : "/purchasing"} className="po-new-cancel-btn">
              Cancel
            </Link>
            <button type="button" className="po-new-cancel-btn" disabled={saving || loading} onClick={() => void savePO(false)}>
              Save as draft
            </button>
            <button type="submit" className="po-new-save-btn" disabled={saving || loading}>
              {saving ? "Saving…" : "Save Purchase Order"}
            </button>
          </div>
        </div>

        {/* 2-column Grid */}
        <div className="po-new-grid">
          {/* Left Column */}
          <div className="po-new-main">
            {/* Top Card: Supplier & Expected delivery */}
            <div className="po-card po-new-form-card">
              <div className="po-new-form-row">
                {/* Supplier select */}
                <div className="po-new-field">
                  <label htmlFor="po-supplier-select">Supplier</label>
                  <div className="po-new-select-wrap">
                    <SearchSelect
                      id="po-supplier-select"
                      value={supplierCode}
                      onChange={(e) => setSupplierCode(e.target.value)}
                      className="po-new-select"
                    >
                      {suppliers.map((sup) => (
                        <option key={sup.code} value={sup.code}>
                          {sup.name}
                        </option>
                      ))}
                    </SearchSelect>
                    <DownOutlined className="po-new-select-chevron" />
                  </div>
                </div>

                {/* Warehouse the goods are delivered to */}
                <div className="po-new-field">
                  <label htmlFor="po-warehouse-select">Deliver to warehouse</label>
                  <div className="po-new-select-wrap">
                    <SearchSelect
                      id="po-warehouse-select"
                      value={warehouseCode}
                      onChange={(e) => setWarehouseCode(e.target.value)}
                      className="po-new-select"
                    >
                      {warehouses.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.name}
                        </option>
                      ))}
                    </SearchSelect>
                    <HomeOutlined className="po-new-select-chevron" />
                  </div>
                </div>

                {approvers.length > 0 && (
                  <div className="po-new-field">
                    <label htmlFor="po-approver-select">Send for approval to</label>
                    <div className="po-new-select-wrap">
                      <SearchSelect
                        id="po-approver-select"
                        value={approverId}
                        onChange={(e) => setApproverId(e.target.value)}
                        className="po-new-select"
                      >
                        {approvers.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </SearchSelect>
                      <DownOutlined className="po-new-select-chevron" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Card: Line items */}
            <div className="po-card po-new-items-card">
              <h2 className="po-card-title">Line items</h2>

              <div className="po-new-table-wrap">
                <table className="po-new-table">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: "42%" }}>
                        PRODUCT
                      </th>
                      <th scope="col" style={{ width: "16%" }}>
                        QUANTITY
                      </th>
                      <th scope="col" style={{ width: "20%" }}>
                        UNIT COST
                      </th>
                      <th scope="col" style={{ width: "17%" }}>
                        LINE TOTAL
                      </th>
                      <th scope="col" style={{ width: "5%" }}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => (
                      <tr key={item.key}>
                        <td className="po-line-product">{item.label}</td>
                        <td className="po-line-qty">{item.qty}</td>
                        <td className="po-line-unit-cost">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="po-line-total">
                          {formatCurrency(item.lineTotal)}
                        </td>
                        <td className="po-line-action">
                          <button
                            type="button"
                            className="po-line-delete-btn"
                            onClick={() => handleDeleteItem(idx)}
                            aria-label={`Remove ${item.label}`}
                          >
                            <CloseOutlined />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Inline row addition if adding */}
                    {isAddingItem && (
                      <tr className="po-new-inline-add-row">
                        <td>
                          <SearchSelect
                            value={newKey}
                            onChange={(e) => handlePickProduct(e.target.value)}
                            className="po-inline-input"
                            autoFocus
                          >
                            <option value="">Choose a product…</option>
                            {products.map((p) => (
                              <option key={p.key} value={p.key}>
                                {p.label}
                              </option>
                            ))}
                          </SearchSelect>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={newQty}
                            onChange={(e) =>
                              setNewQty(parseInt(e.target.value) || 1)
                            }
                            className="po-inline-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newUnitCost}
                            onChange={(e) =>
                              setNewUnitCost(parseFloat(e.target.value) || 0)
                            }
                            className="po-inline-input"
                          />
                        </td>
                        <td className="po-line-total">
                          {formatCurrency(newQty * newUnitCost)}
                        </td>
                        <td className="po-line-action">
                          <button
                            type="button"
                            className="po-inline-confirm-btn"
                            onClick={handleAddLineItem}
                            title="Add item"
                          >
                            ✓
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add line item button */}
              <button
                type="button"
                className="po-add-line-btn"
                onClick={() => {
                  if (isAddingItem) {
                    handleAddLineItem();
                  } else {
                    setIsAddingItem(true);
                  }
                }}
              >
                <PlusOutlined /> Add line item
              </button>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button type="button" className="po-new-cancel-btn" onClick={() => setShowReorder(true)}>
                  Reorder suggestions
                </button>
                <button type="button" className="po-new-cancel-btn" onClick={() => setShowImport(true)}>
                  Import from Excel
                </button>
                {isAddingItem && newKey && (
                  <button
                    type="button"
                    className="po-new-cancel-btn"
                    onClick={() => {
                      const prod = products.find((p) => p.key === newKey);
                      if (prod?.productId) setCompareFor(prod);
                    }}
                  >
                    Compare suppliers
                  </button>
                )}
              </div>

              <ReorderModal open={showReorder} warehouseCode={warehouseCode} onClose={() => setShowReorder(false)} onAdd={addFromReorder} />
              <ImportModal open={showImport} onClose={() => setShowImport(false)} onAdd={addFromImport} />
              <SupplierCompareModal
                productId={compareFor?.productId ?? null}
                productLabel={compareFor?.label ?? ""}
                onClose={() => setCompareFor(null)}
                onPick={pickSupplier}
              />

              {/* Order total footer */}
              <div className="po-new-order-total-wrap">
                <span className="po-new-order-total">
                  Order total:{" "}
                  <strong>{formatCurrency(orderTotal)}</strong>
                </span>
                {saveError && (
                  <span role="alert" style={{ display: "block", color: "#dc2626", fontSize: 12, marginTop: 8 }}>
                    {saveError}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Supplier contact */}
          <div className="po-new-sidebar">
            <div className="po-card po-new-contact-card">
              <h2 className="po-card-title">Supplier contact</h2>

              <div className="po-new-supplier-block">
                <div className="po-new-avatar-box" aria-hidden="true">
                  {getInitials(supplierInfo?.name ?? "—")}
                </div>
                <div className="po-new-supplier-copy">
                  <strong className="po-new-supplier-name">
                    {supplierInfo?.name ?? "—"}
                  </strong>
                  <span className="po-new-supplier-sub">
                    {supplierInfo?.contactPerson || "No contact person"}
                  </span>
                </div>
              </div>

              <div className="po-new-contact-details">
                <div className="po-new-contact-row">
                  <MailOutlined className="po-new-contact-icon" />
                  <span className="po-new-contact-text">
                    {supplierInfo?.email || "—"}
                  </span>
                </div>
                <div className="po-new-contact-row">
                  <PhoneOutlined className="po-new-contact-icon" />
                  <span className="po-new-contact-text">
                    {supplierInfo?.phone || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
