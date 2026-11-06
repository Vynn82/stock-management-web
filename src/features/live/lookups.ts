import { listAll } from "./http";

export interface LookupOption {
  id: string;
  code: string;
  name: string;
}

interface Row {
  id: string | number;
  code?: string;
  name?: string;
  isActive?: boolean;
}

async function lookup(url: string): Promise<LookupOption[]> {
  const rows = await listAll<Row>(url);
  return rows
    .filter((r) => r.isActive !== false && r.code)
    .map((r) => ({ id: String(r.id), code: String(r.code), name: r.name ?? String(r.code) }));
}

export const fetchCategories = () => lookup("categories");
export const fetchBrands = () => lookup("brands");
export const fetchSuppliers = () => lookup("suppliers");
export const fetchWarehouses = () => lookup("warehouses");
