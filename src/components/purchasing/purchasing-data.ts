export type POStatus = "Pending" | "Approved" | "Received" | "Draft" | "Rejected";

export interface POLineItem {
  product: string;
  qty: number;
  unitCost: number;
  lineTotal: number;
}

export interface POActivity {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  reason?: string;
}

export interface POSupplierInfo {
  name: string;
  contact: string;
  phone: string;
  email: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  items: number;
  total: number;
  status: POStatus;
  orderDate: string;
  expectedDate: string;
  notes?: string;
  lineItems: POLineItem[];
  activities: POActivity[];
  supplierInfo?: POSupplierInfo;
  rejectionReason?: string;
}

export const supplierDirectory: Record<string, POSupplierInfo> = {
  "TechEdge Distribution": {
    name: "TechEdge Distribution",
    contact: "Vibol Chan",
    phone: "+855 12 345 678",
    email: "vibol@techedge.com.kh",
  },
  "PaperCo Supplies": {
    name: "PaperCo Supplies",
    contact: "Rithy Sok",
    phone: "+855 12 345 678",
    email: "rithy@papercosupplies.com",
  },
  "Khmer Pack Co.": {
    name: "Khmer Pack Co.",
    contact: "Sreymom Heng",
    phone: "+855 12 654 321",
    email: "sales@khmerpack.com",
  },
  "Baitong Lighting": {
    name: "Baitong Lighting",
    contact: "Pisach Ly",
    phone: "+855 11 222 333",
    email: "info@baitonglighting.com",
  },
};

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-2041",
    supplier: "PaperCo Supplies",
    items: 4,
    total: 640.0,
    status: "Pending",
    orderDate: "Aug 26, 2026",
    expectedDate: "Sep 02, 2026",
    lineItems: [
      { product: "A4 Paper Ream", qty: 40, unitCost: 8.5, lineTotal: 340.0 },
      { product: "Sticky Notes Pack", qty: 60, unitCost: 2.5, lineTotal: 150.0 },
      { product: "Ballpoint Pen Box", qty: 30, unitCost: 3.0, lineTotal: 90.0 },
      { product: "Manila Folder Pack", qty: 20, unitCost: 3.0, lineTotal: 60.0 },
    ],
    activities: [
      { id: "act-1", title: "Created by Dara Pich", time: "Aug 26, 2026 • 9:12 AM", completed: true },
      { id: "act-2", title: "Sent to PaperCo Supplies", time: "Aug 26, 2026 • 9:20 AM", completed: true },
      { id: "act-3", title: "Supplier confirmed order, expected Sep 02", time: "Aug 27, 2026 • 2:45 PM", completed: true },
      { id: "act-4", title: "Awaiting your approval", time: "now", completed: false },
    ],
    supplierInfo: supplierDirectory["PaperCo Supplies"],
  },
  {
    id: "PO-2040",
    supplier: "TechEdge Distribution",
    items: 12,
    total: 2340.0,
    status: "Approved",
    orderDate: "Aug 24, 2026",
    expectedDate: "Aug 30, 2026",
    lineItems: [
      { product: "Barcode Scanner Pro", qty: 6, unitCost: 140.0, lineTotal: 840.0 },
      { product: "Thermal Receipt Printer", qty: 3, unitCost: 280.0, lineTotal: 840.0 },
      { product: "USB-C Display Adapters", qty: 15, unitCost: 24.0, lineTotal: 360.0 },
      { product: "Wireless Keyboard & Mouse Sets", qty: 10, unitCost: 30.0, lineTotal: 300.0 },
    ],
    activities: [
      { id: "act-1", title: "Created by Sokha Chan", time: "Aug 24, 2026 • 10:05 AM", completed: true },
      { id: "act-2", title: "Sent to TechEdge Distribution", time: "Aug 24, 2026 • 10:15 AM", completed: true },
      { id: "act-3", title: "Approved by Operations Lead", time: "Aug 24, 2026 • 11:30 AM", completed: true },
    ],
    supplierInfo: supplierDirectory["TechEdge Distribution"],
  },
  {
    id: "PO-2039",
    supplier: "Khmer Pack Co.",
    items: 6,
    total: 410.0,
    status: "Received",
    orderDate: "Aug 20, 2026",
    expectedDate: "Aug 25, 2026",
    lineItems: [
      { product: "Custom Corrugated Boxes M", qty: 100, unitCost: 1.8, lineTotal: 180.0 },
      { product: "Fragile Handle With Care Tape", qty: 25, unitCost: 3.2, lineTotal: 80.0 },
      { product: "Pallet Stretch Film (500mm)", qty: 10, unitCost: 15.0, lineTotal: 150.0 },
    ],
    activities: [
      { id: "act-1", title: "Created by Lina Meng", time: "Aug 20, 2026 • 8:40 AM", completed: true },
      { id: "act-2", title: "Approved by Procurement Head", time: "Aug 20, 2026 • 9:00 AM", completed: true },
      { id: "act-3", title: "Delivered & Inspected at Main Warehouse", time: "Aug 25, 2026 • 3:15 PM", completed: true },
    ],
    supplierInfo: supplierDirectory["Khmer Pack Co."],
  },
  {
    id: "PO-2038",
    supplier: "PaperCo Supplies",
    items: 2,
    total: 128.0,
    status: "Draft",
    orderDate: "Aug 19, 2026",
    expectedDate: "—",
    lineItems: [
      { product: "Permanent Markers (Box of 12)", qty: 8, unitCost: 11.0, lineTotal: 88.0 },
      { product: "Heavy Duty Tape Dispensers", qty: 4, unitCost: 10.0, lineTotal: 40.0 },
    ],
    activities: [
      { id: "act-1", title: "Draft created by Dara Pich", time: "Aug 19, 2026 • 4:20 PM", completed: true },
      { id: "act-2", title: "Awaiting final review", time: "now", completed: false },
    ],
    supplierInfo: supplierDirectory["PaperCo Supplies"],
  },
  {
    id: "PO-2037",
    supplier: "TechEdge Distribution",
    items: 9,
    total: 1875.5,
    status: "Received",
    orderDate: "Aug 12, 2026",
    expectedDate: "Aug 18, 2026",
    lineItems: [
      { product: "Industrial Handheld Terminal", qty: 2, unitCost: 650.0, lineTotal: 1300.0 },
      { product: "Replacement Battery Packs", qty: 5, unitCost: 65.0, lineTotal: 325.0 },
      { product: "Charging Dock Multi-Bay", qty: 1, unitCost: 250.5, lineTotal: 250.5 },
    ],
    activities: [
      { id: "act-1", title: "Created by Vibol Seng", time: "Aug 12, 2026 • 11:10 AM", completed: true },
      { id: "act-2", title: "Approved by Admin", time: "Aug 12, 2026 • 1:00 PM", completed: true },
      { id: "act-3", title: "Received into Siem Reap Warehouse", time: "Aug 18, 2026 • 10:20 AM", completed: true },
    ],
    supplierInfo: supplierDirectory["TechEdge Distribution"],
  },
  {
    id: "PO-2036",
    supplier: "Khmer Pack Co.",
    items: 5,
    total: 322.0,
    status: "Approved",
    orderDate: "Aug 05, 2026",
    expectedDate: "Aug 11, 2026",
    lineItems: [
      { product: "Padded Kraft Mailers #2", qty: 150, unitCost: 0.9, lineTotal: 135.0 },
      { product: "Clear Packing Tape (6 rolls)", qty: 15, unitCost: 12.0, lineTotal: 180.0 },
      { product: "Thermal Label Rolls 4x6", qty: 5, unitCost: 1.4, lineTotal: 7.0 },
    ],
    activities: [
      { id: "act-1", title: "Created by Lina Meng", time: "Aug 05, 2026 • 9:30 AM", completed: true },
      { id: "act-2", title: "Approved by Warehouse Manager", time: "Aug 05, 2026 • 10:15 AM", completed: true },
    ],
    supplierInfo: supplierDirectory["Khmer Pack Co."],
  },
  {
    id: "PO-2035",
    supplier: "PaperCo Supplies",
    items: 3,
    total: 214.0,
    status: "Received",
    orderDate: "Jul 29, 2026",
    expectedDate: "Aug 03, 2026",
    lineItems: [
      { product: "Carbonless Invoice Books", qty: 20, unitCost: 5.5, lineTotal: 110.0 },
      { product: "Office Binder Clips Large", qty: 12, unitCost: 4.5, lineTotal: 54.0 },
      { product: "A4 File Folders (50 pack)", qty: 2, unitCost: 25.0, lineTotal: 50.0 },
    ],
    activities: [
      { id: "act-1", title: "Created by Dara Pich", time: "Jul 29, 2026 • 8:15 AM", completed: true },
      { id: "act-2", title: "Received and Stocked", time: "Aug 03, 2026 • 4:00 PM", completed: true },
    ],
    supplierInfo: supplierDirectory["PaperCo Supplies"],
  },
];

