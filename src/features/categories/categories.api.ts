import { request } from "@/lib/api/request";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./categories.types";

const INITIAL_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    code: "SMARTPHONE",
    name: "Smartphone",
    description: "Mobile phones and flagship smartphones",
    createdAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "cat-2",
    code: "COMPUTER",
    name: "Computer & Laptops",
    description: "Desktop workstations, ultrabooks, and servers",
    createdAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "cat-3",
    code: "HARDWARE",
    name: "Warehouse Hardware",
    description: "Thermal barcode printers, scanners, and scales",
    createdAt: "2026-03-02T08:00:00Z",
  },
  {
    id: "cat-4",
    code: "ACCESSORIES",
    name: "Accessories",
    description: "Cables, chargers, protective cases, and adapters",
    createdAt: "2026-03-02T08:00:00Z",
  },
];

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await request<Category[]>(
      API_ENDPOINTS.CATEGORIES.LIST,
      "GET",
    );
    return Array.isArray(data) && data.length > 0 ? data : INITIAL_CATEGORIES;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export async function createCategory(
  payload: CreateCategoryInput,
): Promise<Category> {
  try {
    return await request<Category>(
      API_ENDPOINTS.CATEGORIES.CREATE,
      "POST",
      payload,
    );
  } catch (err) {
    console.warn(
      "Backend categories/create offline, saving to mock list:",
      err,
    );
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      code: payload.code.toUpperCase(),
      name: payload.name,
      description: payload.description,
      createdAt: new Date().toISOString(),
    };
    INITIAL_CATEGORIES.unshift(newCat);
    return newCat;
  }
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryInput,
): Promise<Category> {
  try {
    return await request<Category>(
      API_ENDPOINTS.CATEGORIES.UPDATE(id),
      "POST",
      payload,
    );
  } catch (err) {
    console.warn("Backend categories/update offline, updating mock list:", err);
    const target = INITIAL_CATEGORIES.find((c) => c.id === id);
    if (target) {
      if (payload.name) target.name = payload.name;
      if (payload.description) target.description = payload.description;
      return target;
    }
    return {
      id,
      code: "UPDATED",
      name: payload.name || "Updated Category",
      description: payload.description,
    };
  }
}
