import React from "react";
import Link from "next/link";
import { ProductForm } from "@/features/products/components/product-form";
import { ROUTES } from "@/lib/constants";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link
          href={ROUTES.PRODUCTS}
          style={{
            color: "var(--brand-600)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← Back to Products
        </Link>
        <h1
          style={{
            margin: "12px 0 0",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-main)",
          }}
        >
          Edit Product #{id}
        </h1>
      </div>

      <div
        style={{
          border: "1px solid var(--border-color)",
          borderRadius: 20,
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--card-shadow)",
          padding: 28,
          maxWidth: 560,
        }}
      >
        <ProductForm
          initialValues={{
            sku: `PRD-00${id}`,
            name: `Warehouse Item ${id}`,
            category: "General",
            price: 49.99,
            stock: 30,
            status: "active",
          }}
          onSubmit={async () => {}}
        />
      </div>
    </div>
  );
}
