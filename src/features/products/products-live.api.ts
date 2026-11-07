import { api, listAll } from "@/features/live/http";

export type StockStatus = "In stock" | "Low stock" | "Out of stock";

interface ApiStock {
  quantity: number | string;
  warehouse?: { id?: string; code?: string; name?: string } | null;
}

interface ApiProduct {
  id: string;
  code?: string;
  name: string;
  sku?: string;
  barcode?: string | null;
  unit?: string;
  description?: string | null;
  image?: string | { url?: string } | null;
  costPrice?: number | string | null;
  sellingPrice?: number | string | null;
  minimumStock?: number | string | null;
  category?: { name?: string; code?: string } | null;
  brand?: { name?: string; code?: string } | null;
  supplier?: { name?: string; code?: string } | null;
  stocks?: ApiStock[];
  variants?: unknown[];
}

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  image?: string;
  category: string;
  brand: string;
  warehouses: string;
  quantity: number;
  minimum: number;
  status: StockStatus;
  price: number;
  hasVariants: boolean;
}

export function statusFor(quantity: number, minimum: number): StockStatus {
  if (quantity <= 0) return "Out of stock";
  if (minimum > 0 && quantity <= minimum) return "Low stock";
  return "In stock";
}

function toRow(p: ApiProduct): ProductRow {
  const stocks = p.stocks ?? [];
  const quantity = stocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  const minimum = Number(p.minimumStock || 0);
  const names = Array.from(
    new Set(stocks.filter((s) => Number(s.quantity) > 0).map((s) => s.warehouse?.name).filter(Boolean) as string[]),
  );
  const image = typeof p.image === "string" ? p.image : p.image?.url;
  return {
    id: p.id,
    name: p.name,
    sku: p.sku ?? "",
    image: image || undefined,
    category: p.category?.name ?? "—",
    brand: p.brand?.name ?? "—",
    warehouses: names.length === 0 ? "—" : names.length <= 2 ? names.join(", ") : `${names[0]} +${names.length - 1}`,
    quantity,
    minimum,
    status: statusFor(quantity, minimum),
    price: Number(p.sellingPrice || 0),
    hasVariants: (p.variants?.length ?? 0) > 0,
  };
}

export async function fetchProducts(): Promise<ProductRow[]> {
  return (await listAll<ApiProduct>("products")).map(toRow);
}

export async function deactivateProduct(id: string): Promise<void> {
  await api.patch(`products/${id}/deactivate`);
}

export interface NewProductInput {
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  categoryCode: string;
  brandCode?: string;
  supplierCode?: string;
  unit: string;
  minimumStock?: number;
  costPrice?: number;
  sellingPrice?: number;
  warehouseCode: string;
  quantity: number;
  location?: string;
  image?: File | null;
  /** When set (non-empty) the product is created with variants; stock is per variant. */
  variants?: NewVariantInput[];
}

export interface NewVariantInput {
  name: string;
  sku?: string;
  barcode?: string;
  costPrice?: number;
  sellingPrice?: number;
  warehouseCode: string;
  quantity: number;
  location?: string;
  /** Required: every variant of a new product has its own photo. */
  image: File;
}

/** `POST /products` (multipart: product / variants / stock JSON + image). */
export async function createProduct(input: NewProductInput): Promise<void> {
  const product: Record<string, unknown> = {
    productName: input.name.trim(),
    categoryCode: input.categoryCode,
    unit: input.unit.trim() || "PCS",
    hasVariants: (input.variants?.length ?? 0) > 0,
  };
  if (input.sku?.trim()) product.productSku = input.sku.trim();
  if (input.barcode?.trim()) product.productBarcode = input.barcode.trim();
  if (input.description?.trim()) product.description = input.description.trim();
  if (input.brandCode) product.brandCode = input.brandCode;
  if (input.supplierCode) product.supplierCode = input.supplierCode;
  if (input.minimumStock !== undefined) product.minimumStock = input.minimumStock;
  const hasVariants = (input.variants?.length ?? 0) > 0;
  if (!hasVariants) {
    if (input.costPrice !== undefined) product.productCostPrice = input.costPrice;
    if (input.sellingPrice !== undefined) product.productSellingPrice = input.sellingPrice;
  }

  const variants: Record<string, unknown>[] = [];
  const stocks: Record<string, unknown>[] = [];
  if (hasVariants) {
    input.variants!.forEach((v, i) => {
      const code = `V${i + 1}`;
      const row: Record<string, unknown> = { variantCode: code, variantName: v.name.trim() };
      if (v.sku?.trim()) row.variantSku = v.sku.trim();
      if (v.barcode?.trim()) row.variantBarcode = v.barcode.trim();
      if (v.costPrice !== undefined) row.variantCostPrice = v.costPrice;
      if (v.sellingPrice !== undefined) row.variantSellingPrice = v.sellingPrice;
      variants.push(row);
      const st: Record<string, unknown> = { variantCode: code, warehouseCode: v.warehouseCode, quantity: v.quantity };
      if (v.location?.trim()) st.location = v.location.trim();
      stocks.push(st);
    });
  } else {
    const st: Record<string, unknown> = { warehouseCode: input.warehouseCode, quantity: input.quantity };
    if (input.location?.trim()) st.location = input.location.trim();
    stocks.push(st);
  }

  const form = new FormData();
  form.append("product", JSON.stringify(product));
  form.append("variants", JSON.stringify(variants));
  form.append("stock", JSON.stringify(stocks));
  if (input.image) form.append("image", input.image);
  if (hasVariants) {
    input.variants!.forEach((v, i) => form.append(`variantImage[V${i + 1}]`, v.image));
  }
  await api.postForm("products", form);
}

