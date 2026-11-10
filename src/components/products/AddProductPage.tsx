"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { ApiError } from "@/features/live/http";
import { LookupOption, fetchBrands, fetchCategories, fetchSuppliers, fetchWarehouses } from "@/features/live/lookups";
import { createProduct, NewVariantInput } from "@/features/products/products-live.api";
import VariantImagePicker from "./VariantImagePicker";
import { useNeedsApproval } from "@/hooks/use-needs-approval";
import SearchSelect from "@/components/ui/SearchSelect";

import BackButton from "@/components/ui/BackButton";
interface AddProductPageProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

const num = (v: string): number | undefined => {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

/** A price is digits with at most 2 decimals, and must be above 0. Returns the problem, or "" when fine. */
const PRICE_RE = /^\d+(\.\d{1,2})?$/;
function priceError(value: string, label: string): string {
  const t = value.trim();
  if (!t) return `${label} is required.`;
  if (!PRICE_RE.test(t)) return `${label} must be a number with up to 2 decimals.`;
  if (Number(t) <= 0) return `${label} must be greater than 0.`;
  return "";
}

/** While typing: only digits and one dot, at most 2 decimals and 9 digits before the dot. */
function cleanPrice(value: string): string {
  let t = value.replace(/[^0-9.]/g, "");
  const dot = t.indexOf(".");
  if (dot >= 0) t = t.slice(0, dot).slice(0, 9) + "." + t.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  else t = t.slice(0, 9);
  return t;
}

const INT_RE = /^\d+$/;
const LIMITS = { name: 200, sku: 100, barcode: 100, unit: 30 };

/** While typing: digits only (quantities and the reorder point are whole numbers). */
const cleanInt = (v: string) => v.replace(/\D/g, "").slice(0, 9);

type Errs = Record<string, string>;

function FieldError({ text }: { text?: string }) {
  return text ? (
    <span className="field-error" role="alert">
      {text}
    </span>
  ) : null;
}

function PriceField({
  id,
  label,
  value,
  onChange,
  submitted,
  lowerThan,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
  /** For the selling price: the cost entered next to it, to warn about selling at a loss. */
  lowerThan?: string;
}) {
  const [touched, setTouched] = useState(false);
  const shown = touched || submitted;
  const error = shown ? priceError(value, label) : "";
  const loss = !error && lowerThan !== undefined && !priceError(lowerThan, "Cost") && Number(value) < Number(lowerThan);
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label} ($) <span style={{ color: "#DC2626" }}>*</span>
      </label>
      <input
        id={id}
        type="text"
        className={`form-input${error ? " has-error" : ""}`}
        placeholder="0.00"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(cleanPrice(e.target.value))}
        onBlur={() => setTouched(true)}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="field-error" role="alert">{error}</span>}
      {loss && <span className="field-warning">Lower than the cost price — this would sell at a loss.</span>}
    </div>
  );
}

interface VariantDraft {
  key: number;
  name: string;
  sku: string;
  barcode: string;
  cost: string;
  sell: string;
  warehouseCode: string;
  quantity: string;
  location: string;
  image: File | null;
}

let variantKey = 0;
const newVariant = (): VariantDraft => ({ key: ++variantKey, name: "", sku: "", barcode: "", cost: "", sell: "", warehouseCode: "", quantity: "", location: "", image: null });

