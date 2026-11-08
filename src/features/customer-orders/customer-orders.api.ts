import { apiClient, request } from "@/lib/api/client";
import {
  CoCustomer,
  CoItem,
  CoMessage,
  CoStatus,
  CustomerOrderDetail,
  CustomerOrderSummary,
  CustomerRow,
  CustomerStatusValue,
  RecordPaymentInput,
} from "./customer-orders.types";

/* ------------------------------------------------------------------ parsing */

const num = (v: unknown): number =>
  typeof v === "number" ? v : Number.parseFloat(String(v ?? "")) || 0;

const str = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  return s ? s : null;
};

function parseCustomer(json: any): CoCustomer {
  if (!json || typeof json !== "object") {
    return { name: null, company: null, phone: null, telegram: null, title: "—" };
  }
  const full = [str(json.firstName), str(json.lastName)].filter(Boolean).join(" ");
  const username = str(json.telegramUsername);
  const name = str(json.contactName) ?? (full || null);
  const company = str(json.companyName);
  const telegram = username ? `@${username}` : null;
  return {
    name,
    company,
    phone: str(json.phone),
    telegram,
    title: name ?? company ?? telegram ?? "—",
  };
}

function parseSummary(json: any): CustomerOrderSummary {
  return {
    id: String(json.id),
    orderNo: str(json.orderNo) ?? "",
    status: (str(json.status) ?? "PENDING_REVIEW") as CoStatus,
    customer: parseCustomer(json.customer),
    itemCount: Array.isArray(json.items) ? json.items.length : 0,
    totalAmount: num(json.totalAmount),
    isPaid: json.paymentStatus === "PAID",
    fromMiniApp: json.source !== "STAFF",
    createdAt: str(json.createdAt),
  };
}

function staffName(user: any): string | null {
  if (!user || typeof user !== "object") return null;
  const p = user.profile;
  if (p && typeof p === "object") {
    const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
    if (name) return name;
  }
  return str(user.email);
}

function proofUrl(payments: unknown): string | null {
  if (!Array.isArray(payments)) return null;
  let found: string | null = null;
  for (const p of payments) {
    const url = str((p as any)?.proofImageUrl);
    if (url) found = url;
  }
  return found;
}

function parseItem(json: any): CoItem {
  return {
    id: String(json.id),
    name: str(json.product?.name) ?? "—",
    variantName: str(json.variant?.name),
    requested: num(json.requestedQuantity),
    approved: num(json.approvedQuantity),
    waiting: num(json.waitingQuantity),
    unitPrice: num(json.unitPrice),
    subtotal: num(json.subtotal),
    warehouseName: str(json.warehouse?.name),
  };
}

function parseMessage(json: any, index: number): CoMessage {
  return {
    id: String(json.id ?? index),
    sender: str(json.senderType) ?? "SYSTEM",
    senderName: str(json.senderName),
    message: str(json.message) ?? "",
    createdAt: str(json.createdAt),
  };
}

function parseDetail(json: any): CustomerOrderDetail {
  const place = [json.commune, json.district, json.province].map(str).filter(Boolean) as string[];
  const street = str(json.deliveryAddress);
  const address = [street, ...place].filter(Boolean).join(", ");
  const total = num(json.totalAmount);
  return {
    id: String(json.id),
    orderNo: str(json.orderNo) ?? "",
    status: (str(json.status) ?? "PENDING_REVIEW") as CoStatus,
    customer: parseCustomer(json.customer),
    items: (Array.isArray(json.items) ? json.items : []).map(parseItem),
    messages: (Array.isArray(json.messages) ? json.messages : []).map(parseMessage),
    totalAmount: total,
    subtotalAmount: json.subtotalAmount == null ? total : num(json.subtotalAmount),
    discountAmount: num(json.loyaltyDiscountAmount),
    discountPercent: num(json.loyaltyDiscountPercent),
    tierName: str(json.loyaltyTierName),
    isPaid: json.paymentStatus === "PAID",
    paidAt: str(json.paidAt),
    paidByName: staffName(json.paidReceivedBy),
    proofImageUrl: proofUrl(json.payments),
    deliveryDone: json.deliveryStatus === "DELIVERED",
    fromMiniApp: json.source !== "STAFF",
    address: address || null,
    remark: str(json.remark),
    staffNotes: str(json.staffNotes),
    createdAt: str(json.createdAt),
  };
}

/* ---------------------------------------------------------------------- API */

const BASE = "customer-orders";

