export interface Warehouse extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWarehouseInput {
  code: string;
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  phone?: string;
}

export type UpdateWarehouseInput = Partial<CreateWarehouseInput>;
