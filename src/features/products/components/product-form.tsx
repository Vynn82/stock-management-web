"use client";

import React, { useState } from "react";
import { CreateProductInput } from "../products.types";
import { validateProductInput } from "../products.validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";

interface ProductFormProps {
  initialValues?: Partial<CreateProductInput>;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({
  initialValues,
  onSubmit,
  isLoading = false,
}: ProductFormProps) {
  const [sku, setSku] = useState(initialValues?.sku || "");
  const [name, setName] = useState(initialValues?.name || "");
  const [category, setCategory] = useState(
    initialValues?.category || "General",
  );
  const [price, setPrice] = useState(initialValues?.price?.toString() || "0");
  const [stock, setStock] = useState(initialValues?.stock?.toString() || "0");
  const [status, setStatus] = useState<"active" | "inactive">(
    (initialValues?.status as "active" | "inactive") || "active",
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const payload: CreateProductInput = {
      sku: sku.trim(),
      name: name.trim(),
      category: category.trim(),
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      status,
    };

    const validationError = validateProductInput(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || "Failed to save product.");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
      {error && (
        <div className="error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <Input
        label="SKU / Barcode"
        id="sku"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        placeholder="e.g. PRD-001"
      />

      <Input
        label="Product Name"
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Wireless Barcode Scanner"
      />

      <Input
        label="Category"
        id="category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="e.g. Electronics"
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Input
          label="Price ($)"
          id="price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Input
          label="Stock Quantity"
          id="stock"
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </div>

      <Dropdown
        label="Status"
        id="status"
        value={status}
        onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
        options={[
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ]}
      />

      <Button type="submit" isLoading={isLoading} style={{ marginTop: 8 }}>
        Save Product
      </Button>
    </form>
  );
}
