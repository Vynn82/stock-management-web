import { request } from "@/lib/api/request";

export interface WarehouseOption {
  code: string;
  name: string;
}

/** One countable line: a product, or one variant of a product, in one warehouse. */
export interface CountLine {
  key: string;
  productCode: string;
  variantCode: string | null;
  name: string;
  sku: string;
  systemQty: number;
}

const num = (v: unknown): number => Math.round(Number.parseFloat(String(v ?? "0")) || 0);

async function fetchAllPages(path: string): Promise<any[]> {
  const rows: any[] = [];
  for (let page = 1; page <= 20; page++) {
    const res: any = await request(`${path}?page=${page}&limit=100`);
    const data: any[] = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
    rows.push(...data);
    if (Array.isArray(res) || !res?.meta?.hasNextPage) break;
  }
  return rows;
}

export async function fetchWarehouseOptions(): Promise<WarehouseOption[]> {
  const rows = await fetchAllPages("warehouses");
  return rows.map((w) => ({ code: String(w.code), name: String(w.name ?? w.code) }));
}

/** Everything stocked in [warehouseCode]: what the system says is on the shelf. */
export async function fetchCountLines(warehouseCode: string): Promise<CountLine[]> {
  const products = await fetchAllPages("products");
  const qtyHere = (stocks: any[] | undefined): number | null => {
    const hit = (stocks ?? []).find((s) => s?.warehouse?.code === warehouseCode);
    return hit ? num(hit.quantity) : null;
  };

  const lines: CountLine[] = [];
  for (const p of products) {
    const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
    if (variants.length > 0) {
      for (const v of variants) {
        const q = qtyHere(v.stocks);
        if (q === null) continue;
        lines.push({
          key: `${p.code}|${v.code}`,
          productCode: String(p.code),
          variantCode: String(v.code),
          name: `${p.name} · ${v.name}`,
          sku: String(v.sku ?? v.code ?? ""),
          systemQty: q,
        });
      }
    } else {
      const q = qtyHere(p.stocks);
      if (q === null) continue;
      lines.push({ key: `${p.code}|`, productCode: String(p.code), variantCode: null, name: String(p.name), sku: String(p.sku ?? p.code ?? ""), systemQty: q });
    }
  }
  return lines.sort((a, b) => a.name.localeCompare(b.name));
}

/** Applies one counted difference. Needs the STOCK_ADJUST permission. */
export async function applyDifference(line: CountLine, warehouseCode: string, difference: number, reason: string): Promise<void> {
  await request("stock-adjustments", "POST", {
    productCode: line.productCode,
    ...(line.variantCode ? { variantCode: line.variantCode } : {}),
    warehouseCode,
    adjustmentType: difference > 0 ? "INCREASE" : "DECREASE",
    quantity: Math.abs(difference),
    reason,
  });
}
