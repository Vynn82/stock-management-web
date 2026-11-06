import { useEffect, useMemo } from "react";
import { api } from "@/features/live/http";
import { fetchCategories } from "@/features/live/lookups";
import { LiveHistoryEntry, useLiveStock } from "@/features/stock/stock-live";

/**
 * Stock data for the stock detail / adjust / stock-out / transfer / history
 * pages. It is a thin adapter over the real API (`features/stock/stock-live`):
 * the pages keep the same shape, but every figure now comes from the server
 * and every change is saved there first. The `record…` functions are async and
 * throw an Error with a message to show when the server refuses.
 */

export interface WarehouseDetailStock {
  warehouse: string;
  onHand: number;
  reserved: number;
}

export interface StockTransaction {
  id: string;
  date: string;
  type: "In" | "Out" | "Transfer" | "Adjustment";
  qty: number;
  warehouse: string;
  destinationWarehouse?: string;
  reason?: string;
  user?: string;
}

export interface DetailedStockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  warehousesCount: number;
  onHand: number;
  reservedTotal: number;
  status: "Active" | "Low Stock" | "Out of Stock";
  unitCost: number;
  reorderPoint: number;
  warehouses: WarehouseDetailStock[];
  transactions: StockTransaction[];
}

export interface GlobalStockTransaction {
  id: string;
  dateTime: string;
  productId: string;
  productName: string;
  type: "In" | "Out" | "Transfer" | "Adjustment";
  qty: number;
  warehouse: string;
  performedBy: string;
}

const SHORT_TYPE = { "Stock In": "In", "Stock Out": "Out", Transfer: "Transfer", Adjustment: "Adjustment" } as const;

const toTransaction = (h: LiveHistoryEntry): StockTransaction => ({
  id: h.id,
  date: h.timestamp,
  type: SHORT_TYPE[h.type],
  qty: h.quantity,
  warehouse: h.warehouse,
  destinationWarehouse: h.destinationWarehouse,
  reason: h.reason,
  user: h.user,
});

export function useStockStore() {
  const live = useLiveStock();
  const { load, products, history, warehouses } = live;

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo<DetailedStockItem[]>(
    () =>
      products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        warehousesCount: p.warehousesCount,
        onHand: p.onHand,
        reservedTotal: 0,
        status: p.status,
        unitCost: p.unitCost,
        reorderPoint: p.reorderPoint,
        warehouses: p.warehouses.map((w) => ({ warehouse: w.warehouse, onHand: w.qty, reserved: 0 })),
        transactions: history.filter((h) => h.sku === p.code).map(toTransaction),
      })),
    [products, history],
  );

  const globalTransactions = useMemo<GlobalStockTransaction[]>(
    () =>
      history.map((h) => ({
        id: h.id,
        dateTime: new Date(h.at).toLocaleString(),
        productId: products.find((p) => p.code === h.sku)?.id ?? "",
        productName: h.productName,
        type: SHORT_TYPE[h.type],
        qty: h.quantity,
        warehouse: h.destinationWarehouse ? `${h.warehouse} → ${h.destinationWarehouse}` : h.warehouse,
        performedBy: h.user,
      })),
    [history, products],
  );

  const warehouseNames = useMemo(() => warehouses.map((w) => w.name), [warehouses]);

  const codeOf = (name: string) => {
    const code = warehouses.find((w) => w.name === name)?.code;
    if (!code) throw new Error(`Warehouse "${name}" was not found.`);
    return code;
  };
  const productOf = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) throw new Error("Product not found.");
    return p;
  };

  return {
    items,
    globalTransactions,
    loading: live.loading,
    loaded: live.loaded,
    error: live.error,
    warehouseNames,
    reload: () => live.load(true),

    getItem: (idOrSku: string) =>
      items.find((i) => i.id === idOrSku || i.sku.toLowerCase() === idOrSku.toLowerCase()),

    updateProductInfo: async (
      id: string,
      updates: Partial<Pick<DetailedStockItem, "name" | "sku" | "category" | "unitCost" | "reorderPoint">>,
    ) => {
      const body: Record<string, unknown> = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.sku !== undefined) body.sku = updates.sku;
      if (updates.unitCost !== undefined) body.costPrice = updates.unitCost;
      if (updates.reorderPoint !== undefined) body.minimumStock = updates.reorderPoint;
      if (updates.category !== undefined) {
        const match = (await fetchCategories()).find((c) => c.name.toLowerCase() === updates.category!.trim().toLowerCase());
        if (!match) throw new Error(`Category "${updates.category}" does not exist. Pick an existing category.`);
        body.categoryCode = match.code;
      }
      await api.patch(`products/${id}`, body);
      await live.load(true);
    },

    recordStockIn: (id: string, warehouse: string, qty: number, reason?: string) =>
      live.stockIn(productOf(id), codeOf(warehouse), qty, reason ?? ""),

    recordStockOut: (id: string, warehouse: string, qty: number, reason?: string) =>
      live.stockOut(productOf(id), codeOf(warehouse), qty, reason ?? ""),

    recordTransfer: (id: string, from: string, to: string, qty: number, reason?: string) =>
      live.transfer(productOf(id), codeOf(from), codeOf(to), qty, reason ?? ""),

    recordAdjustment: (id: string, warehouse: string, newCount: number, reason?: string) =>
      live.setCount(productOf(id), codeOf(warehouse), newCount, reason ?? ""),
  };
}
