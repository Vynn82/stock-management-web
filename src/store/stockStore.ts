import { create } from "zustand";

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

export const INITIAL_DETAILED_STOCK: DetailedStockItem[] = [
  {
    id: "1",
    name: "Wireless Mouse M185",
    sku: "WM-M185-BLK",
    category: "Electronics",
    warehousesCount: 4,
    onHand: 76,
    reservedTotal: 9,
    status: "Active",
    unitCost: 8.5,
    reorderPoint: 15,
    warehouses: [
      { warehouse: "Phnom Penh Main Warehouse", onHand: 42, reserved: 6 },
      { warehouse: "Siem Reap Branch Warehouse", onHand: 18, reserved: 2 },
      { warehouse: "Battambang Warehouse", onHand: 10, reserved: 0 },
      { warehouse: "Sihanoukville Warehouse", onHand: 6, reserved: 1 },
    ],
    transactions: [
      {
        id: "tx-1",
        date: "Aug 27, 2026",
        type: "In",
        qty: 30,
        warehouse: "Phnom Penh Main Warehouse",
        reason: "Supplier delivery PO #9021",
        user: "Sokha Chan",
      },
      {
        id: "tx-2",
        date: "Aug 25, 2026",
        type: "Transfer",
        qty: 12,
        warehouse: "Siem Reap Branch Warehouse",
        destinationWarehouse: "Battambang Warehouse",
        reason: "Inventory balance",
        user: "Dara Pich",
      },
      {
        id: "tx-3",
        date: "Aug 22, 2026",
        type: "Out",
        qty: -5,
        warehouse: "Phnom Penh Main Warehouse",
        reason: "Customer order #SO-3104",
        user: "Leakena Sam",
      },
      {
        id: "tx-4",
        date: "Aug 18, 2026",
        type: "In",
        qty: 20,
        warehouse: "Battambang Warehouse",
        reason: "Regional shipment",
        user: "Vanna Roeun",
      },
    ],
  },
  {
    id: "2",
    name: "USB-C Cable 2m",
    sku: "UC-2M-BLK",
    category: "Electronics",
    warehousesCount: 3,
    onHand: 12,
    reservedTotal: 2,
    status: "Low Stock",
    unitCost: 6.2,
    reorderPoint: 15,
    warehouses: [
      { warehouse: "Phnom Penh Main Warehouse", onHand: 8, reserved: 1 },
      { warehouse: "Siem Reap Branch Warehouse", onHand: 3, reserved: 1 },
      { warehouse: "Sihanoukville Warehouse", onHand: 1, reserved: 0 },
    ],
    transactions: [
      {
        id: "tx-201",
        date: "Aug 26, 2026",
        type: "Out",
        qty: -12,
        warehouse: "Phnom Penh Main Warehouse",
        reason: "Order dispatch",
        user: "Admin",
      },
    ],
  },
  {
    id: "3",
    name: "A4 Paper Ream",
    sku: "PPR-A4-500",
    category: "Office",
    warehousesCount: 5,
    onHand: 120,
    reservedTotal: 15,
    status: "Active",
    unitCost: 4.8,
    reorderPoint: 40,
    warehouses: [
      { warehouse: "Phnom Penh Main Warehouse", onHand: 50, reserved: 8 },
      { warehouse: "Siem Reap Branch Warehouse", onHand: 30, reserved: 4 },
      { warehouse: "Battambang Warehouse", onHand: 20, reserved: 2 },
      { warehouse: "Kampong Cham Warehouse", onHand: 10, reserved: 1 },
      { warehouse: "Sihanoukville Warehouse", onHand: 10, reserved: 0 },
    ],
    transactions: [
      {
        id: "tx-301",
        date: "Aug 28, 2026",
        type: "In",
        qty: 50,
        warehouse: "Phnom Penh Main Warehouse",
        reason: "Supplier batch restock",
        user: "Sokha Chan",
      },
    ],
  },
  {
    id: "4",
    name: "Desk Lamp LED",
    sku: "LMP-LED-09",
    category: "Furniture",
    warehousesCount: 0,
    onHand: 0,
    reservedTotal: 0,
    status: "Out of Stock",
    unitCost: 28.0,
    reorderPoint: 10,
    warehouses: [],
    transactions: [
      {
        id: "tx-401",
        date: "Aug 15, 2026",
        type: "Out",
        qty: -3,
        warehouse: "Phnom Penh Main Warehouse",
        reason: "Cleared out damaged inventory",
        user: "Vanna Roeun",
      },
    ],
  },
  {
    id: "5",
    name: "Cardboard Box (M)",
    sku: "BOX-M-24",
    category: "Cables & Adapters",
    warehousesCount: 6,
    onHand: 312,
    reservedTotal: 30,
    status: "Active",
    unitCost: 1.25,
    reorderPoint: 80,
    warehouses: [
      { warehouse: "Phnom Penh Main Warehouse", onHand: 120, reserved: 12 },
      { warehouse: "Siem Reap Branch Warehouse", onHand: 64, reserved: 8 },
      { warehouse: "Battambang Warehouse", onHand: 48, reserved: 4 },
      { warehouse: "Kampong Cham Warehouse", onHand: 36, reserved: 4 },
      { warehouse: "Sihanoukville Warehouse", onHand: 24, reserved: 2 },
      { warehouse: "Kandal Warehouse", onHand: 20, reserved: 0 },
    ],
    transactions: [
      {
        id: "tx-501",
        date: "Aug 24, 2026",
        type: "In",
        qty: 100,
        warehouse: "Phnom Penh Main Warehouse",
        reason: "Packaging bulk supply",
        user: "Admin",
      },
    ],
  },
];

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

