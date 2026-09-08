import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "./products.types";

export async function getProducts(): Promise<Product[]> {
  try {
    const { data } = await apiClient.get<Product[]>(
      API_ENDPOINTS.PRODUCTS.LIST,
    );
    return data;
  } catch {
    // Return empty list if endpoint not yet implemented on backend
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data } = await apiClient.get<Product>(
      API_ENDPOINTS.PRODUCTS.DETAIL(id),
    );
    return data;
  } catch {
    return null;
  }
}

export async function createProduct(
  payload: CreateProductInput,
): Promise<Product> {
  const { data } = await apiClient.post<Product>(
    API_ENDPOINTS.PRODUCTS.CREATE,
    payload,
  );
  return data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductInput,
): Promise<Product> {
  const { data } = await apiClient.put<Product>(
    API_ENDPOINTS.PRODUCTS.UPDATE(id),
    payload,
  );
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
}
