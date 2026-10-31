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

export const warehouseValuations: WarehouseValuation[] = [
  { id: "wh-1", warehouse: "Phnom Penh Central Hub", units: 21500, value: 142300, percentage: 50.0 },
  { id: "wh-2", warehouse: "Siem Reap Regional", units: 12300, value: 68200, percentage: 24.0 },
  { id: "wh-3", warehouse: "Battambang Depot", units: 6800, value: 45800, percentage: 16.1 },
  { id: "wh-4", warehouse: "Sihanoukville Logistics", units: 2250, value: 28200, percentage: 9.9 },
];

export const categoryValuations: CategoryValuation[] = [
  { category: "Raw Materials", itemCount: 142, value: 118400, percentage: 41.6 },
  { category: "Finished Goods", itemCount: 98, value: 94600, percentage: 33.3 },
  { category: "Packaging Materials", itemCount: 64, value: 42500, percentage: 14.9 },
  { category: "Spare Parts & Tools", itemCount: 38, value: 29000, percentage: 10.2 },
];

export const movementSummaries: MovementSummary[] = [
  { type: "Stock In", count: 512, units: 18400, trend: "+12% vs last mo" },
  { type: "Stock Out", count: 598, units: 15100, trend: "+8% vs last mo" },
  { type: "Transfer", count: 146, units: 6200, trend: "-3% vs last mo" },
  { type: "Adjustment", count: 74, units: 250, trend: "-15% vs last mo" },
];

export const recentTransactions: TransactionRecord[] = [
  { id: "TX-9042", timestamp: "Today, 11:42 AM", type: "Stock In", product: "Aluminum Foil Rolls (Heavy Duty)", sku: "AL-1002", quantity: 500, warehouse: "Phnom Penh Central Hub", user: "Sokha Mean", reference: "PO-2026-081" },
  { id: "TX-9041", timestamp: "Today, 10:15 AM", type: "Stock Out", product: "Corrugated Box 24x18x12", sku: "BX-4001", quantity: 240, warehouse: "Siem Reap Regional", user: "Dara Chan", reference: "DISP-410" },
  { id: "TX-9040", timestamp: "Today, 09:30 AM", type: "Transfer", product: "HDPE Granules Grade A", sku: "RM-9011", quantity: 150, warehouse: "Phnom Penh -> Battambang", user: "Veasna Kim", reference: "TR-892" },
  { id: "TX-9039", timestamp: "Yesterday, 04:50 PM", type: "Adjustment", product: "Thermal Paper Roll 80mm", sku: "TH-3001", quantity: -12, warehouse: "Battambang Depot", user: "Bopha Lin", reference: "ADJ-104" },
  { id: "TX-9038", timestamp: "Yesterday, 03:20 PM", type: "Stock In", product: "Bubble Wrap 500m Roll", sku: "BW-2004", quantity: 300, warehouse: "Phnom Penh Central Hub", user: "Sokha Mean", reference: "PO-2026-079" },
  { id: "TX-9037", timestamp: "Yesterday, 01:10 PM", type: "Stock Out", product: "Industrial Shrink Film 20um", sku: "SF-8802", quantity: 80, warehouse: "Sihanoukville Logistics", user: "Piseth Seng", reference: "DISP-407" },
];