export const INITIAL_STOCK_TRANSACTIONS: GlobalStockTransaction[] = [
  {
    id: "tx-g-1",
    dateTime: "Aug 29, 9:14 AM",
    productId: "1",
    productName: "Wireless Mouse M185",
    type: "In",
    qty: 50,
    warehouse: "Phnom Penh Main Warehouse",
    performedBy: "Dara",
  },
  {
    id: "tx-g-2",
    dateTime: "Aug 29, 8:02 AM",
    productId: "2",
    productName: "USB-C Cable 2m",
    type: "Out",
    qty: -5,
    warehouse: "Phnom Penh Main Warehouse",
    performedBy: "Sokha",
  },
  {
    id: "tx-g-3",
    dateTime: "Aug 28, 4:45 PM",
    productId: "1",
    productName: "Wireless Mouse M185",
    type: "Transfer",
    qty: -18,
    warehouse: "Phnom Penh Main — Siem Reap Branch",
    performedBy: "Sokha",
  },
  {
    id: "tx-g-4",
    dateTime: "Aug 28, 2:20 PM",
    productId: "4",
    productName: "Desk Lamp LED",
    type: "Adjustment",
    qty: -2,
    warehouse: "Battambang Warehouse",
    performedBy: "Ravy",
  },
  {
    id: "tx-g-5",
    dateTime: "Aug 28, 11:05 AM",
    productId: "3",
    productName: "A4 Paper Ream",
    type: "Out",
    qty: -30,
    warehouse: "Phnom Penh Main Warehouse",
    performedBy: "Lina",
  },
  {
    id: "tx-g-6",
    dateTime: "Aug 27, 3:30 PM",
    productId: "2",
    productName: "USB-C Cable 2m",
    type: "In",
    qty: 40,
    warehouse: "Phnom Penh Main Warehouse",
    performedBy: "Dara",
  },
  {
    id: "tx-g-7",
    dateTime: "Aug 27, 10:12 AM",
    productId: "3",
    productName: "A4 Paper Ream",
    type: "Adjustment",
    qty: 5,
    warehouse: "Siem Reap Branch Warehouse",
    performedBy: "Lina",
  },
];

interface StockStoreState {
  items: DetailedStockItem[];
  globalTransactions: GlobalStockTransaction[];
  getItem: (idOrSku: string) => DetailedStockItem | undefined;
  updateProductInfo: (
    id: string,
    updates: Partial<Pick<DetailedStockItem, "name" | "sku" | "category" | "unitCost" | "reorderPoint">>
  ) => void;
  recordStockIn: (
    id: string,
    warehouse: string,
    qty: number,
    reason?: string
  ) => void;
  recordStockOut: (
    id: string,
    warehouse: string,
    qty: number,
    reason?: string
  ) => void;
  recordTransfer: (
    id: string,
    fromWarehouse: string,
    toWarehouse: string,
    qty: number,
    reason?: string
  ) => void;
  recordAdjustment: (
    id: string,
    warehouse: string,
    newCount: number,
    reason?: string
  ) => void;
}

