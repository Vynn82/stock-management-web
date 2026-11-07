import { create } from "zustand";
import { api } from "@/features/live/http";
import { LookupOption, fetchWarehouses } from "@/features/live/lookups";
import { listAll } from "@/features/live/http";

export type StockLevel = "Active" | "Low Stock" | "Out of Stock";

export interface LiveWarehouseStock {
  warehouse: string;
  code: string;
  qty: number;
}

export interface LiveStockVariant {
  id: string;
  code: string;
  name: string;
  image?: string;
  onHand: number;
}

export interface LiveStockProduct {
  id: string;
  image?: string;
  variants: LiveStockVariant[];
  code: string;
  name: string;
  sku: string;
  category: string;
  warehousesCount: number;
  onHand: number;
  status: StockLevel;
  unitCost: number;
  reorderPoint: number;
  warehouses: LiveWarehouseStock[];
}

export interface LiveHistoryEntry {
  id: string;
  timestamp: string;
  at: string;
  type: "Stock In" | "Stock Out" | "Transfer" | "Adjustment";
  productName: string;
  sku: string;
  quantity: number;
  warehouse: string;
  destinationWarehouse?: string;
  reason?: string;
  user: string;
}

interface ApiProduct {
  id: string;
  code: string;
  name: string;
  sku?: string;
  costPrice?: number | string | null;
  minimumStock?: number | string | null;
  category?: { name?: string } | null;
  image?: string | { url?: string } | null;
  variants?: { id: string; code?: string; name?: string; image?: string | null; stocks?: { quantity: number | string }[] }[];
  stocks?: { quantity: number | string; warehouse?: { name?: string; code?: string } | null }[];
}

interface ApiHistory {
  id: string;
  kind: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";
  at: string;
  productCode: string;
  productName: string;
  fromWarehouse?: string | null;
  toWarehouse?: string | null;
  quantity: number;
  reason?: string | null;
  byStaff?: string | null;
}

export function levelFor(onHand: number, reorderPoint: number): StockLevel {
  if (onHand <= 0) return "Out of Stock";
  if (reorderPoint > 0 && onHand <= reorderPoint) return "Low Stock";
  return "Active";
}

