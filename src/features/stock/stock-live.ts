import { create } from "zustand";
import { api } from "@/features/live/http";
import { LookupOption, fetchWarehouses } from "@/features/live/lookups";
import { listAll } from "@/features/live/http";
import { createStockRequest, type NewStockRequestInput } from "@/features/requests/requests-live";

/** The approval chain a requester picked (only used when the action becomes a request). */
export type ChainSteps = NewStockRequestInput["approvers"];
import { useAuthStore } from "@/store/authStore";
import { needsApproval } from "@/lib/auth/permissions";

/** `done`: the stock changed now. `requested`: a request was sent and waits for approval. */
export type StockOutcome = "done" | "requested";

export const REQUEST_SENT_MESSAGE = "Request sent for approval. The stock changes once it is approved. Track it under Requests.";

/** Staff lack the stock permissions: their action becomes a request instead of a direct change. */
const mustAsk = (permission: "STOCK_ADJUST" | "STOCK_TRANSFER") => needsApproval(useAuthStore.getState().user, permission);

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
  /** Quantity of this variant in each warehouse, by warehouse code. */
  byWarehouse: Record<string, number>;
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
  variants?: { id: string; code?: string; name?: string; image?: string | null; stocks?: { quantity: number | string; warehouse?: { code?: string } | null }[] }[];
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
    byWarehouse: (v.stocks ?? []).reduce<Record<string, number>>((acc, st) => {
      const code = st.warehouse?.code ?? "";
      acc[code] = (acc[code] ?? 0) + Number(st.quantity || 0);
      return acc;
    }, {}),
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
  stockIn: (p: LiveStockProduct, warehouseCode: string, qty: number, reason: string, variantCode?: string, approvers?: ChainSteps) => Promise<StockOutcome>;
  stockOut: (p: LiveStockProduct, warehouseCode: string, qty: number, reason: string, approvers?: ChainSteps) => Promise<StockOutcome>;
  transfer: (p: LiveStockProduct, fromCode: string, toCode: string, qty: number, reason: string, approvers?: ChainSteps) => Promise<StockOutcome>;
  /** Sets the counted quantity for one warehouse (sends the difference). */
  setCount: (p: LiveStockProduct, warehouseCode: string, newCount: number, reason: string, approvers?: ChainSteps) => Promise<StockOutcome>;
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

  stockIn: async (p, warehouseCode, qty, reason, variantCode, approvers) => {
    if (mustAsk("STOCK_ADJUST")) {
      await createStockRequest({
        type: "STOCK_IN",
        productCode: p.code,
        variantCode,
        quantity: qty,
        fromWarehouseCode: warehouseCode,
        remark: reason.trim() || "Stock in",
        approvers,
      });
      return "requested";
    }
    await api.post("stock-adjustments", {
      productCode: p.code,
      ...(variantCode ? { variantCode } : {}),
      warehouseCode,
      adjustmentType: "INCREASE",
      movementType: "IN",
      quantity: qty,
      reason: reason.trim() || "Stock in",
    });
    await get().load(true);
    return "done";
  },

  stockOut: async (p, warehouseCode, qty, reason, approvers) => {
    if (mustAsk("STOCK_ADJUST")) {
      await createStockRequest({
        type: "STOCK_OUT",
        productCode: p.code,
        quantity: qty,
        fromWarehouseCode: warehouseCode,
        remark: reason.trim() || "Stock out",
        approvers,
      });
      return "requested";
    }
    await api.post("stock-adjustments", {
      productCode: p.code,
      warehouseCode,
      adjustmentType: "DECREASE",
      movementType: "OUT",
      quantity: qty,
      reason: reason.trim() || "Stock out",
    });
    await get().load(true);
    return "done";
  },

  transfer: async (p, fromCode, toCode, qty, reason, approvers) => {
    if (mustAsk("STOCK_TRANSFER")) {
      await createStockRequest({
        type: "STOCK_TRANSFER",
        productCode: p.code,
        quantity: qty,
        fromWarehouseCode: fromCode,
        toWarehouseCode: toCode,
        remark: reason.trim() || "Warehouse transfer",
        approvers,
      });
      return "requested";
    }
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
    return "done";
  },

  setCount: async (p, warehouseCode, newCount, reason, approvers) => {
    const current = p.warehouses.find((w) => w.code === warehouseCode)?.qty ?? 0;
    const diff = newCount - current;
    if (diff === 0) throw new Error("The counted quantity equals the current stock. Nothing to adjust.");
    if (mustAsk("STOCK_ADJUST")) {
      await createStockRequest({
        type: "STOCK_ADJUSTMENT",
        adjustmentType: diff > 0 ? "INCREASE" : "DECREASE",
        productCode: p.code,
        quantity: Math.abs(diff),
        fromWarehouseCode: warehouseCode,
        remark: reason.trim() || "Physical inventory count",
        approvers,
      });
      return "requested";
    }
    await api.post("stock-adjustments", {
      productCode: p.code,
      warehouseCode,
      adjustmentType: diff > 0 ? "INCREASE" : "DECREASE",
      quantity: Math.abs(diff),
      reason: reason.trim() || "Physical inventory count",
    });
    await get().load(true);
    return "done";
  },
}));