export default function AddProductPage({ onCancel, onSuccess }: AddProductPageProps) {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  // Lists behind the pickers
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [brands, setBrands] = useState<LookupOption[]>([]);
  const [suppliers, setSuppliers] = useState<LookupOption[]>([]);
  const [warehouses, setWarehouses] = useState<LookupOption[]>([]);
  const [loadError, setLoadError] = useState("");
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  // Form
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [brandCode, setBrandCode] = useState("");
  const [supplierCode, setSupplierCode] = useState("");
  const [unit, setUnit] = useState("PCS");
  const [description, setDescription] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [minStock, setMinStock] = useState("");
  const [warehouseCode, setWarehouseCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  // Staff (no PRODUCT_CREATE) send the product as a request that waits for approval.
  const askFirst = useNeedsApproval("PRODUCT_CREATE");
  const [submitted, setSubmitted] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantRows, setVariantRows] = useState<VariantDraft[]>([]);

  const toggleVariants = (on: boolean) => {
    setHasVariants(on);
    if (on && variantRows.length === 0) setVariantRows([newVariant()]);
  };
  const patchVariant = (key: number, patch: Partial<VariantDraft>) =>
    setVariantRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchBrands(), fetchSuppliers(), fetchWarehouses()])
      .then(([c, b, s, w]) => {
        setCategories(c);
        setBrands(b);
        setSuppliers(s);
        setWarehouses(w);
        setOptionsLoaded(true);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load categories and warehouses."));
  }, []);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      messageApi.error("Please upload an image file.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/products");
    }
  };

  /** Every rule the form must pass before saving (same checks as the mobile app). */
  const validateForm = (): { top: Errs; rows: Record<number, Errs>; count: number } => {
    const top: Errs = {};
    const rows: Record<number, Errs> = {};

    if (!productName.trim()) top.name = "Product name is required.";
    else if (productName.trim().length > LIMITS.name) top.name = `Product name is too long (max ${LIMITS.name} characters).`;
    if (!categoryCode) top.category = "Please choose a category.";
    if (sku.trim().length > LIMITS.sku) top.sku = `SKU is too long (max ${LIMITS.sku} characters).`;
    if (barcode.trim().length > LIMITS.barcode) top.barcode = `Barcode is too long (max ${LIMITS.barcode} characters).`;
    if (unit.trim().length > LIMITS.unit) top.unit = `Unit is too long (max ${LIMITS.unit} characters).`;
    if (minStock.trim() && !INT_RE.test(minStock.trim())) top.minStock = "Reorder point must be a whole number.";

    if (!hasVariants) {
      const cost = priceError(unitCost, "Unit cost");
      if (cost) top.cost = cost;
      const sell = priceError(sellingPrice, "Selling price");
      if (sell) top.sell = sell;
      if (!warehouseCode) top.warehouse = "Please choose the warehouse the stock goes into.";
      const q = quantity.trim();
      if (!q) top.quantity = "Initial quantity is required.";
      else if (!INT_RE.test(q) || Number(q) < 1) top.quantity = "Quantity must be a whole number of at least 1.";
    } else if (variantRows.length === 0) {
      top.variants = "Add at least one variant.";
    } else {
      const seen = { name: new Map<string, number>(), sku: new Map<string, number>(), barcode: new Map<string, number>() };
      variantRows.forEach((r, i) => {
        const e: Errs = {};
        const name = r.name.trim();
        if (!name) e.name = "Variant name is required.";
        else if (name.length > LIMITS.name) e.name = `Name is too long (max ${LIMITS.name} characters).`;
        else if (seen.name.has(name.toLowerCase())) e.name = `Same name as variant ${seen.name.get(name.toLowerCase())}.`;
        else seen.name.set(name.toLowerCase(), i + 1);

        const vsku = r.sku.trim();
        if (vsku.length > LIMITS.sku) e.sku = `Max ${LIMITS.sku} characters.`;
        else if (vsku && seen.sku.has(vsku.toLowerCase())) e.sku = `Same SKU as variant ${seen.sku.get(vsku.toLowerCase())}.`;
        else if (vsku) seen.sku.set(vsku.toLowerCase(), i + 1);

        const vbar = r.barcode.trim();
        if (vbar.length > LIMITS.barcode) e.barcode = `Max ${LIMITS.barcode} characters.`;
        else if (vbar && seen.barcode.has(vbar.toLowerCase())) e.barcode = `Same barcode as variant ${seen.barcode.get(vbar.toLowerCase())}.`;
        else if (vbar) seen.barcode.set(vbar.toLowerCase(), i + 1);

        const cost = priceError(r.cost, "Unit cost");
        if (cost) e.cost = cost;
        const sell = priceError(r.sell, "Selling price");
        if (sell) e.sell = sell;
        if (!r.warehouseCode) e.warehouse = "Choose a warehouse.";
        const q = r.quantity.trim();
        if (!q) e.quantity = "Quantity is required.";
        else if (!INT_RE.test(q) || Number(q) < 1) e.quantity = "Whole number, at least 1.";
        if (!r.image) e.image = "A photo of this variant is required.";
        if (Object.keys(e).length) rows[r.key] = e;
      });
    }

    const count = Object.keys(top).length + Object.values(rows).reduce((n, e) => n + Object.keys(e).length, 0);
    return { top, rows, count };
  };

  // Errors are shown on every field after the first Save click, then update as the person fixes them.
  const check = validateForm();
  const err = (key: string) => (submitted ? check.top[key] : undefined);
  const rowErr = (key: number, field: string) => (submitted ? check.rows[key]?.[field] : undefined);

  const handleSave = async () => {
    if (saving) return;
    setSubmitted(true);
    if (check.count > 0) {
      messageApi.error(`Please fix ${check.count} ${check.count === 1 ? "field" : "fields"} marked in red before saving.`);
      // After the errors render, bring the first one into view.
      setTimeout(() => {
        const first = document.querySelector<HTMLElement>(
          '.add-product-wrapper [aria-invalid="true"], .add-product-wrapper [data-invalid="true"]',
        );
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
        first?.focus({ preventScroll: true });
      }, 80);
      return;
    }

    let variantInputs: NewVariantInput[] | undefined;
    let qty = num(quantity) ?? 0;
    if (hasVariants) {
      variantInputs = variantRows.map((r) => ({
        image: r.image as File,
        name: r.name,
        sku: r.sku,
        barcode: r.barcode,
        costPrice: num(r.cost),
        sellingPrice: num(r.sell),
        warehouseCode: r.warehouseCode,
        quantity: num(r.quantity) ?? 0,
        location: r.location,
      }));
      qty = 1;
    }

    setSaving(true);
    try {
      await createProduct({
        name: productName,
        sku,
        barcode,
        description,
        categoryCode,
        brandCode: brandCode || undefined,
        supplierCode: supplierCode || undefined,
        unit,
        minimumStock: num(minStock),
        costPrice: num(unitCost),
        sellingPrice: num(sellingPrice),
        warehouseCode,
        quantity: qty,
        location,
        image: imageFile,
        variants: variantInputs,
      }, askFirst);
      messageApi.success(askFirst ? "Request sent for approval. The product is created once it is approved. Track it under Requests." : "Product created.");
      setTimeout(() => (onSuccess ? onSuccess() : router.push(askFirst ? "/requests" : "/products")), askFirst ? 900 : 400);
    } catch (err) {
      messageApi.error(err instanceof ApiError ? err.message : "Could not save the product.");
      setSaving(false);
    }
  };

  return (
    <div className="add-product-wrapper">
      {contextHolder}

      {/* Top Breadcrumbs */}
      <BackButton href="/products" />
      <div className="add-product-breadcrumbs">
        <Link
          href="/products"
          className="crumb-link"
          onClick={(e) => {
            if (onCancel) {
              e.preventDefault();
              onCancel();
            }
          }}
        >
          Products
        </Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Add Product</span>
      </div>

      {/* Page Title & Action Buttons */}
      <div className="add-product-header">
        <h1 className="add-product-title">Add Product</h1>
      </div>

      {loadError && (
        <p role="alert" style={{ color: "#DC2626", margin: "0 0 12px" }}>
          {loadError}
        </p>
      )}

      {/* Main Form Grid */}
      <div className="add-product-grid">
        <div className="add-product-col-main">
          {/* Card 1: Basic Information */}
          <div className="add-product-card">
            <h2 className="card-section-title">Basic information</h2>

              <div className="form-group">
                <label className="form-label" htmlFor="product-name">
                  Product name *
                </label>
                <input id="product-name" type="text" className={`form-input${err("name") ? " has-error" : ""}`} aria-invalid={Boolean(err("name"))} placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} />
                <FieldError text={err("name")} />
              </div>

            <div className="form-row-two-cols">
              <div className="form-group">
                <label className="form-label" htmlFor="product-sku">
                  SKU (optional — generated if empty)
                </label>
                <input id="product-sku" type="text" className={`form-input${err("sku") ? " has-error" : ""}`} aria-invalid={Boolean(err("sku"))} placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
                <FieldError text={err("sku")} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="product-category">
                  Category *
                </label>
                <div className="select-container">
                  <SearchSelect id="product-category" className={`form-select${err("category") ? " has-error" : ""}`} aria-invalid={Boolean(err("category"))} value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)}>
                    <option value="">Select a category</option>
                    {categories.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.name}
                      </option>
                    ))}
                  </SearchSelect>
                  <svg className="select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <FieldError text={err("category")} />
              </div>
            </div>

            <div className="form-row-three-cols">
              <div className="form-group">
                <label className="form-label" htmlFor="product-brand">
                  Brand
                </label>
                <div className="select-container">
                  <SearchSelect id="product-brand" className="form-select" value={brandCode} onChange={(e) => setBrandCode(e.target.value)}>
                    <option value="">No brand</option>
                    {brands.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.name}
                      </option>
                    ))}
                  </SearchSelect>
                  <svg className="select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="product-supplier">
                  Supplier
                </label>
                <div className="select-container">
                  <SearchSelect id="product-supplier" className="form-select" value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)}>
                    <option value="">No supplier</option>
                    {suppliers.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.name}
                      </option>
                    ))}
                  </SearchSelect>
                  <svg className="select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="product-unit">
                  Unit
                </label>
                <input id="product-unit" type="text" className={`form-input${err("unit") ? " has-error" : ""}`} aria-invalid={Boolean(err("unit"))} placeholder="PCS" value={unit} onChange={(e) => setUnit(e.target.value)} />
                <FieldError text={err("unit")} />
              </div>
            </div>

              <div className="form-group">
                <label className="form-label" htmlFor="product-barcode">
                  Barcode (optional)
                </label>
                <input id="product-barcode" type="text" className={`form-input${err("barcode") ? " has-error" : ""}`} aria-invalid={Boolean(err("barcode"))} placeholder="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                <FieldError text={err("barcode")} />
              </div>

            <div className="form-group">
              <label className="form-label" htmlFor="product-description">
                Description
              </label>
              <textarea
                id="product-description"
                className="form-textarea"
                rows={4}
                placeholder="Detailed description of the product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Card 2: Stock & Pricing */}
          <div className="add-product-card">
            <h2 className="card-section-title">Stock & pricing</h2>

            <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              <input type="checkbox" checked={hasVariants} onChange={(e) => toggleVariants(e.target.checked)} />
              This product has variants (size, colour…) — each variant has its own price and stock
            </label>

            <div className="form-row-three-cols">
              {!hasVariants && (<>
              <PriceField id="unit-cost" label="Unit cost" value={unitCost} onChange={setUnitCost} submitted={submitted} />
              <PriceField id="selling-price" label="Selling price" value={sellingPrice} onChange={setSellingPrice} submitted={submitted} lowerThan={unitCost} />
              </>)}
              <div className="form-group">
                <label className="form-label" htmlFor="reorder-point">
                  Reorder point (units)
                </label>
                <input id="reorder-point" type="text" className={`form-input${err("minStock") ? " has-error" : ""}`} aria-invalid={Boolean(err("minStock"))} placeholder="e.g. 15" value={minStock} onChange={(e) => setMinStock(cleanInt(e.target.value))} inputMode="numeric" />
                <FieldError text={err("minStock")} />
              </div>
            </div>

            {!hasVariants && (
            <div className="form-row-three-cols">
              <div className="form-group">
                <label className="form-label" htmlFor="initial-warehouse">
                  Initial warehouse *
                </label>
                <div className="select-container">
                  <SearchSelect id="initial-warehouse" className={`form-select${err("warehouse") ? " has-error" : ""}`} aria-invalid={Boolean(err("warehouse"))} value={warehouseCode} onChange={(e) => setWarehouseCode(e.target.value)}>
                    <option value="">Select a warehouse</option>
                    {warehouses.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.name}
                      </option>
                    ))}
                  </SearchSelect>
                  <svg className="select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <FieldError text={err("warehouse")} />
                {optionsLoaded && warehouses.length === 0 && (
                  <span className="field-warning">No warehouse exists yet. Create one in Warehouses first.</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="initial-qty">
                  Initial quantity *
                </label>
                <input id="initial-qty" type="text" className={`form-input${err("quantity") ? " has-error" : ""}`} aria-invalid={Boolean(err("quantity"))} placeholder="e.g. 50" value={quantity} onChange={(e) => setQuantity(cleanInt(e.target.value))} inputMode="numeric" />
                <FieldError text={err("quantity")} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="initial-location">
                  Location (optional)
                </label>
                <input id="initial-location" type="text" className="form-input" placeholder="e.g. Shelf A2" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>
            )}
          </div>

          {hasVariants && (
            <div className="add-product-card">
              <h2 className="card-section-title">Variants</h2>
              {variantRows.map((r, i) => (
                <div key={r.key} style={{ border: "1px solid #ECE9F3", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong style={{ fontSize: 13.5 }}>Variant {i + 1}</strong>
                    {variantRows.length > 1 && (
                      <button type="button" className="btn-remove-image" onClick={() => setVariantRows((rows) => rows.filter((x) => x.key !== r.key))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
                    <div data-invalid={rowErr(r.key, "image") ? "true" : undefined}>
                      <VariantImagePicker required file={r.image} onPick={(f) => patchVariant(r.key, { image: f })} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12.5, color: "#6B7280", lineHeight: 1.5 }}>
                        Photo of this variant (required) — shown on the product page, stock list and mobile app.
                      </p>
                      <FieldError text={rowErr(r.key, "image")} />
                    </div>
                  </div>
                  <div className="form-row-three-cols">
                    <div className="form-group">
                      <label className="form-label">Name *</label>
                      <input type="text" className={`form-input${rowErr(r.key, "name") ? " has-error" : ""}`} aria-invalid={Boolean(rowErr(r.key, "name"))} placeholder="e.g. Red / L" value={r.name} onChange={(e) => patchVariant(r.key, { name: e.target.value })} />
                      <FieldError text={rowErr(r.key, "name")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">SKU</label>
                      <input type="text" className={`form-input${rowErr(r.key, "sku") ? " has-error" : ""}`} aria-invalid={Boolean(rowErr(r.key, "sku"))} placeholder="optional" value={r.sku} onChange={(e) => patchVariant(r.key, { sku: e.target.value })} />
                      <FieldError text={rowErr(r.key, "sku")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Barcode</label>
                      <input type="text" className={`form-input${rowErr(r.key, "barcode") ? " has-error" : ""}`} aria-invalid={Boolean(rowErr(r.key, "barcode"))} placeholder="optional" value={r.barcode} onChange={(e) => patchVariant(r.key, { barcode: e.target.value })} />
                      <FieldError text={rowErr(r.key, "barcode")} />
                    </div>
                  </div>
                  <div className="form-row-three-cols">
                    <PriceField label="Unit cost" value={r.cost} onChange={(v) => patchVariant(r.key, { cost: v })} submitted={submitted} />
                    <PriceField label="Selling price" value={r.sell} onChange={(v) => patchVariant(r.key, { sell: v })} submitted={submitted} lowerThan={r.cost} />
                    <div className="form-group">
                      <label className="form-label">Quantity *</label>
                      <input type="text" className={`form-input${rowErr(r.key, "quantity") ? " has-error" : ""}`} aria-invalid={Boolean(rowErr(r.key, "quantity"))} placeholder="e.g. 20" inputMode="numeric" value={r.quantity} onChange={(e) => patchVariant(r.key, { quantity: cleanInt(e.target.value) })} />
                      <FieldError text={rowErr(r.key, "quantity")} />
                    </div>
                  </div>
                  <div className="form-row-two-cols">
                    <div className="form-group">
                      <label className="form-label">Warehouse *</label>
                      <div className="select-container">
                      <SearchSelect className={`form-select${rowErr(r.key, "warehouse") ? " has-error" : ""}`} aria-invalid={Boolean(rowErr(r.key, "warehouse"))} value={r.warehouseCode} onChange={(e) => patchVariant(r.key, { warehouseCode: e.target.value })}>
                        <option value="">Select a warehouse</option>
                        {warehouses.map((o) => (
                          <option key={o.code} value={o.code}>{o.name}</option>
                        ))}
                      </SearchSelect>
                    </div>
                      <FieldError text={rowErr(r.key, "warehouse")} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input type="text" className="form-input" placeholder="e.g. Shelf A2" value={r.location} onChange={(e) => patchVariant(r.key, { location: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn-add-product-cancel" onClick={() => setVariantRows((rows) => [...rows, newVariant()])}>
                + Add variant
              </button>
              <FieldError text={err("variants")} />
            </div>
          )}
        </div>

        {/* Right Column: Product Image */}
        <div className="add-product-col-side">
          {/* Card 1: Product Image */}
          <div className="add-product-card">
            <h2 className="card-section-title">Product image</h2>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleFileChange}
            />

            {imagePreview ? (
              <div className="image-preview-container">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="image-preview"
                />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                >
                  Remove image
                </button>
              </div>
            ) : (
              <div
                className={`dropzone-container ${isDragging ? "dragging" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="dropzone-icon">
                  <svg
                    width="36"
                    height="32"
                    viewBox="0 0 24 22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="18" rx="4" />
                    <circle cx="8" cy="8" r="1.5" />
                    <path d="m21 15-5-5L5 20" />
                  </svg>
                </div>
                <p className="dropzone-text">Drag an image or click to upload</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="page-form-actions">
        <div className="add-product-actions">
          <button type="button" className="btn-add-product-cancel" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-add-product-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : askFirst ? "Submit Request" : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