const STORAGE_KEY = "stockflow_purchase_orders_v2";

export function loadSavedPurchaseOrders(): PurchaseOrder[] {
  if (typeof window === "undefined") return initialPurchaseOrders;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialPurchaseOrders;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback to initial
  }
  return initialPurchaseOrders;
}

export function savePurchaseOrders(orders: PurchaseOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  const all = loadSavedPurchaseOrders();
  const found = all.find((o) => o.id.toLowerCase() === id.toLowerCase());
  if (found) {
    if (!found.supplierInfo && supplierDirectory[found.supplier]) {
      found.supplierInfo = supplierDirectory[found.supplier];
    }
    return found;
  }
  // Check initial list as well
  const initFound = initialPurchaseOrders.find((o) => o.id.toLowerCase() === id.toLowerCase());
  if (initFound && !initFound.supplierInfo && supplierDirectory[initFound.supplier]) {
    initFound.supplierInfo = supplierDirectory[initFound.supplier];
  }
  return initFound;
}

export function updatePurchaseOrderStatus(
  id: string,
  newStatus: POStatus,
  reason?: string,
): PurchaseOrder | null {
  const all = loadSavedPurchaseOrders();
  const index = all.findIndex((o) => o.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  const current = all[index];
  const nowStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const updatedActivities = [
    ...current.activities.map((a) => (a.title.includes("Awaiting") ? { ...a, completed: true } : a)),
    {
      id: `act-${Date.now()}`,
      title: `${newStatus === "Approved" ? "Approved" : newStatus === "Rejected" ? "Rejected" : "Updated to " + newStatus} by you`,
      time: `${nowStr} • Just now`,
      completed: true,
      reason: reason,
    },
  ];

  const updated: PurchaseOrder = {
    ...current,
    status: newStatus,
    activities: updatedActivities,
    rejectionReason: reason || current.rejectionReason,
  };

  all[index] = updated;
  savePurchaseOrders(all);
  return updated;
}

export function createPurchaseOrder(po: Partial<PurchaseOrder>): PurchaseOrder {
  const all = loadSavedPurchaseOrders();
  const maxNum = all.reduce((max, order) => {
    const match = order.id.match(/PO-(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      return Math.max(max, isNaN(n) ? 0 : n);
    }
    return max;
  }, 2041);
  const nextId = po.id || `PO-${maxNum + 1}`;
  const now = new Date();
  const nowStr = now.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const supplier = po.supplier || "TechEdge Distribution";
  const newOrder: PurchaseOrder = {
    id: nextId,
    supplier,
    items: po.lineItems?.length || 0,
    total: po.total || 0,
    status: po.status || "Pending",
    orderDate: po.orderDate || nowStr,
    expectedDate: po.expectedDate || "Sep 05, 2026",
    lineItems: po.lineItems || [],
    activities: po.activities || [
      {
        id: `act-${Date.now()}`,
        title: "Created by Dara Pich",
        time: `${nowStr} • 9:12 AM`,
        completed: true,
      },
      {
        id: `act-${Date.now() + 1}`,
        title: `Sent to ${supplier}`,
        time: `${nowStr} • 9:20 AM`,
        completed: true,
      },
      {
        id: `act-${Date.now() + 2}`,
        title: "Awaiting your approval",
        time: "now",
        completed: false,
      },
    ],
    supplierInfo: po.supplierInfo || supplierDirectory[supplier],
  };

  const updated = [newOrder, ...all];
  savePurchaseOrders(updated);
  return newOrder;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
