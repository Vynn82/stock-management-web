export type CoStatus =
  | "PENDING_REVIEW"
  | "WAITING_CUSTOMER"
  | "CONFIRMED"
  | "WAITING_STOCK"
  | "PROCESSING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface CoCustomer {
  name: string | null;
  company: string | null;
  phone: string | null;
  telegram: string | null;
  title: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderNo: string;
  status: CoStatus;
  customer: CoCustomer;
  itemCount: number;
  totalAmount: number;
  isPaid: boolean;
  fromMiniApp: boolean;
  createdAt: string | null;
}

export interface CoItem {
  id: string;
  name: string;
  variantName: string | null;
  requested: number;
  approved: number;
  waiting: number;
  unitPrice: number;
  subtotal: number;
  warehouseName: string | null;
}

export interface CoMessage {
  id: string;
  sender: string;
  senderName: string | null;
  message: string;
  createdAt: string | null;
}

export interface CustomerOrderDetail {
  id: string;
  orderNo: string;
  status: CoStatus;
  customer: CoCustomer;
  items: CoItem[];
  messages: CoMessage[];
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  discountPercent: number;
  tierName: string | null;
  isPaid: boolean;
  paidAt: string | null;
  paidByName: string | null;
  proofImageUrl: string | null;
  deliveryDone: boolean;
  fromMiniApp: boolean;
  address: string | null;
  remark: string | null;
  staffNotes: string | null;
  createdAt: string | null;
}

export interface RecordPaymentInput {
  amount: number;
  remark?: string;
  proof?: File | null;
}