const STORAGE_KEY = "stockflow_detailed_stock_v2";
const TRANSACTIONS_KEY = "stockflow_transactions_v2";

function loadStoredTransactions(): GlobalStockTransaction[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(TRANSACTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
  }
  return INITIAL_STOCK_TRANSACTIONS;
}

function persistTransactions(txs: GlobalStockTransaction[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
    } catch {
      // ignore
    }
  }
}

function loadStoredItems(): DetailedStockItem[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
  }
  return INITIAL_DETAILED_STOCK;
}

function persistItems(items: DetailedStockItem[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }
}

function computeItemStatus(onHand: number, reorderPoint: number): "Active" | "Low Stock" | "Out of Stock" {
  if (onHand <= 0) return "Out of Stock";
  if (onHand <= reorderPoint) return "Low Stock";
  return "Active";
}

export const useStockStore = create<StockStoreState>((set, get) => ({
  items: loadStoredItems(),
  globalTransactions: loadStoredTransactions(),

  getItem: (idOrSku: string) => {
    const list = get().items;
    return list.find(
      (item) =>
        item.id === idOrSku ||
        item.sku.toLowerCase() === idOrSku.toLowerCase() ||
        item.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === idOrSku.toLowerCase()
    );
  },

  updateProductInfo: (id, updates) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const reorder = updates.reorderPoint ?? item.reorderPoint;
        return {
          ...item,
          ...updates,
          status: computeItemStatus(item.onHand, reorder),
        };
      });
      persistItems(updated);
      return { items: updated };
    });
  },

  recordStockIn: (id, warehouse, qty, reason) => {
    set((state) => {
      const prod = state.items.find((p) => p.id === id);
      const newGlobalTx: GlobalStockTransaction = {
        id: `tx-g-${Date.now()}`,
        dateTime: "Just now",
        productId: id,
        productName: prod?.name || "Product",
        type: "In",
        qty: qty,
        warehouse,
        performedBy: "Admin",
      };
      const updatedGlobal = [newGlobalTx, ...state.globalTransactions];
      persistTransactions(updatedGlobal);

      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const exists = item.warehouses.some((w) => w.warehouse === warehouse);
        const warehouses = exists
          ? item.warehouses.map((w) =>
              w.warehouse === warehouse ? { ...w, onHand: w.onHand + qty } : w
            )
          : [...item.warehouses, { warehouse, onHand: qty, reserved: 0 }];
        const newOnHand = item.onHand + qty;
        const newTx: StockTransaction = {
          id: `tx-${Date.now()}`,
          date: "Today",
          type: "In",
          qty: qty,
          warehouse,
          reason: reason || "Manual Stock In",
          user: "Admin",
        };
        return {
          ...item,
          onHand: newOnHand,
          warehouses,
          warehousesCount: warehouses.filter((w) => w.onHand > 0).length,
          status: computeItemStatus(newOnHand, item.reorderPoint),
          transactions: [newTx, ...item.transactions],
        };
      });
      persistItems(updated);
      return { items: updated, globalTransactions: updatedGlobal };
    });
  },

  recordStockOut: (id, warehouse, qty, reason) => {
    set((state) => {
      const prod = state.items.find((p) => p.id === id);
      const newGlobalTx: GlobalStockTransaction = {
        id: `tx-g-${Date.now()}`,
        dateTime: "Just now",
        productId: id,
        productName: prod?.name || "Product",
        type: "Out",
        qty: -qty,
        warehouse,
        performedBy: "Admin",
      };
      const updatedGlobal = [newGlobalTx, ...state.globalTransactions];
      persistTransactions(updatedGlobal);

      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const warehouses = item.warehouses.map((w) =>
          w.warehouse === warehouse ? { ...w, onHand: Math.max(0, w.onHand - qty) } : w
        );
        const newOnHand = Math.max(0, item.onHand - qty);
        const newTx: StockTransaction = {
          id: `tx-${Date.now()}`,
          date: "Today",
          type: "Out",
          qty: -qty,
          warehouse,
          reason: reason || "Manual Stock Out",
          user: "Admin",
        };
        return {
          ...item,
          onHand: newOnHand,
          warehouses,
          warehousesCount: warehouses.filter((w) => w.onHand > 0).length,
          status: computeItemStatus(newOnHand, item.reorderPoint),
          transactions: [newTx, ...item.transactions],
        };
      });
      persistItems(updated);
      return { items: updated, globalTransactions: updatedGlobal };
    });
  },

  recordTransfer: (id, fromWarehouse, toWarehouse, qty, reason) => {
    set((state) => {
      const prod = state.items.find((p) => p.id === id);
      const newGlobalTx: GlobalStockTransaction = {
        id: `tx-g-${Date.now()}`,
        dateTime: "Just now",
        productId: id,
        productName: prod?.name || "Product",
        type: "Transfer",
        qty: -qty,
        warehouse: `${fromWarehouse} — ${toWarehouse}`,
        performedBy: "Admin",
      };
      const updatedGlobal = [newGlobalTx, ...state.globalTransactions];
      persistTransactions(updatedGlobal);

      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        let warehouses = item.warehouses.map((w) =>
          w.warehouse === fromWarehouse ? { ...w, onHand: Math.max(0, w.onHand - qty) } : w
        );
        const destExists = warehouses.some((w) => w.warehouse === toWarehouse);
        if (destExists) {
          warehouses = warehouses.map((w) =>
            w.warehouse === toWarehouse ? { ...w, onHand: w.onHand + qty } : w
          );
        } else {
          warehouses.push({ warehouse: toWarehouse, onHand: qty, reserved: 0 });
        }
        const newTx: StockTransaction = {
          id: `tx-${Date.now()}`,
          date: "Today",
          type: "Transfer",
          qty: qty,
          warehouse: fromWarehouse,
          destinationWarehouse: toWarehouse,
          reason: reason || "Inter-warehouse Transfer",
          user: "Admin",
        };
        return {
          ...item,
          warehouses,
          warehousesCount: warehouses.filter((w) => w.onHand > 0).length,
          transactions: [newTx, ...item.transactions],
        };
      });
      persistItems(updated);
      return { items: updated, globalTransactions: updatedGlobal };
    });
  },

  recordAdjustment: (id, warehouse, newCount, reason) => {
    set((state) => {
      const prod = state.items.find((p) => p.id === id);
      const currentWhQty =
        prod?.warehouses.find((w) => w.warehouse === warehouse)?.onHand || 0;
      const variance = newCount - currentWhQty;

      const newGlobalTx: GlobalStockTransaction = {
        id: `tx-g-${Date.now()}`,
        dateTime: "Just now",
        productId: id,
        productName: prod?.name || "Product",
        type: "Adjustment",
        qty: variance,
        warehouse,
        performedBy: "Admin",
      };
      const updatedGlobal = [newGlobalTx, ...state.globalTransactions];
      persistTransactions(updatedGlobal);

      const updated = state.items.map((item) => {
        if (item.id !== id) return item;
        const exists = item.warehouses.some((w) => w.warehouse === warehouse);
        let warehouses: WarehouseDetailStock[];
        if (exists) {
          warehouses = item.warehouses.map((w) =>
            w.warehouse === warehouse ? { ...w, onHand: Math.max(0, newCount) } : w
          );
        } else {
          warehouses = [...item.warehouses, { warehouse, onHand: Math.max(0, newCount), reserved: 0 }];
        }
        const newTotal = warehouses.reduce((acc, w) => acc + w.onHand, 0);
        const newTx: StockTransaction = {
          id: `tx-${Date.now()}`,
          date: "Today",
          type: "Adjustment",
          qty: variance,
          warehouse,
          reason: `${reason || "Inventory Adjustment"} (${variance >= 0 ? "+" : ""}${variance})`,
          user: "Admin",
        };
        return {
          ...item,
          onHand: newTotal,
          warehouses,
          warehousesCount: warehouses.filter((w) => w.onHand > 0).length,
          status: computeItemStatus(newTotal, item.reorderPoint),
          transactions: [newTx, ...item.transactions],
        };
      });
      persistItems(updated);
      return { items: updated, globalTransactions: updatedGlobal };
    });
  },
}));
