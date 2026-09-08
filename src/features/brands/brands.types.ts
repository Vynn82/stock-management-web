export interface Brand extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBrandInput {
  code: string;
  name: string;
  description?: string;
}

export type UpdateBrandInput = Partial<CreateBrandInput>;
