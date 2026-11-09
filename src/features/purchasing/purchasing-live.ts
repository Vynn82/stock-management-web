import { api, listAll } from "@/features/live/http";

/** Purchase orders from the real API, shaped for the Purchasing pages. */

export type PoRawStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CLOSED";

export interface PoBadge {
  label: string;
  /** Existing badge style: draft | pending | approved | received | rejected. */
  cls: string;
}

export function poBadge(status: string): PoBadge {
  switch (status) {
    case "DRAFT":
      return { label: "Draft", cls: "draft" };
    case "SUBMITTED":
      return { label: "Pending", cls: "pending" };
    case "APPROVED":
      return { label: "Approved", cls: "approved" };
    case "PARTIALLY_RECEIVED":
      return { label: "Partial", cls: "approved" };
    case "RECEIVED":
      return { label: "Received", cls: "received" };
    case "CLOSED":
      return { label: "Closed", cls: "received" };
    case "REJECTED":
      return { label: "Rejected", cls: "rejected" };
    default:
      return { label: status, cls: "draft" };
  }
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export interface Person {
  id: string;
  staffId: string;
  name: string;
}

export interface PoListRow {
  id: string;
  poNumber: string;
  status: string;
  supplier: string;
  warehouse: string;
  itemCount: number;
  total: number;
  createdAt: string;
}

interface ApiListRow {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  supplier: { code: string; name: string };
  warehouse: { code: string; name: string };
  createdAt: string;
}

export async function fetchPurchaseOrders(): Promise<PoListRow[]> {
  const rows = await listAll<ApiListRow>("purchase-orders");
  return rows.map((r) => ({
    id: r.id,
    poNumber: r.poNumber,
    status: r.status,
    supplier: r.supplier?.name ?? "—",
    warehouse: r.warehouse?.name ?? "—",
    itemCount: r.itemCount,
    total: Number(r.totalAmount || 0),
    createdAt: r.createdAt,
  }));
}

export interface PoItem {
  id: string;
  productCode: string | null;
  variantCode?: string | null;
  productName: string;
  variantName: string | null;
  label: string;
  quantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  lineTotal: number;
  /** New-product lines: received but not in the catalogue yet / already added. */
  isNew?: boolean;
  pendingCatalog?: boolean;
  catalogAdded?: boolean;
  newProduct?: { name: string; categoryCode: string | null; brandCode: string | null; unit?: string | null; sku?: string | null } | null;
}

export interface PoReceipt {
  id: string;
  receiptNumber: string;
  note: string | null;
  rating: number | null;
  receivedBy: Person | null;
  createdAt: string;
  items: { productName: string; variantName: string | null; quantity: number }[];
  issues: { productName: string; variantName: string | null; reason: string; quantity: number }[];
}

export interface PoDetail {
  id: string;
  poNumber: string;
  status: string;
  note: string | null;
  totalAmount: number;
  rejectionReason: string | null;
  supplier: { code: string; name: string };
  warehouse: { code: string; name: string };
  createdBy: Person | null;
  approver: Person | null;
  decidedBy: Person | null;
  decidedAt: string | null;
  createdAt: string;
  items: PoItem[];
  receipts: PoReceipt[];
}

export async function fetchPurchaseOrder(id: string): Promise<PoDetail> {
  const po = await api.get<PoDetail & { items: Omit<PoItem, "label">[] }>(`purchase-orders/${id}`);
  return {
    ...po,
    items: po.items.map((i) => ({
      ...i,
      label: i.variantName ? `${i.productName} — ${i.variantName}` : i.productName,
    })),
  };
}

export interface Approver {
  id: string;
  name: string;
  staffId: string;
  roles: string[];
}

export async function fetchApprovers(): Promise<Approver[]> {
  return api.get<Approver[]>("purchase-orders/approvers");
}

export const submitPo = (id: string, approverId?: string) => api.post(`purchase-orders/${id}/submit`, approverId ? { approverId } : {});
export const approvePo = (id: string) => api.post(`purchase-orders/${id}/approve`, {});
export const rejectPo = (id: string, reason: string) => api.post(`purchase-orders/${id}/reject`, { reason });
export const closePo = (id: string) => api.post(`purchase-orders/${id}/close`, {});

export interface ReceiveInput {
  items: { itemId: string; quantity: number }[];
  note?: string;
  closeAfter?: boolean;
  /** Why a line was short (record only, never changes stock). */
  issues?: { itemId: string; reason: "NOT_ARRIVED" | "DAMAGED" | "WRONG_ITEM"; quantity: number }[];
  /** How the delivery went, 1 (bad) to 5 (great). */
  rating?: number;
}
export const receivePo = (id: string, input: ReceiveInput) =>
  api.post(`purchase-orders/${id}/receive`, {
    items: input.items,
    ...(input.issues && input.issues.length > 0 ? { issues: input.issues } : {}),
    ...(input.rating ? { rating: input.rating } : {}),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    ...(input.closeAfter ? { closeAfter: true } : {}),
  });

/** A product (or one variant of it) that can be put on an order. */
export interface OrderableProduct {
  productId?: string;
  key: string;
  productCode: string;
  variantCode?: string;
  label: string;
  unitPrice: number;
}

interface ApiProduct {
  id?: string;
  code: string;
  name: string;
  costPrice?: number | string | null;
  variants?: { code: string; name: string; costPrice?: number | string | null }[];
}

export async function fetchOrderableProducts(): Promise<OrderableProduct[]> {
  const rows = await listAll<ApiProduct>("products");
  const out: OrderableProduct[] = [];
  for (const p of rows) {
    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        out.push({
          productId: p.id,
          key: `${p.code}|${v.code}`,
          productCode: p.code,
          variantCode: v.code,
          label: `${p.name} — ${v.name}`,
          unitPrice: Number(v.costPrice ?? p.costPrice ?? 0),
        });
      }
    } else {
      out.push({ productId: p.id, key: p.code, productCode: p.code, label: p.name, unitPrice: Number(p.costPrice ?? 0) });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

export interface CreatePoInput {
  supplierCode: string;
  warehouseCode: string;
  note?: string;
  submit: boolean;
  approverId?: string;
  items: {
    productCode?: string;
    variantCode?: string;
    /** A product that is not in the catalogue yet (created when received). */
    newProduct?: { name: string; categoryCode: string; brandCode?: string; unit?: string; sku?: string };
    quantity: number;
    unitPrice: number;
  }[];
}

export async function createPo(input: CreatePoInput): Promise<{ id: string }> {
  return api.post<{ id: string }>("purchase-orders", {
    supplierCode: input.supplierCode,
    warehouseCode: input.warehouseCode,
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    submit: input.submit,
    ...(input.submit && input.approverId ? { approverId: input.approverId } : {}),
    items: input.items,
  });
}

/** `PATCH /purchase-orders/:id` — only a draft can be edited (needs PO_CREATE). */
export async function updatePo(id: string, input: CreatePoInput): Promise<{ id: string }> {
  return api.patch<{ id: string }>(`purchase-orders/${id}`, {
    supplierCode: input.supplierCode,
    warehouseCode: input.warehouseCode,
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    submit: input.submit,
    ...(input.submit && input.approverId ? { approverId: input.approverId } : {}),
    items: input.items,
  });
}

// ---------------------------------------------------------------- order helpers

export interface ReorderItem {
  productId: string;
  code: string;
  name: string;
  unit: string;
  hasVariants: boolean;
  stock: number;
  minimumStock: number;
  status: "OUT" | "LOW";
  onOrder: number;
  suggestedQuantity: number;
  covered: boolean;
}

/** `GET /purchase-orders/reorder` — products at or below minimum stock (PO_CREATE). */
export async function fetchReorder(warehouseCode?: string): Promise<ReorderItem[]> {
  const res = await api.get<{ items: ReorderItem[] }>("purchase-orders/reorder", warehouseCode ? { warehouseCode } : {});
  return res.items ?? [];
}

export interface SupplierOption {
  supplierId: string;
  code: string;
  name: string;
  isDefault: boolean;
  timesOrdered: number;
  lastPrice: number;
  lowestPrice: number;
  averagePrice: number;
  averageLeadDays: number | null;
  fillRate: number | null;
  averageRating: number | null;
  ratingCount?: number;
  totalQuantity?: number;
  lastOrderedAt?: string | null;
  damagedQuantity: number;
  wrongQuantity: number;
}

/** `GET /purchase-orders/supplier-history/:productId` — who a product was bought from (PO_CREATE). */
export async function fetchSupplierHistory(productId: string): Promise<SupplierOption[]> {
  const res = await api.get<{ suppliers: SupplierOption[] }>(`purchase-orders/supplier-history/${productId}`);
  return (res.suppliers ?? []).map((s) => ({
    ...s,
    lastPrice: Number(s.lastPrice),
    lowestPrice: Number(s.lowestPrice),
    averagePrice: Number(s.averagePrice),
  }));
}

export interface ImportRow {
  row: number;
  productCode: string | null;
  variantCode: string | null;
  productName: string | null;
  variantName: string | null;
  isNew: boolean;
  quantity: number | null;
  unitPrice: number | null;
  categoryCode?: string | null;
  categoryName?: string | null;
  unit?: string | null;
  sku?: string | null;
  error: string | null;
}

/** `POST /purchase-orders/import` — checks an Excel/CSV file row by row, saves nothing (PO_CREATE). */
export interface PoImportResult {
  rows: ImportRow[];
  validCount: number;
  errorCount: number;
  /** From the optional supplier_code / warehouse_code columns (the whole order). */
  supplier?: { code: string; name: string } | null;
  warehouse?: { code: string; name: string } | null;
  headerErrors?: string[];
}

export async function previewPoImport(file: File): Promise<PoImportResult> {
  const form = new FormData();
  form.append("file", file);
  return api.postForm("purchase-orders/import", form);
}

/** `POST /purchase-orders/:id/catalog-added` — the received new products were added to the catalogue. */
export const markCatalogAdded = (id: string) => api.post(`purchase-orders/${id}/catalog-added`, {});

/** Downloads the received new products as an Add Product import file (PO_VIEW). */
export const exportNewProducts = (id: string, poNumber: string) =>
  api.download(`purchase-orders/${id}/export-products`, `${poNumber}_new_products.xlsx`);
