export type PurchaseOrder = {
  number: string;
  date: string;
  total: number;
  status: "Pending" | "Received" | "Cancelled";
};

export type Supplier = {
  id: number;
  name: string;
  contact: string;
  detailContact?: string;
  openOrders: number;
  detailOpenOrders?: number;
  totalSpend: number;
  detailTotalSpend?: number;
  active: boolean;
  phone: string;
  email: string;
  address: string;
  averageLeadTime: number;
  ordersPlaced: number;
  notes: string;
  purchaseOrders: PurchaseOrder[];
};

export const suppliers: Supplier[] = [
  {
    id: 1,
    name: "PaperCo Supplies",
    contact: "Ratana Sok",
    detailContact: "Rithy Sok",
    openOrders: 12,
    detailOpenOrders: 1,
    totalSpend: 18420,
    detailTotalSpend: 3721.7,
    active: true,
    phone: "+855 12 345 678",
    email: "rithy@paperco-supplies.com",
    address: "No. 88, St. 271, Phnom Penh",
    averageLeadTime: 6,
    ordersPlaced: 5,
    notes: "Preferred paper & office-supplies vendor. Offers net-15 terms on orders above $500. Deliveries usually arrive within a week of confirmation.",
    purchaseOrders: [
      { number: "PO-2041", date: "Aug 26, 2026", total: 640, status: "Pending" },
      { number: "PO-2033", date: "Aug 12, 2026", total: 1210, status: "Received" },
      { number: "PO-2019", date: "Jul 29, 2026", total: 385.5, status: "Received" },
      { number: "PO-2002", date: "Jul 14, 2026", total: 972, status: "Received" },
      { number: "PO-1988", date: "Jun 30, 2026", total: 514.2, status: "Cancelled" },
    ],
  },
  {
    id: 2,
    name: "TechEdge Distribution",
    contact: "Vibol Chan",
    openOrders: 5,
    totalSpend: 42110,
    active: true,
    phone: "+855 23 456 789",
    email: "vibol@techedge.com",
    address: "No. 42, Monivong Blvd, Phnom Penh",
    averageLeadTime: 4,
    ordersPlaced: 18,
    notes: "Technology and computer equipment distributor. Contact the supplier to confirm availability for larger orders.",
    purchaseOrders: [
      { number: "PO-2050", date: "Aug 28, 2026", total: 2410, status: "Pending" },
      { number: "PO-2027", date: "Aug 8, 2026", total: 1850, status: "Received" },
      { number: "PO-1998", date: "Jul 10, 2026", total: 3260, status: "Received" },
    ],
  },
  {
    id: 3,
    name: "Khmer Pack Co.",
    contact: "Sreymom Heng",
    openOrders: 2,
    totalSpend: 6850,
    active: true,
    phone: "+855 12 654 321",
    email: "sales@khmerpack.com",
    address: "St. 2004, Sen Sok, Phnom Penh",
    averageLeadTime: 5,
    ordersPlaced: 9,
    notes: "Local packaging supplier for cartons, labels, and shipping materials.",
    purchaseOrders: [
      { number: "PO-2044", date: "Aug 27, 2026", total: 425, status: "Pending" },
      { number: "PO-2014", date: "Jul 24, 2026", total: 890, status: "Received" },
    ],
  },
  {
    id: 4,
    name: "Baitong Lighting",
    contact: "Pisach Ly",
    openOrders: 0,
    totalSpend: 3200,
    active: false,
    phone: "+855 11 222 333",
    email: "info@baitonglighting.com",
    address: "St. 310, Boeung Keng Kang, Phnom Penh",
    averageLeadTime: 8,
    ordersPlaced: 3,
    notes: "Lighting and electrical fixtures supplier. Account is currently inactive.",
    purchaseOrders: [
      { number: "PO-1960", date: "Jun 12, 2026", total: 760, status: "Received" },
      { number: "PO-1912", date: "May 19, 2026", total: 520, status: "Received" },
    ],
  },
  {
    id: 5,
    name: "Mekong Furniture Works",
    contact: "Dara Pich",
    openOrders: 1,
    totalSpend: 11760,
    active: true,
    phone: "+855 16 333 444",
    email: "orders@mekongfurniture.com",
    address: "National Road 6A, Chroy Changvar",
    averageLeadTime: 10,
    ordersPlaced: 7,
    notes: "Furniture and workspace fixtures supplier serving Phnom Penh and nearby provinces.",
    purchaseOrders: [
      { number: "PO-2047", date: "Aug 28, 2026", total: 1760, status: "Pending" },
      { number: "PO-2008", date: "Jul 18, 2026", total: 2350, status: "Received" },
    ],
  },
];

export function getSupplier(id: string) {
  return suppliers.find((supplier) => supplier.id === Number(id));
}

export const customSupplierStorageKey = "sf-custom-suppliers";

export function readCustomSuppliers(): Supplier[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(customSupplierStorageKey);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isSupplier)) {
    throw new Error("Saved supplier data is invalid. Clear the saved supplier records and try again.");
  }
  return parsed;
}

function isSupplier(value: unknown): value is Supplier {
  if (typeof value !== "object" || value === null) return false;
  const supplier = value as Partial<Supplier>;
  return typeof supplier.id === "number"
    && typeof supplier.name === "string"
    && typeof supplier.contact === "string"
    && typeof supplier.openOrders === "number"
    && typeof supplier.totalSpend === "number"
    && typeof supplier.active === "boolean"
    && typeof supplier.phone === "string"
    && typeof supplier.email === "string"
    && typeof supplier.address === "string"
    && typeof supplier.averageLeadTime === "number"
    && typeof supplier.ordersPlaced === "number"
    && typeof supplier.notes === "string"
    && Array.isArray(supplier.purchaseOrders);
}
