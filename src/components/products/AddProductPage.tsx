"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { ApiError } from "@/features/live/http";
import { LookupOption, fetchBrands, fetchCategories, fetchSuppliers, fetchWarehouses } from "@/features/live/lookups";
import { createProduct, NewVariantInput } from "@/features/products/products-live.api";
import VariantImagePicker from "./VariantImagePicker";
import SearchSelect from "@/components/ui/SearchSelect";

interface AddProductPageProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

const num = (v: string): number | undefined => {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

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

  const handleSave = async () => {
    if (saving) return;
    if (!productName.trim()) return void messageApi.error("Please enter a product name.");
    if (!categoryCode) return void messageApi.error("Please choose a category.");
    let variantInputs: NewVariantInput[] | undefined;
    let qty = num(quantity) ?? 0;
    if (hasVariants) {
      if (variantRows.length === 0) return void messageApi.error("Add at least one variant.");
      variantInputs = [];
      for (let i = 0; i < variantRows.length; i++) {
        const r = variantRows[i];
        if (!r.name.trim()) return void messageApi.error(`Variant ${i + 1}: enter a name.`);
        if (!r.warehouseCode) return void messageApi.error(`Variant ${i + 1}: choose a warehouse.`);
        const q = num(r.quantity);
        if (!q || q < 1) return void messageApi.error(`Variant ${i + 1}: enter a quantity of at least 1.`);
        if (!r.image) return void messageApi.error(`Variant ${i + 1}: add a photo.`);
        variantInputs.push({ image: r.image, name: r.name, sku: r.sku, barcode: r.barcode, costPrice: num(r.cost), sellingPrice: num(r.sell), warehouseCode: r.warehouseCode, quantity: q, location: r.location });
      }
      qty = 1;
    } else {
      if (!warehouseCode) return void messageApi.error("Please choose the warehouse the stock goes into.");
      if (!qty || qty < 1) return void messageApi.error("Enter an initial quantity of at least 1.");
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
      });
      messageApi.success("Product created.");
      setTimeout(() => (onSuccess ? onSuccess() : router.push("/products")), 400);
    } catch (err) {
      messageApi.error(err instanceof ApiError ? err.message : "Could not save the product.");
      setSaving(false);
    }
  };

  return (
    <div className="add-product-wrapper">
      {contextHolder}

      {/* Top Breadcrumbs */}
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
        <div className="add-product-actions">
          <button type="button" className="btn-add-product-cancel" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-add-product-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Product"}
          </button>
        </div>
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
                <input id="product-name" type="text" className="form-input" placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>

            <div className="form-row-two-cols">
              <div className="form-group">
                <label className="form-label" htmlFor="product-sku">
                  SKU (optional — generated if empty)
                </label>
                <input id="product-sku" type="text" className="form-input" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="product-category">
                  Category *
                </label>
                <div className="select-container">
                  <SearchSelect id="product-category" className="form-select" value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)}>
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
                <input id="product-unit" type="text" className="form-input" placeholder="PCS" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
            </div>

              <div className="form-group">
                <label className="form-label" htmlFor="product-barcode">
                  Barcode (optional)
                </label>
                <input id="product-barcode" type="text" className="form-input" placeholder="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
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
              <div className="form-group">
                <label className="form-label" htmlFor="unit-cost">
                  Unit cost ($)
                </label>
                <input id="unit-cost" type="text" className="form-input" placeholder="0.00" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} inputMode="decimal" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="selling-price">
                  Selling price ($)
                </label>
                <input id="selling-price" type="text" className="form-input" placeholder="0.00" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} inputMode="decimal" />
              </div>
              </>)}
              <div className="form-group">
                <label className="form-label" htmlFor="reorder-point">
                  Reorder point (units)
                </label>
                <input id="reorder-point" type="text" className="form-input" placeholder="e.g. 15" value={minStock} onChange={(e) => setMinStock(e.target.value)} inputMode="numeric" />
              </div>
            </div>

            {!hasVariants && (
            <div className="form-row-three-cols">
              <div className="form-group">
                <label className="form-label" htmlFor="initial-warehouse">
                  Initial warehouse *
                </label>
                <div className="select-container">
                  <SearchSelect id="initial-warehouse" className="form-select" value={warehouseCode} onChange={(e) => setWarehouseCode(e.target.value)}>
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
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="initial-qty">
                  Initial quantity *
                </label>
                <input id="initial-qty" type="text" className="form-input" placeholder="e.g. 50" value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="numeric" />
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
                    <VariantImagePicker required file={r.image} onPick={(f) => patchVariant(r.key, { image: f })} />
                    <p style={{ margin: 0, fontSize: 12.5, color: "#6B7280", lineHeight: 1.5 }}>
                      Photo of this variant (required) — shown on the product page, stock list and mobile app.
                    </p>
                  </div>
                  <div className="form-row-three-cols">
                    <div className="form-group">
                      <label className="form-label">Name *</label>
                      <input type="text" className="form-input" placeholder="e.g. Red / L" value={r.name} onChange={(e) => patchVariant(r.key, { name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">SKU</label>
                      <input type="text" className="form-input" placeholder="optional" value={r.sku} onChange={(e) => patchVariant(r.key, { sku: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Barcode</label>
                      <input type="text" className="form-input" placeholder="optional" value={r.barcode} onChange={(e) => patchVariant(r.key, { barcode: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row-three-cols">
                    <div className="form-group">
                      <label className="form-label">Unit cost ($)</label>
                      <input type="text" className="form-input" placeholder="0.00" inputMode="decimal" value={r.cost} onChange={(e) => patchVariant(r.key, { cost: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Selling price ($)</label>
                      <input type="text" className="form-input" placeholder="0.00" inputMode="decimal" value={r.sell} onChange={(e) => patchVariant(r.key, { sell: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Quantity *</label>
                      <input type="text" className="form-input" placeholder="e.g. 20" inputMode="numeric" value={r.quantity} onChange={(e) => patchVariant(r.key, { quantity: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row-two-cols">
                    <div className="form-group">
                      <label className="form-label">Warehouse *</label>
                      <div className="select-container">
                      <SearchSelect className="form-select" value={r.warehouseCode} onChange={(e) => patchVariant(r.key, { warehouseCode: e.target.value })}>
                        <option value="">Select a warehouse</option>
                        {warehouses.map((o) => (
                          <option key={o.code} value={o.code}>{o.name}</option>
                        ))}
                      </SearchSelect>
                    </div>
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
    </div>
  );
}
