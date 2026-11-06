export interface WarehouseValuation {
  id: string;
  warehouse: string;
  units: number;
  value: number;
  percentage: number;
}

export interface CategoryValuation {
  category: string;
  itemCount: number;
  value: number;
  percentage: number;
}

export interface MovementSummary {
  type: "Stock In" | "Stock Out" | "Transfer" | "Adjustment";
  count: number;
  units: number;
  trend: string;
}

export interface TransactionRecord {
  id: string;
  timestamp: string;
  type: "Stock In" | "Stock Out" | "Transfer" | "Adjustment";
  product: string;
  sku: string;
  quantity: number;
  warehouse: string;
  user: string;
  reference: string;
}

export interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  currentStock: number;
  reorderPoint: number;
  unit: string;
  deficit: number;
  unitCost: number;
  status: "Critical" | "Low";
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  target: string;
  details: string;
  status: "Success" | "Flagged";
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ConsolidatedInput {
  warehouses: WarehouseValuation[];
  movements: MovementSummary[];
  lowStock: LowStockItem[];
  audit: AuditLogEntry[];
  totalValue: number;
  totalUnits: number;
}

export function generateConsolidatedCSV(d: ConsolidatedInput): string {
  const lines: string[] = [];
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  lines.push("==================================================");
  lines.push("STOCKFLOW INVENTORY & OPERATIONS CONSOLIDATED REPORT");
  lines.push(`Generated: ${today}`);
  lines.push("==================================================");
  lines.push("");

  lines.push("SECTION 1: STOCK VALUATION SUMMARY");
  lines.push("Warehouse,Total Units,Valuation (USD),Share (%)");
  d.warehouses.forEach((item) => {
    lines.push(`"${item.warehouse}",${item.units},${Math.round(item.value)},${item.percentage}%`);
  });
  lines.push(`"TOTAL ON-HAND",${d.totalUnits},${Math.round(d.totalValue)},100%`);
  lines.push("");

  lines.push("SECTION 2: MOVEMENTS (LAST 30 DAYS)");
  lines.push("Movement Type,Transactions Count,Total Units,Trend");
  d.movements.forEach((m) => {
    lines.push(`"${m.type}",${m.count},${m.units},"${m.trend}"`);
  });
  lines.push(`"TOTAL MOVEMENTS",${d.movements.reduce((s, m) => s + m.count, 0)},${d.movements.reduce((s, m) => s + m.units, 0)},""`);
  lines.push("");

  lines.push("SECTION 3: LOW STOCK ITEMS (REORDER REQUIRED)");
  lines.push("SKU,Product Name,Category,Warehouse,Current Stock,Reorder Point,Deficit,Unit Cost,Status");
  d.lowStock.forEach((item) => {
    lines.push(`"${item.sku}","${item.name}","${item.category}","${item.warehouse}",${item.currentStock},${item.reorderPoint},${item.deficit},${item.unitCost},"${item.status}"`);
  });
  lines.push("");

  lines.push("SECTION 4: RECENT ACTIVITY LOG EXCERPT");
  lines.push("Log ID,Timestamp,User,Action,Target,Details");
  d.audit.forEach((log) => {
    lines.push(`"${log.id}","${log.timestamp}","${log.user}","${log.action}","${log.target}","${log.details.replace(/"/g, '""')}"`);
  });

  return lines.join("\n");
}