function toProduct(p: ApiProduct): LiveStockProduct {
  // One row per warehouse (a product with variants has several stock rows in the same warehouse).
  const byWarehouse = new Map<string, LiveWarehouseStock>();
  for (const s of p.stocks ?? []) {
    const name = s.warehouse?.name ?? "Unknown";
    const row = byWarehouse.get(name) ?? { warehouse: name, code: s.warehouse?.code ?? "", qty: 0 };
    row.qty += Number(s.quantity || 0);
    byWarehouse.set(name, row);
  }
  const warehouses = Array.from(byWarehouse.values());
  const onHand = warehouses.reduce((sum, w) => sum + w.qty, 0);
  const reorderPoint = Number(p.minimumStock || 0);
  const image = typeof p.image === "string" ? p.image : p.image?.url;
  const variants: LiveStockVariant[] = (p.variants ?? []).map((v) => ({
    id: v.id,
    code: v.code ?? "",
    name: v.name ?? "",
    image: v.image || undefined,
    onHand: (v.stocks ?? []).reduce((sum, st) => sum + Number(st.quantity || 0), 0),
  }));
  return {
    id: p.id,
    image: image || undefined,
    variants,
    code: p.code,
    name: p.name,
    sku: p.sku ?? "",
    category: p.category?.name ?? "—",
    warehousesCount: warehouses.filter((w) => w.qty > 0).length,
    onHand,
    status: levelFor(onHand, reorderPoint),
    unitCost: Number(p.costPrice || 0),
    reorderPoint,
    warehouses,
  };
}

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (!Number.isFinite(min) || min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const TYPE_OF = { IN: "Stock In", OUT: "Stock Out", TRANSFER: "Transfer", ADJUSTMENT: "Adjustment" } as const;

function toHistory(h: ApiHistory): LiveHistoryEntry {
  const type = TYPE_OF[h.kind] ?? "Adjustment";
  const decrease = h.kind === "OUT" || (h.kind === "ADJUSTMENT" && !!h.fromWarehouse && !h.toWarehouse);
  return {
    id: h.id,
    timestamp: ago(h.at),
    at: h.at,
    type,
    productName: h.productName,
    sku: h.productCode,
    quantity: decrease ? -Math.abs(h.quantity) : Math.abs(h.quantity),
    warehouse: h.fromWarehouse || h.toWarehouse || "—",
    destinationWarehouse: h.kind === "TRANSFER" ? (h.toWarehouse ?? undefined) : undefined,
    reason: h.reason ?? undefined,
    user: h.byStaff ?? "—",
  };
}

/** Most recent movements (the API pages 100 at a time; the first pages are enough for the screens). */
async function fetchHistory(pages = 3): Promise<LiveHistoryEntry[]> {
  const rows: ApiHistory[] = [];
  for (let page = 1; page <= pages; page++) {
    const json = await api.get<{ data: ApiHistory[]; hasNextPage?: boolean }>("stock-adjustments/history", { page, limit: 100 });
    rows.push(...(json.data ?? []));
    if (!json.hasNextPage) break;
  }
  return rows.map(toHistory);
}

interface LiveStockState {
  products: LiveStockProduct[];
  history: LiveHistoryEntry[];
  warehouses: LookupOption[];
  loading: boolean;
  error: string;
  loaded: boolean;
  /** Loads once; pass `force` to reload after a change. */
  load: (force?: boolean) => Promise<void>;
  /** Everything below throws `ApiError` — show its message. */
  stockIn: (p: LiveStockProduct, warehouseCode: string, qty: number, reason: string) => Promise<void>;
  stockOut: (p: LiveStockProduct, warehouseCode: string, qty: number, reason: string) => Promise<void>;
  transfer: (p: LiveStockProduct, fromCode: string, toCode: string, qty: number, reason: string) => Promise<void>;
  /** Sets the counted quantity for one warehouse (sends the difference). */
  setCount: (p: LiveStockProduct, warehouseCode: string, newCount: number, reason: string) => Promise<void>;
}

export const useLiveStock = create<LiveStockState>((set, get) => ({
  products: [],
  history: [],
  warehouses: [],
  loading: false,
  error: "",
  loaded: false,

  load: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;
    set({ loading: true, error: "" });
    try {
      const [products, warehouses, history] = await Promise.all([
        listAll<ApiProduct>("products").then((rows) => rows.map(toProduct)),
        fetchWarehouses(),
        // History needs its own permission; the stock list must still load without it.
        fetchHistory().catch(() => [] as LiveHistoryEntry[]),
      ]);
      set({ products, warehouses, history, loaded: true, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "Could not load stock." });
    }
  },

  stockIn: async (p, warehouseCode, qty, reason) => {
    await api.post("stock-adjustments", {
      productCode: p.code,
      warehouseCode,
      adjustmentType: "INCREASE",
      quantity: qty,
      reason: reason.trim() || "Stock in",
    });
    await get().load(true);
  },

  stockOut: async (p, warehouseCode, qty, reason) => {
    await api.post("stock-adjustments", {
      productCode: p.code,
      warehouseCode,
      adjustmentType: "DECREASE",
      quantity: qty,
      reason: reason.trim() || "Stock out",
    });
    await get().load(true);
  },

  transfer: async (p, fromCode, toCode, qty, reason) => {
    await api.post("stock-adjustments/transfer", {
      transfers: [
        {
          productCode: p.code,
          fromWarehouseCode: fromCode,
          toWarehouseCode: toCode,
          quantity: qty,
          reason: reason.trim() || "Warehouse transfer",
        },
      ],
    });
    await get().load(true);
  },

  setCount: async (p, warehouseCode, newCount, reason) => {
    const current = p.warehouses.find((w) => w.code === warehouseCode)?.qty ?? 0;
    const diff = newCount - current;
    if (diff === 0) throw new Error("The counted quantity equals the current stock. Nothing to adjust.");
    await api.post("stock-adjustments", {
      productCode: p.code,
      warehouseCode,
      adjustmentType: diff > 0 ? "INCREASE" : "DECREASE",
      quantity: Math.abs(diff),
      reason: reason.trim() || "Physical inventory count",
    });
    await get().load(true);
  },
}));