export const lowStockItems: LowStockItem[] = [
  { id: "ls-1", sku: "AL-1002", name: "Aluminum Foil Rolls (Heavy Duty)", category: "Raw Materials", warehouse: "Phnom Penh Central Hub", currentStock: 8, reorderPoint: 50, unit: "rolls", deficit: 42, unitCost: 45.00, status: "Critical" },
  { id: "ls-2", sku: "TH-3001", name: "Thermal Paper Roll 80mm", category: "Packaging Materials", warehouse: "Siem Reap Regional", currentStock: 14, reorderPoint: 80, unit: "boxes", deficit: 66, unitCost: 18.50, status: "Critical" },
  { id: "ls-3", sku: "BW-2004", name: "Bubble Wrap 500m Roll", category: "Packaging Materials", warehouse: "Battambang Depot", currentStock: 5, reorderPoint: 25, unit: "rolls", deficit: 20, unitCost: 32.00, status: "Critical" },
  { id: "ls-4", sku: "BX-4001", name: "Corrugated Box 24x18x12", category: "Packaging Materials", warehouse: "Phnom Penh Central Hub", currentStock: 25, reorderPoint: 100, unit: "bundles", deficit: 75, unitCost: 12.00, status: "Critical" },
  { id: "ls-5", sku: "SF-8802", name: "Industrial Shrink Film 20um", category: "Raw Materials", warehouse: "Sihanoukville Logistics", currentStock: 12, reorderPoint: 40, unit: "rolls", deficit: 28, unitCost: 28.00, status: "Low" },
  { id: "ls-6", sku: "GL-5011", name: "Hot Melt Glue Pellets 25kg", category: "Raw Materials", warehouse: "Phnom Penh Central Hub", currentStock: 6, reorderPoint: 20, unit: "bags", deficit: 14, unitCost: 65.00, status: "Low" },
  { id: "ls-7", sku: "LB-1090", name: "Direct Thermal Barcode Labels", category: "Packaging Materials", warehouse: "Siem Reap Regional", currentStock: 18, reorderPoint: 60, unit: "rolls", deficit: 42, unitCost: 9.80, status: "Low" },
  { id: "ls-8", sku: "PL-0034", name: "Wooden Euro Pallets 1200x800", category: "Finished Goods", warehouse: "Battambang Depot", currentStock: 10, reorderPoint: 30, unit: "pcs", deficit: 20, unitCost: 15.00, status: "Low" },
  { id: "ls-9", sku: "ST-7712", name: "Steel Strapping 19mm x 0.5mm", category: "Packaging Materials", warehouse: "Phnom Penh Central Hub", currentStock: 4, reorderPoint: 15, unit: "coils", deficit: 11, unitCost: 52.00, status: "Critical" },
  { id: "ls-10", sku: "CP-4401", name: "Cardboard Edge Protectors 1m", category: "Packaging Materials", warehouse: "Siem Reap Regional", currentStock: 45, reorderPoint: 120, unit: "pcs", deficit: 75, unitCost: 2.10, status: "Low" },
  { id: "ls-11", sku: "TP-9904", name: "Heavy Duty Packaging Tape 48mm", category: "Packaging Materials", warehouse: "Sihanoukville Logistics", currentStock: 19, reorderPoint: 50, unit: "rolls", deficit: 31, unitCost: 3.50, status: "Low" },
  { id: "ls-12", sku: "SP-1209", name: "Motor Carbon Brushes Set", category: "Spare Parts & Tools", warehouse: "Phnom Penh Central Hub", currentStock: 3, reorderPoint: 12, unit: "sets", deficit: 9, unitCost: 24.00, status: "Critical" },
  { id: "ls-13", sku: "BL-3022", name: "Rotary Blade Replacements 45mm", category: "Spare Parts & Tools", warehouse: "Siem Reap Regional", currentStock: 5, reorderPoint: 16, unit: "packs", deficit: 11, unitCost: 38.00, status: "Low" },
  { id: "ls-14", sku: "CH-8821", name: "Food Grade Sanitizing Solution 5L", category: "Raw Materials", warehouse: "Battambang Depot", currentStock: 7, reorderPoint: 20, unit: "canisters", deficit: 13, unitCost: 42.00, status: "Low" },
  { id: "ls-15", sku: "NT-6014", name: "Nitrile Inspection Gloves (L)", category: "Spare Parts & Tools", warehouse: "Phnom Penh Central Hub", currentStock: 8, reorderPoint: 25, unit: "boxes", deficit: 17, unitCost: 11.50, status: "Low" },
  { id: "ls-16", sku: "PL-5520", name: "Polyester Strapping Buckles", category: "Packaging Materials", warehouse: "Siem Reap Regional", currentStock: 120, reorderPoint: 400, unit: "pcs", deficit: 280, unitCost: 0.15, status: "Low" },
  { id: "ls-17", sku: "MG-2201", name: "Industrial Conveyor Lubricant 1L", category: "Spare Parts & Tools", warehouse: "Phnom Penh Central Hub", currentStock: 2, reorderPoint: 10, unit: "bottles", deficit: 8, unitCost: 55.00, status: "Critical" },
  { id: "ls-18", sku: "ZG-0099", name: "Self-Seal Poly Bags 30x40cm", category: "Packaging Materials", warehouse: "Sihanoukville Logistics", currentStock: 80, reorderPoint: 250, unit: "packs", deficit: 170, unitCost: 8.20, status: "Low" },
];

