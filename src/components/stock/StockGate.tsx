"use client";

import React from "react";
import Link from "next/link";
import { useStockStore } from "@/store/stockStore";

/**
 * Shows the stock pages only once the stock has loaded from the server, with a
 * clear message while loading, when it fails, or when the product is missing.
 */
export default function StockGate({ productId, children }: { productId?: string; children: React.ReactNode }) {
  const { loaded, error, items, getItem, reload } = useStockStore();

  const box = (text: string, action?: React.ReactNode) => (
    <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--muted)" }} role={error ? "alert" : "status"}>
      <p style={{ margin: "0 0 14px" }}>{text}</p>
      {action}
    </div>
  );

  if (!loaded) {
    if (error) {
      return box(
        error,
        <button type="button" className="stock-action-btn" onClick={reload}>
          Try again
        </button>,
      );
    }
    return box("Loading stock…");
  }
  if (items.length === 0) {
    return box("No products yet.", <Link href="/products/create">Create a product</Link>);
  }
  // Route ids are UUIDs; the generic pages pass placeholder ids like "1" and use the first product.
  if (productId && !/^\d+$/.test(productId) && !getItem(productId)) {
    return box("This product was not found.", <Link href="/stock">Back to stock</Link>);
  }
  return <>{children}</>;
}
