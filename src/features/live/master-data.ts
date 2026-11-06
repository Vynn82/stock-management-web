import { api, listAll } from "./http";

/**
 * Real-API access for the master data: categories, brands, suppliers and
 * warehouses. The list endpoints only return active rows, so "delete" in the
 * UI is a deactivate (the row disappears and can be restored from the API).
 */

export interface MasterRow {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface SupplierRow extends MasterRow {
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  platform?: string | null;
  platformLink?: string | null;
  country?: string | null;
}

export interface WarehouseRow extends MasterRow {
  address?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  capacity: number | null;
  usedQuantity: number;
  incomingQuantity: number;
}

export const SUPPLIER_PLATFORMS = [
  "TELEGRAM",
  "WHATSAPP",
  "FACEBOOK",
  "WECHAT",
  "LINE",
  "INSTAGRAM",
  "WEBSITE",
  "OTHER",
] as const;

/** Drops empty strings so optional validators (e.g. email) don't reject them. */
export function clean<T extends Record<string, unknown>>(data: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    out[key] = typeof value === "string" ? value.trim() : value;
  }
  return out as Partial<T>;
}

/** Builds a backend code (A–Z, 0–9, _) from a display name. */
export function codeFromName(name: string): string {
  const code = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
  return code || `ITEM_${Date.now().toString(36).toUpperCase()}`;
}

function resource<T extends { id: string }, C extends Record<string, unknown>>(path: string) {
  return {
    list: (search?: string) => listAll<T>(path, search ? { search } : {}),
    get: (id: string) => api.get<T>(`${path}/${id}`),
    create: (data: C) => api.post<T>(path, clean(data)),
    update: (id: string, data: Partial<C>) => api.patch<T>(`${path}/${id}`, data),
    deactivate: (id: string) => api.patch<{ message?: string }>(`${path}/${id}/deactivate`),
    activate: (id: string) => api.patch<{ message?: string }>(`${path}/${id}/activate`),
  };
}

export const categoriesApi = resource<MasterRow, { code: string; name: string; description?: string }>("categories");
export const brandsApi = resource<MasterRow, { code: string; name: string; description?: string }>("brands");

export interface SupplierInput extends Record<string, unknown> {
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  platform?: string;
  platformLink?: string;
  country?: string;
}
export const suppliersApi = resource<SupplierRow, SupplierInput>("suppliers");

export interface WarehouseInput extends Record<string, unknown> {
  code: string;
  name: string;
  description?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  capacity?: number | null;
}
export const warehousesApi = resource<WarehouseRow, WarehouseInput>("warehouses");

/** How many products sit in each category / brand, keyed by the code. */
export async function fetchProductCounts(): Promise<{ byCategory: Record<string, number>; byBrand: Record<string, number> }> {
  const rows = await listAll<{ category?: { code?: string } | null; brand?: { code?: string } | null }>("products");
  const byCategory: Record<string, number> = {};
  const byBrand: Record<string, number> = {};
  for (const p of rows) {
    if (p.category?.code) byCategory[p.category.code] = (byCategory[p.category.code] ?? 0) + 1;
    if (p.brand?.code) byBrand[p.brand.code] = (byBrand[p.brand.code] ?? 0) + 1;
  }
  return { byCategory, byBrand };
}

export interface SupplierOrder {
  id: string;
  number: string;
  date: string;
  total: number;
  status: string;
}

/** Purchase orders of one supplier, matched by its code (the API has no supplier filter yet). */
export async function fetchSupplierOrders(supplierCode: string): Promise<SupplierOrder[]> {
  const rows = await listAll<{
    id: string;
    poNumber: string;
    status: string;
    totalAmount: number | string;
    createdAt: string;
    supplier?: { code?: string } | null;
  }>("purchase-orders");
  return rows
    .filter((po) => po.supplier?.code === supplierCode)
    .map((po) => ({
      id: po.id,
      number: po.poNumber,
      date: new Date(po.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      total: Number(po.totalAmount || 0),
      status: po.status,
    }));
}

export const OPEN_PO_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED"];
