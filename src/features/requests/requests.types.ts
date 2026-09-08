export interface ProductInfo {
  productCode: string;
  productName: string;
  categoryCode: string;
  brandCode: string;
  hasVariants: boolean;
  unit: string;
  productSku: string;
}

export interface ProductVariant {
  variantCode: string;
  variantName: string;
  variantSku: string;
  variantAttributes?: Record<string, string>;
  variantCostPrice?: number;
  variantSellingPrice?: number;
}

export interface StockIntakeItem {
  productCode: string;
  variantCode: string;
  warehouseCode: string;
  quantity: number;
}

export interface RequestApprover {
  userId: string;
  actionType: "CERTIFIER" | "APPROVER" | string;
  userName?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | string;
}

export interface CreateProductRequestInput {
  requestType: "PRODUCT_CREATE" | string;
  product: ProductInfo;
  variants: ProductVariant[];
  stock: StockIntakeItem[];
  approvers?: RequestApprover[];
}

export interface InventoryRequest {
  id: string;
  requestType: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMMITTED" | string;
  product?: ProductInfo;
  variants?: ProductVariant[];
  stock?: StockIntakeItem[];
  approvers?: RequestApprover[];
  remark?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface CommitRequestInput {
  action: "APPROVE" | "REJECT" | string;
  remark?: string;
}
