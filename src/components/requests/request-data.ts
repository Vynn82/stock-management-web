export type RequestStatus = "Pending" | "Approved" | "Rejected";
export type RequestType = "Transfer" | "Stock Out";

export type StockRequest = {
  id: string;
  requester: string;
  route: string;
  type: RequestType;
  quantity: number;
  status: RequestStatus;
  requested: string;
  notes?: string;
  product?: string;
};

export const initialRequests: StockRequest[] = [
  { id: "REQ-0142", requester: "Sokha", route: "Phnom Penh Main → Siem Reap Branch", type: "Transfer", quantity: 18, status: "Pending", requested: "2h ago" },
  { id: "REQ-0143", requester: "Dara", route: "Siem Reap Branch Warehouse", type: "Stock Out", quantity: 12, status: "Pending", requested: "45m ago" },
  { id: "REQ-0141", requester: "Lina", route: "Battambang → Phnom Penh Main", type: "Transfer", quantity: 25, status: "Approved", requested: "5h ago" },
  { id: "REQ-0140", requester: "Ravy", route: "Kampong Cham Warehouse", type: "Stock Out", quantity: 8, status: "Rejected", requested: "1d ago" },
  { id: "REQ-0139", requester: "Sokha", route: "Phnom Penh Main → Battambang", type: "Transfer", quantity: 40, status: "Approved", requested: "1d ago" },
  { id: "REQ-0138", requester: "Dara", route: "Siem Reap Branch Warehouse", type: "Stock Out", quantity: 15, status: "Approved", requested: "2d ago" },
  { id: "REQ-0137", requester: "Lina", route: "Battambang Warehouse", type: "Stock Out", quantity: 6, status: "Rejected", requested: "3d ago" },
];

const storageKey = "stockflow-added-requests";

export function loadAddedRequests(): StockRequest[] {
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isStockRequest)) {
    throw new Error("Saved requests have an invalid format. Clear the saved request data and try again.");
  }
  return parsed;
}

export function saveNewRequest(request: Omit<StockRequest, "id" | "status" | "requested">): StockRequest {
  const addedRequests = loadAddedRequests();
  const allRequests = [...initialRequests, ...addedRequests];
  const nextNumber = Math.max(...allRequests.map((item) => Number(item.id.slice(4)))) + 1;
  const newRequest: StockRequest = {
    ...request,
    id: `REQ-${String(nextNumber).padStart(4, "0")}`,
    status: "Pending",
    requested: "Just now",
  };
  window.localStorage.setItem(storageKey, JSON.stringify([...addedRequests, newRequest]));
  return newRequest;
}

function isStockRequest(value: unknown): value is StockRequest {
  if (typeof value !== "object" || value === null) return false;
  const request = value as Record<string, unknown>;
  return typeof request.id === "string"
    && typeof request.requester === "string"
    && typeof request.route === "string"
    && (request.type === "Transfer" || request.type === "Stock Out")
    && typeof request.quantity === "number"
    && (request.status === "Pending" || request.status === "Approved" || request.status === "Rejected")
    && typeof request.requested === "string"
    && (request.notes === undefined || typeof request.notes === "string")
    && (request.product === undefined || typeof request.product === "string");
}
