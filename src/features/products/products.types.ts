import { BaseEntity, StatusType } from "@/types/common";

export interface Product extends BaseEntity, Record<string, unknown> {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: StatusType;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status?: StatusType;
}

export type UpdateProductInput = Partial<CreateProductInput>;
