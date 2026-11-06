"use client";

import { useEffect, useMemo } from "react";
import { useLiveStock, type LiveHistoryEntry, type LiveStockProduct } from "@/features/stock/stock-live";

/** Report numbers computed from the real stock data (products, per-warehouse stock and movement history). */

export type MovementType = "Stock In" | "Stock Out" | "Transfer" | "Adjustment";

export interface WarehouseValue { id: string; warehouse: string; units: number; value: number; percentage: number }
export interface CategoryValue { category: string; itemCount: number; value: number; percentage: number }
export interface MovementTotal { type: MovementType; count: number; units: number; trend: string }
export interface LowStockRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  warehouse: string;
  onHand: number;
  reorderAt: number;
  deficit: number;
  unitCost: number;
  status: "Low Stock" | "Out of Stock";
}
export interface MovementRow {
  id: string;
  timestamp: string;
  at: string;
  type: MovementType;
  product: string;
  sku: string;
  quantity: number;
  warehouse: string;
  user: string;
  reference: string;
}

export const DAY_MS = 86_400_000;

export function usd(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function shortDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

function trendText(now: number, before: number): string {
  if (before <= 0) return now > 0 ? "new activity" : "no activity";
  const change = Math.round(((now - before) / before) * 100);
  return `${change >= 0 ? "+" : ""}${change}% vs prev 30d`;
}

export function buildWarehouseValues(products: LiveStockProduct[]): WarehouseValue[] {
  const map = new Map<string, { units: number; value: number }>();
  for (const p of products) {
    for (const w of p.warehouses) {
      const row = map.get(w.warehouse) ?? { units: 0, value: 0 };
      row.units += w.qty;
      row.value += w.qty * p.unitCost;
      map.set(w.warehouse, row);
    }
  }
  const total = [...map.values()].reduce((s, r) => s + r.value, 0);
  return [...map.entries()]
    .map(([warehouse, r]) => ({ id: warehouse, warehouse, units: r.units, value: r.value, percentage: pct(r.value, total) }))
    .sort((a, b) => b.value - a.value);
}

export function buildCategoryValues(products: LiveStockProduct[]): CategoryValue[] {
  const map = new Map<string, { count: number; value: number }>();
  for (const p of products) {
    const key = p.category || "Uncategorised";
    const row = map.get(key) ?? { count: 0, value: 0 };
    row.count += 1;
    row.value += p.onHand * p.unitCost;
    map.set(key, row);
  }
  const total = [...map.values()].reduce((s, r) => s + r.value, 0);
  return [...map.entries()]
    .map(([category, r]) => ({ category, itemCount: r.count, value: r.value, percentage: pct(r.value, total) }))
    .sort((a, b) => b.value - a.value);
}

export function buildLowStock(products: LiveStockProduct[]): LowStockRow[] {
  const rows: LowStockRow[] = [];
  for (const p of products) {
    if (p.reorderPoint <= 0) continue;
    const base = { name: p.name, sku: p.sku || p.code, category: p.category || "—", reorderAt: p.reorderPoint, unitCost: p.unitCost };
    if (p.warehouses.length === 0) {
      if (p.onHand <= p.reorderPoint) {
        rows.push({ ...base, id: `${p.id}-none`, warehouse: "—", onHand: 0, deficit: p.reorderPoint, status: "Out of Stock" });
      }
      continue;
    }
    for (const w of p.warehouses) {
      if (w.qty > p.reorderPoint) continue;
      rows.push({
        ...base,
        id: `${p.id}-${w.code}`,
        warehouse: w.warehouse,
        onHand: w.qty,
        deficit: Math.max(0, p.reorderPoint - w.qty),
        status: w.qty <= 0 ? "Out of Stock" : "Low Stock",
      });
    }
  }
  return rows.sort((a, b) => a.onHand - b.onHand);
}

export function toMovementRow(h: LiveHistoryEntry): MovementRow {
  return {
    id: h.id.slice(0, 8).toUpperCase(),
    timestamp: h.timestamp,
    at: h.at,
    type: h.type,
    product: h.productName,
    sku: h.sku,
    quantity: h.quantity,
    warehouse: h.destinationWarehouse ? `${h.warehouse} → ${h.destinationWarehouse}` : h.warehouse,
    user: h.user,
    reference: h.reason || "—",
  };
}

export function buildMovementTotals(history: LiveHistoryEntry[]): MovementTotal[] {
  const now = Date.now();
  const types: MovementType[] = ["Stock In", "Stock Out", "Transfer", "Adjustment"];
  return types.map((type) => {
    const mine = history.filter((h) => h.type === type);
    const current = mine.filter((h) => now - new Date(h.at).getTime() <= 30 * DAY_MS);
    const previous = mine.filter((h) => {
      const age = now - new Date(h.at).getTime();
      return age > 30 * DAY_MS && age <= 60 * DAY_MS;
    });
    return {
      type,
      count: current.length,
      units: current.reduce((s, h) => s + Math.abs(h.quantity), 0),
      trend: trendText(current.length, previous.length),
    };
  });
}

/** Loads the live stock data once and returns every report built from it. */
export function useReportData() {
  const { products, history, loaded, loading, error, load } = useLiveStock();

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(() => {
    const warehouses = buildWarehouseValues(products);
    const categories = buildCategoryValues(products);
    const totalValue = warehouses.reduce((s, w) => s + w.value, 0);
    const totalUnits = warehouses.reduce((s, w) => s + w.units, 0);
    const movements = buildMovementTotals(history);
    const transactions = history.map(toMovementRow);
    const lowStock = buildLowStock(products);
    return {
      products,
      history,
      warehouses,
      categories,
      totalValue,
      totalUnits,
      movements,
      movementCount: movements.reduce((s, m) => s + m.count, 0),
      transactions,
      lowStock,
      loaded,
      loading,
      error,
      reload: () => load(true),
    };
  }, [products, history, loaded, loading, error, load]);
}
