import { api, listAll } from "@/features/live/http";
import { fetchWarehouses } from "@/features/live/lookups";

/** Requests from the real API, shaped for the Requests pages. */

export type LiveRequestStatus = "Pending" | "Approved" | "Rejected";

export interface LiveApprover {
  id: string;
  userId: string;
  name: string;
  actionType: string;
  status: string;
  step: number;
  actionDate?: string | null;
  remark?: string | null;
  canAct: boolean;
}

export interface LiveRequestItem {
  productCode: string;
  productName: string;
  quantity: number;
  warehouse: string;
  fromWarehouse: string;
  toWarehouse: string;
  adjustmentType: string;
  reason: string;
}

export interface LiveRequest {
  id: string;
  requestNo: string;
  requester: string;
  requestType: string;
  typeLabel: string;
  route: string;
  from: string;
  to: string;
  hasRoute: boolean;
  quantity: number;
  status: LiveRequestStatus;
  createdAt: string;
  requested: string;
  remark: string;
  productSummary: string;
  items: LiveRequestItem[];
  approvers: LiveApprover[];
  canAct: boolean;
}

interface ApiApprover {
  id: string;
  userId: string;
  name?: string | null;
  staffId?: string | null;
  step: number;
  actionType: string;
  status: string;
  actionDate?: string | null;
  remark?: string | null;
  canAct?: boolean;
}

interface ApiStockItem {
  productCode?: string | null;
  productName?: string | null;
  warehouseCode?: string | null;
  quantity?: number | string | null;
  fromWarehouseCode?: string | null;
  toWarehouseCode?: string | null;
  adjustmentType?: string | null;
  adjustmentReason?: string | null;
}

interface ApiRequest {
  id: string;
  requestNo: string;
  requesterName?: string | null;
  requestType: string;
  status: string;
  remark?: string | null;
  product?: { productCode?: string; productName?: string } | null;
  stock?: ApiStockItem[];
  approvers?: ApiApprover[];
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  PRODUCT_CREATE: "New Product",
  PRODUCT_UPDATE: "Product Update",
  VARIANT_CREATE: "New Variant",
  VARIANT_UPDATE: "Variant Update",
  STOCK_IN: "Stock In",
  STOCK_OUT: "Stock Out",
  STOCK_TRANSFER: "Transfer",
  STOCK_ADJUSTMENT: "Adjustment",
};

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replaceAll("_", " ").toLowerCase();
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "";
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusOf(raw: string): LiveRequestStatus {
  if (raw === "APPROVED") return "Approved";
  if (raw === "REJECTED") return "Rejected";
  return "Pending";
}

export function toLiveRequest(r: ApiRequest, whName: (code?: string | null) => string): LiveRequest {
  const items: LiveRequestItem[] = (r.stock ?? []).map((s) => ({
    productCode: s.productCode ?? "",
    productName: s.productName ?? s.productCode ?? "",
    quantity: Number(s.quantity ?? 0),
    warehouse: whName(s.warehouseCode),
    fromWarehouse: whName(s.fromWarehouseCode),
    toWarehouse: whName(s.toWarehouseCode),
    adjustmentType: s.adjustmentType ?? "",
    reason: s.adjustmentReason ?? "",
  }));

  const first = items[0];
  const isTransfer = r.requestType === "STOCK_TRANSFER";
  const whList = Array.from(new Set(items.map((i) => i.warehouse).filter((w) => w && w !== "—")));
  let from = "—";
  let to = "—";
  let hasRoute = true;
  switch (r.requestType) {
    case "STOCK_TRANSFER":
      from = first?.fromWarehouse ?? "—";
      to = first?.toWarehouse ?? "—";
      break;
    case "STOCK_OUT":
      from = first?.warehouse ?? "—";
      to = "Outbound";
      break;
    case "STOCK_IN":
      from = "Intake";
      to = first?.warehouse ?? "—";
      break;
    case "STOCK_ADJUSTMENT":
      from = first?.warehouse ?? "—";
      to = first?.adjustmentType === "DECREASE" ? "Decrease" : "Increase";
      break;
    default:
      hasRoute = false;
  }

  const route = isTransfer
    ? `${from} → ${to}`
    : whList.length > 0
      ? whList.join(", ")
      : r.product?.productName ?? "—";

  const names = items.length > 0 ? Array.from(new Set(items.map((i) => i.productName))) : r.product?.productName ? [r.product.productName] : [];
  const productSummary = names.length === 0 ? "—" : names.length === 1 ? names[0] : `${names[0]} +${names.length - 1} more`;

  const approvers: LiveApprover[] = (r.approvers ?? [])
    .map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.name || a.staffId || "Unknown",
      actionType: a.actionType,
      status: a.status,
      step: a.step,
      actionDate: a.actionDate,
      remark: a.remark,
      canAct: Boolean(a.canAct),
    }))
    .sort((a, b) => a.step - b.step);

  return {
    id: r.id,
    requestNo: r.requestNo,
    requester: r.requesterName || "Unknown",
    requestType: r.requestType,
    typeLabel: typeLabel(r.requestType),
    route,
    from,
    to,
    hasRoute,
    quantity: items.reduce((sum, i) => sum + i.quantity, 0),
    status: statusOf(r.status),
    createdAt: r.createdAt,
    requested: timeAgo(r.createdAt),
    remark: r.remark ?? "",
    productSummary,
    items,
    approvers,
    canAct: approvers.some((a) => a.canAct),
  };
}

