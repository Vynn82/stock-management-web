export interface Category extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryInput {
  code: string;
  name: string;
  description?: string;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
