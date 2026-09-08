import { request } from "@/lib/api/request";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Brand, CreateBrandInput, UpdateBrandInput } from "./brands.types";

const INITIAL_BRANDS: Brand[] = [
  {
    id: "brand-1",
    code: "APPLE",
    name: "Apple",
    description: "Smartphones, tablets, and computers",
    createdAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "brand-2",
    code: "SAMSUNG",
    name: "Samsung",
    description: "Galaxy smartphones and consumer electronics",
    createdAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "brand-3",
    code: "ZEBRA",
    name: "Zebra Technologies",
    description: "Thermal barcode printers and mobile computers",
    createdAt: "2026-03-02T08:00:00Z",
  },
  {
    id: "brand-4",
    code: "HONEYWELL",
    name: "Honeywell",
    description: "Handheld scanners and warehouse sensors",
    createdAt: "2026-03-02T08:00:00Z",
  },
];

export async function getBrands(): Promise<Brand[]> {
  try {
    const data = await request<Brand[]>(API_ENDPOINTS.BRANDS.LIST, "GET");
    return Array.isArray(data) && data.length > 0 ? data : INITIAL_BRANDS;
  } catch {
    return INITIAL_BRANDS;
  }
}

export async function createBrand(payload: CreateBrandInput): Promise<Brand> {
  try {
    return await request<Brand>(API_ENDPOINTS.BRANDS.CREATE, "POST", payload);
  } catch (err) {
    console.warn("Backend brands/create offline, saving to mock list:", err);
    const newBrand: Brand = {
      id: `brand-${Date.now()}`,
      code: payload.code.toUpperCase(),
      name: payload.name,
      description: payload.description,
      createdAt: new Date().toISOString(),
    };
    INITIAL_BRANDS.unshift(newBrand);
    return newBrand;
  }
}

export async function updateBrand(
  id: string,
  payload: UpdateBrandInput,
): Promise<Brand> {
  try {
    return await request<Brand>(
      API_ENDPOINTS.BRANDS.UPDATE(id),
      "PATCH",
      payload,
    );
  } catch (err) {
    console.warn("Backend brands/update offline, updating mock list:", err);
    const target = INITIAL_BRANDS.find((b) => b.id === id);
    if (target) {
      if (payload.name) target.name = payload.name;
      if (payload.description) target.description = payload.description;
      return target;
    }
    return {
      id,
      code: "UPDATED",
      name: payload.name || "Updated Brand",
      description: payload.description,
    };
  }
}