async function warehouseNames(): Promise<(code?: string | null) => string> {
  let map = new Map<string, string>();
  try {
    map = new Map((await fetchWarehouses()).map((w) => [w.code, w.name]));
  } catch {
    // Names are a nicety; fall back to the codes.
  }
  return (code) => (code ? (map.get(code) ?? code) : "—");
}

export async function fetchRequests(): Promise<LiveRequest[]> {
  const [rows, name] = await Promise.all([listAll<ApiRequest>("requests"), warehouseNames()]);
  return rows.map((r) => toLiveRequest(r, name));
}

export async function fetchRequest(id: string): Promise<LiveRequest> {
  const [row, name] = await Promise.all([api.get<ApiRequest>(`requests/${id}`), warehouseNames()]);
  return toLiveRequest(row, name);
}

export async function commitRequest(id: string, action: "APPROVE" | "REJECT", remark?: string): Promise<void> {
  await api.post(`requests/${id}/commit`, { action, ...(remark?.trim() ? { remark: remark.trim() } : {}) });
}

export interface NewStockRequestInput {
  type: "STOCK_OUT" | "STOCK_TRANSFER" | "STOCK_IN" | "STOCK_ADJUSTMENT";
  /** Only for STOCK_ADJUSTMENT. */
  adjustmentType?: "INCREASE" | "DECREASE";
  productCode: string;
  /** Stock In of a product that has variants. */
  variantCode?: string;
  quantity: number;
  fromWarehouseCode: string;
  toWarehouseCode?: string;
  remark?: string;
  /** Optional approval chain, in order. Empty = the server picks one. */
  approvers?: { userId: string; actionType: "CERTIFIER" | "APPROVER" }[];
}

export interface ApproverCandidate {
  id: string;
  staffId: string;
  name: string;
  roles: string[];
  canApprove: boolean;
}

/** `GET /requests/approver-candidates` — people the requester may add to the chain. */
export const fetchApproverCandidates = () => api.get<ApproverCandidate[]>("requests/approver-candidates");

/** Creates a stock in / out / transfer / adjustment request; the server picks the approvers. */
export async function createStockRequest(input: NewStockRequestInput): Promise<LiveRequest> {
  const form = new FormData();
  form.append("requestType", input.type);
  if (input.type === "STOCK_ADJUSTMENT") {
    form.append(
      "adjustments",
      JSON.stringify([
        {
          productCode: input.productCode,
          warehouseCode: input.fromWarehouseCode,
          adjustmentType: input.adjustmentType ?? "DECREASE",
          quantity: input.quantity,
          reason: input.remark?.trim() || "Stock adjustment",
        },
      ]),
    );
  } else {
    const row =
      input.type === "STOCK_TRANSFER"
        ? {
            productCode: input.productCode,
            fromWarehouseCode: input.fromWarehouseCode,
            toWarehouseCode: input.toWarehouseCode,
            quantity: input.quantity,
            reason: input.remark || undefined,
          }
        : {
            productCode: input.productCode,
            ...(input.variantCode ? { variantCode: input.variantCode } : {}),
            warehouseCode: input.fromWarehouseCode,
            quantity: input.quantity,
            reason: input.remark || undefined,
          };
    form.append("stock", JSON.stringify([row]));
  }
  if (input.remark?.trim()) form.append("remark", input.remark.trim());
  if (input.approvers && input.approvers.length > 0) form.append("approvers", JSON.stringify(input.approvers));
  const created = await api.postForm<ApiRequest>("requests", form);
  const name = await warehouseNames();
  return toLiveRequest(created, name);
}
