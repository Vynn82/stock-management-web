"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { useProductsStore } from "@/store/productsStore";
import { Product } from "@/types/inventory";

interface AddProductPageProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function AddProductPage({ onCancel, onSuccess }: AddProductPageProps) {
  const router = useRouter();
  const { addProduct } = useProductsStore();
  const [messageApi, contextHolder] = message.useMessage();

  // Form states with default values from the screenshot
  const [productName, setProductName] = useState("Wireless Mouse M185");
  const [sku, setSku] = useState("WM-M185-BLK");
  const [category, setCategory] = useState("Electronics");
  const [description, setDescription] = useState(
    "Ergonomic wireless mouse with 1600 DPI optical sensor and 18-month battery life."
  );
  const [unitCost, setUnitCost] = useState("$8.50");
  const [reorderPoint, setReorderPoint] = useState("15 units");
  const [warehouse, setWarehouse] = useState("Phnom Penh Main");
  const [status, setStatus] = useState<"Active" | "Draft">("Active");

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      messageApi.error("Please upload an image file.");
      return;
    }
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

  const handleSave = () => {
    if (!productName.trim()) {
      messageApi.error("Please enter a product name.");
      return;
    }
    if (!sku.trim()) {
      messageApi.error("Please enter a SKU.");
      return;
    }

    // Clean numeric values
    const rawCost = parseFloat(unitCost.replace(/[^0-9.]/g, "")) || 8.5;
    const rawReorder = parseInt(reorderPoint.replace(/[^0-9]/g, ""), 10) || 15;

    const newProduct: Product = {
      key: `prod-${Date.now()}`,
      name: productName.trim(),
      sku: sku.trim(),
      category: category,
      warehouse: warehouse.replace(" Main", "").replace(" Branch", "").replace(" Hub", "").replace(" Depot", ""),
      stock: 120, // default healthy initial stock for new item
      reorder: rawReorder,
      status: "In stock",
      price: rawCost * 1.5, // sensible retail margin
    };

    addProduct(newProduct);
    messageApi.success("Product created successfully!");

    setTimeout(() => {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/products");
      }
    }, 400);
  };

  return (
    <div className="add-product-wrapper">
      {contextHolder}

      {/* Top Breadcrumbs */}
      <div className="add-product-breadcrumbs">
        <Link href="/products" className="crumb-link" onClick={(e) => {
          if (onCancel) {
            e.preventDefault();
            onCancel();
          }
        }}>
          Products
        </Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Add Product</span>
      </div>

      {/* Page Title & Action Buttons */}
      <div className="add-product-header">
        <h1 className="add-product-title">Add Product</h1>
        <div className="add-product-actions">
          <button
            type="button"
            className="btn-add-product-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-add-product-save"
            onClick={handleSave}
          >
            Save Product
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="add-product-grid">
        {/* Left Column: Basic Information & Stock & Pricing */}
        <div className="add-product-col-main">
          {/* Card 1: Basic Information */}
          <div className="add-product-card">
            <h2 className="card-section-title">Basic information</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="product-name">
                Product name
              </label>
              <input
                id="product-name"
                type="text"
                className="form-input"
                placeholder="Product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div className="form-row-two-cols">
              <div className="form-group">
                <label className="form-label" htmlFor="product-sku">
                  SKU
                </label>
                <input
                  id="product-sku"
                  type="text"
                  className="form-input"
                  placeholder="SKU"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="product-category">
                  Category
                </label>
                <div className="select-container">
                  <select
                    id="product-category"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Computers">Computers</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Office">Office</option>
                  </select>
                  <svg
                    className="select-chevron"
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

            <div className="form-row-three-cols">
              <div className="form-group">
                <label className="form-label" htmlFor="unit-cost">
                  Unit cost
                </label>
                <input
                  id="unit-cost"
                  type="text"
                  className="form-input"
                  placeholder="$8.50"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reorder-point">
                  Reorder point
                </label>
                <input
                  id="reorder-point"
                  type="text"
                  className="form-input"
                  placeholder="15 units"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="initial-warehouse">
                  Initial warehouse
                </label>
                <div className="select-container">
                  <select
                    id="initial-warehouse"
                    className="form-select"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                  >
                    <option value="Phnom Penh Main">Phnom Penh Main</option>
                    <option value="Siem Reap Branch">Siem Reap Branch</option>
                    <option value="Battambang Hub">Battambang Hub</option>
                    <option value="Kampong Cham Depot">Kampong Cham Depot</option>
                  </select>
                  <svg
                    className="select-chevron"
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
          </div>
        </div>

        {/* Right Column: Product Image & Status */}
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
                  onClick={() => setImagePreview(null)}
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

          {/* Card 2: Status */}
          <div className="add-product-card">
            <h2 className="card-section-title">Status</h2>

            <div className="status-options-list">
              {/* Active Option */}
              <div
                className={`status-option-item ${status === "Active" ? "selected" : ""}`}
                onClick={() => setStatus("Active")}
                role="radio"
                aria-checked={status === "Active"}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setStatus("Active");
                }}
              >
                <div className="status-radio-indicator">
                  <span className="status-radio-inner" />
                </div>
                <div className="status-option-text">
                  <strong className="status-name">Active</strong>
                  <span className="status-desc"> — visible in stock lists</span>
                </div>
              </div>

              {/* Draft Option */}
              <div
                className={`status-option-item ${status === "Draft" ? "selected" : ""}`}
                onClick={() => setStatus("Draft")}
                role="radio"
                aria-checked={status === "Draft"}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setStatus("Draft");
                }}
              >
                <div className="status-radio-indicator">
                  <span className="status-radio-inner" />
                </div>
                <div className="status-option-text">
                  <strong className="status-name">Draft</strong>
                  <span className="status-desc"> — hidden until published</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
