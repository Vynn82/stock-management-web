import { api } from "@/features/live/http";

/** The dashboard numbers from the real API (GET /dashboard). */

export interface DashboardKpis {
  inventory: {
    totalProducts: number;
    totalStockQuantity: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalWarehouses: number;
  };
  orders: { totalOrders: number; pendingOrders: number; confirmedOrders: number; deliveredOrders: number };
  revenue: { totalRevenue: number; unpaidRevenue: number };
  requests: { pendingRequests: number; pendingStockIn: number; pendingStockOut: number; pendingTransfer: number };
}

export interface DashboardSummary {
  kpis: DashboardKpis;
}

export function fetchDashboard(): Promise<DashboardSummary> {
  return api.get<DashboardSummary>("dashboard");
}
