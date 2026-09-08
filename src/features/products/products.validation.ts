import { CreateProductInput } from "./products.types";

export function validateProductInput(
  input: Partial<CreateProductInput>,
): string | null {
  if (!input.sku?.trim()) return "SKU code is required.";
  if (!input.name?.trim()) return "Product name is required.";
  if (!input.category?.trim()) return "Category is required.";
  if (input.price === undefined || input.price < 0)
    return "Valid price is required.";
  if (input.stock === undefined || input.stock < 0)
    return "Valid stock quantity is required.";
  return null;
}