export const recentAuditLogs: AuditLogEntry[] = [
  { id: "AUD-4912", timestamp: "Oct 31, 2026, 12:45 PM", user: "Veasna Kim", userRole: "Warehouse Manager", action: "PO Approved", target: "PO-2026-088 ($4,250)", details: "Approved purchase order for Aluminum Foil Rolls from Supreme Packaging Ltd.", status: "Success" },
  { id: "AUD-4911", timestamp: "Oct 31, 2026, 11:20 AM", user: "Sokha Mean", userRole: "Inventory Lead", action: "Stock In Recorded", target: "GRN-2026-042", details: "Received and inspected 500 units of AL-1002 at Phnom Penh Central Hub.", status: "Success" },
  { id: "AUD-4910", timestamp: "Oct 31, 2026, 10:04 AM", user: "Bopha Lin", userRole: "Staff", action: "Reorder Threshold Edit", target: "RM-9011", details: "Updated minimum reorder point from 30 to 45 units based on seasonal forecast.", status: "Success" },
  { id: "AUD-4909", timestamp: "Oct 31, 2026, 09:15 AM", user: "Dara Chan", userRole: "Dispatcher", action: "Dispatch Confirmed", target: "DISP-410", details: "Dispatched 240 bundles of corrugated boxes to Logistics Center.", status: "Success" },
  { id: "AUD-4908", timestamp: "Oct 30, 2026, 05:30 PM", user: "Veasna Kim", userRole: "Warehouse Manager", action: "Stock Adjustment", target: "TH-3001", details: "Wrote off 12 damaged units following end-of-week warehouse cycle audit.", status: "Flagged" },
  { id: "AUD-4907", timestamp: "Oct 30, 2026, 03:10 PM", user: "Piseth Seng", userRole: "Staff", action: "Warehouse Transfer", target: "TR-892", details: "Initiated transfer of 150 HDPE units to Battambang Depot.", status: "Success" },
  { id: "AUD-4906", timestamp: "Oct 30, 2026, 01:25 PM", user: "System Automator", userRole: "System Service", action: "Low Stock Alert Generated", target: "18 Items Alert", details: "Automated scan flagged 18 inventory items below configured safe reorder levels.", status: "Success" },
];

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

export function generateConsolidatedCSV(): string {
  const lines: string[] = [];

  lines.push("==================================================");
  lines.push("STOCKFLOW INVENTORY & OPERATIONS CONSOLIDATED REPORT");
  lines.push(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`);
  lines.push("==================================================");
  lines.push("");

  lines.push("SECTION 1: STOCK VALUATION SUMMARY");
  lines.push("Warehouse,Total Units,Valuation (USD),Share (%)");
  warehouseValuations.forEach((item) => {
    lines.push(`"${item.warehouse}",${item.units},${item.value},${item.percentage}%`);
  });
  lines.push(`"TOTAL ON-HAND",42850,284500,100%`);
  lines.push("");

  lines.push("SECTION 2: MONTHLY MOVEMENTS SUMMARY");
  lines.push("Movement Type,Transactions Count,Total Units,Trend");
  movementSummaries.forEach((m) => {
    lines.push(`"${m.type}",${m.count},${m.units},"${m.trend}"`);
  });
  lines.push(`"TOTAL MOVEMENTS",1330,39950,"Healthy turnover"`);
  lines.push("");

  lines.push("SECTION 3: LOW STOCK ITEMS (REORDER REQUIRED)");
  lines.push("SKU,Product Name,Category,Warehouse,Current Stock,Reorder Point,Deficit,Unit Cost,Status");
  lowStockItems.forEach((item) => {
    lines.push(`"${item.sku}","${item.name}","${item.category}","${item.warehouse}",${item.currentStock},${item.reorderPoint},${item.deficit},${item.unitCost},"${item.status}"`);
  });
  lines.push("");

  lines.push("SECTION 4: RECENT AUDIT LOG EXCERPT");
  lines.push("Log ID,Timestamp,User,Role,Action,Target,Details");
  recentAuditLogs.forEach((log) => {
    lines.push(`"${log.id}","${log.timestamp}","${log.user}","${log.userRole}","${log.action}","${log.target}","${log.details.replace(/"/g, '""')}"`);
  });

  return lines.join("\n");
}