/** All orders for staff, newest first. Walks the pages (100 per page, up to 10). */
export async function fetchCustomerOrders(status?: CoStatus, customerId?: string): Promise<CustomerOrderSummary[]> {
  const all: CustomerOrderSummary[] = [];
  for (let page = 1; page <= 10; page++) {
    const qs = new URLSearchParams({ page: String(page), limit: "100" });
    if (status) qs.set("status", status);
    if (customerId) qs.set("customerId", customerId);
    const res: any = await request(`${BASE}?${qs.toString()}`);
    const rows: any[] = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
    all.push(...rows.map(parseSummary));
    const more = !Array.isArray(res) && res?.meta?.hasNextPage;
    if (!more) break;
  }
  return all;
}

function parseCustomerRow(json: any): CustomerRow {
  const base = parseCustomer(json);
  const place = [json.commune, json.district, json.province].map(str).filter(Boolean) as string[];
  const address = [str(json.address), ...place].filter(Boolean).join(", ");
  const accounts: string[] = Array.isArray(json.telegramAccounts)
    ? json.telegramAccounts
        .map((a: any) => (str(a?.telegramUsername) ? `@${str(a.telegramUsername)}` : str(a?.firstName)))
        .filter(Boolean)
    : [];
  const tier = json.manualTierOverride ?? json.loyaltyTier ?? null;
  return {
    id: String(json.id),
    title: base.title,
    name: base.name,
    company: base.company,
    phone: base.phone,
    address: address || null,
    telegram: base.telegram ?? accounts[0] ?? null,
    telegramAccounts: accounts,
    status: (str(json.status) ?? "ACTIVE") as CustomerStatusValue,
    rejectionReason: str(json.rejectionReason),
    tierName: str(tier?.name),
    tierColor: str(tier?.color),
    discountPercent: num(tier?.discountPercent),
    orderCount: num(json.orderCount),
    completedOrders: num(json.completedOrdersCount),
    totalSpent: num(json.lifetimeSpending),
    totalQuantity: num(json.totalQuantityPurchased),
    lastOrderAt: str(json.lastOrderAt),
    joinedAt: str(json.createdAt),
  };
}

/** Every registered customer (newest first). Walks the pages (100 per page, up to 20). */
export async function fetchCustomers(): Promise<CustomerRow[]> {
  const all: CustomerRow[] = [];
  for (let page = 1; page <= 20; page++) {
    const qs = new URLSearchParams({ page: String(page), limit: "100" });
    const res: any = await request(`${BASE}/customers?${qs.toString()}`);
    const rows: any[] = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
    all.push(...rows.map(parseCustomerRow));
    const pages = Number(res?.meta?.totalPages ?? 1);
    if (Array.isArray(res) || page >= pages) break;
  }
  return all;
}

export async function fetchCustomer(id: string): Promise<CustomerRow> {
  const res = await request(`${BASE}/customers/${id}`);
  return parseCustomerRow(res);
}

export async function fetchCustomerOrder(id: string): Promise<CustomerOrderDetail> {
  const res = await request(`${BASE}/${id}`);
  return parseDetail(res);
}

export type CoAction = "accept" | "process" | "out-for-delivery" | "delivered" | "complete";

export async function runOrderAction(id: string, action: CoAction): Promise<void> {
  await request(`${BASE}/${id}/${action}`, "POST", {});
}

export async function rejectOrder(id: string, reason: string): Promise<void> {
  await request(`${BASE}/${id}/reject`, "POST", { reason });
}

/**
 * Records a cash payment. Without a photo it is plain JSON; with one it is a
 * multipart upload (field `proof`, max 5 MB: JPG, PNG or WEBP).
 */
export async function recordPayment(id: string, input: RecordPaymentInput): Promise<void> {
  const url = `${BASE}/${id}/payment`;
  if (!input.proof) {
    await request(url, "POST", { amount: input.amount, remark: input.remark || undefined });
    return;
  }
  const form = new FormData();
  form.append("amount", String(input.amount));
  if (input.remark) form.append("remark", input.remark);
  form.append("proof", input.proof);
  // Uploads can take longer than the 4 s default of `request`.
  await apiClient.post(url, form, { timeout: 60000 });
}

/** Readable message from any error thrown by the helpers above. */
export function errorText(e: unknown): string {
  const anyErr = e as any;
  const msg = anyErr?.response?.data?.message ?? anyErr?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  return typeof msg === "string" && msg ? msg : "Something went wrong. Please try again.";
}