export interface ProductDetail {
  id: string;
  code: string;
  name: string;
  sku: string;
  barcode: string;
  unit: string;
  description: string;
  image?: string;
  category: string;
  brand: string;
  supplier: string;
  categoryCode: string;
  brandCode: string;
  supplierCode: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  maximumStock: number | null;
  isActive: boolean;
  quantity: number;
  status: StockStatus;
  hasVariants: boolean;
  warehouseStocks: { code: string; name: string; location: string; quantity: number }[];
  variants: { id: string; code: string; name: string; sku: string; barcode: string; image?: string; attributes: string; costPrice: number | null; sellingPrice: number | null; quantity: number }[];
}

interface ApiDetail extends ApiProduct {
  maximumStock?: number | null;
  isActive?: boolean;
  stocks?: (ApiStock & { id?: string; location?: string | null; variant?: { name?: string } | null })[];
  variants?: {
    id: string;
    code?: string;
    name?: string;
    sku?: string;
    barcode?: string | null;
    image?: string | null;
    attributes?: Record<string, string> | null;
    costPrice?: number | null;
    sellingPrice?: number | null;
    stocks?: ApiStock[];
  }[];
}

function warehouseStocksOf(stocks: NonNullable<ApiDetail["stocks"]>): ProductDetail["warehouseStocks"] {
  const map = new Map<string, ProductDetail["warehouseStocks"][number]>();
  for (const s of stocks) {
    const key = s.warehouse?.code || s.warehouse?.name || "—";
    const row = map.get(key) ?? { code: s.warehouse?.code ?? "", name: s.warehouse?.name ?? "—", location: s.location ?? "", quantity: 0 };
    row.quantity += Number(s.quantity || 0);
    if (!row.location && s.location) row.location = s.location;
    map.set(key, row);
  }
  return [...map.values()].filter((r) => r.quantity !== 0 || r.location);
}

/** `GET /products/:id` shaped for the detail screen. */
export async function fetchProduct(id: string): Promise<ProductDetail> {
  const p = await api.get<ApiDetail>(`products/${id}`);
  const stocks = p.stocks ?? [];
  const quantity = stocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  const minimum = Number(p.minimumStock || 0);
  const image = typeof p.image === "string" ? p.image : p.image?.url;
  return {
    id: p.id,
    code: p.code ?? "",
    name: p.name,
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    unit: p.unit ?? "",
    description: p.description ?? "",
    image: image || undefined,
    category: p.category?.name ?? "—",
    brand: p.brand?.name ?? "—",
    supplier: p.supplier?.name ?? "—",
    categoryCode: p.category?.code ?? "",
    brandCode: p.brand?.code ?? "",
    supplierCode: p.supplier?.code ?? "",
    costPrice: Number(p.costPrice || 0),
    sellingPrice: Number(p.sellingPrice || 0),
    minimumStock: minimum,
    maximumStock: p.maximumStock != null ? Number(p.maximumStock) : null,
    isActive: p.isActive !== false,
    quantity,
    status: statusFor(quantity, minimum),
    hasVariants: (p.variants?.length ?? 0) > 0,
    warehouseStocks: warehouseStocksOf(stocks),
    variants: (p.variants ?? []).map((v) => ({
      id: v.id,
      code: v.code ?? "",
      name: v.name ?? "",
      sku: v.sku ?? "",
      barcode: v.barcode ?? "",
      image: v.image || undefined,
      attributes: v.attributes ? Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(", ") : "",
      costPrice: v.costPrice != null ? Number(v.costPrice) : null,
      sellingPrice: v.sellingPrice != null ? Number(v.sellingPrice) : null,
      quantity: (v.stocks ?? []).reduce((sum, s) => sum + Number(s.quantity || 0), 0),
    })),
  };
}

export interface EditProductInput {
  name: string;
  sku: string;
  barcode: string;
  unit: string;
  description: string;
  categoryCode: string;
  brandCode: string;
  supplierCode: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  maximumStock: number | null;
  variants?: { code: string; name: string; sku: string; barcode: string; costPrice: number | null; sellingPrice: number | null }[];
}

/** `PATCH /products/:id` (needs PRODUCT_EDIT). */
export async function updateProduct(id: string, input: EditProductInput): Promise<void> {
  await api.patch(`products/${id}`, input);
}

/** `POST /products/:id/image` (needs PRODUCT_IMAGE). */
/** `POST /product-variants/:id/image` (needs PRODUCT_IMAGE). */
export async function updateVariantImage(variantId: string, file: File): Promise<void> {
  const form = new FormData();
  form.append("image", file);
  await api.postForm(`product-variants/${variantId}/image`, form);
}

export async function updateProductImage(id: string, file: File): Promise<void> {
  const form = new FormData();
  form.append("image", file);
  await api.postForm(`products/${id}/image`, form);
}

// ---------------------------------------------------------------- Excel import

export interface ImportPreview {
  ok: boolean;
  message?: string;
  errors?: string[];
  count?: number;
  rows?: { code: string; name: string; sku: string; unit: string; category: string; costPrice: number | null; sellingPrice: number | null; variantCount: number; warehouses: string; quantity: number }[];
}

/** `GET /products/import/template` — the Excel template to fill in. */
export const downloadProductTemplate = () => api.download("products/import/template", "products_direct_import_template.xlsx");

/** `POST /products/import/preview` — checks the file and rolls back (PRODUCT_IMPORT). */
export async function previewProductImport(file: File): Promise<ImportPreview> {
  const form = new FormData();
  form.append("file", file);
  return api.postForm<ImportPreview>("products/import/preview", form);
}

/** `POST /products/import` — creates every product in the file (PRODUCT_IMPORT). */
export async function importProducts(file: File): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  await api.postForm("products/import", form);
}
