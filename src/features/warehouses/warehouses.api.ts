import { request } from "@/lib/api/request";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  Warehouse,
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from "./warehouses.types";

const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: "wh-1",
    code: "WH001",
    name: "Main Phnom Penh Central Warehouse",
    description: "Main automated distribution and fulfillment center",
    address: "National Road 4, Phnom Penh, Cambodia",
    latitude: 11.5564,
    longitude: 104.9282,
    contactPerson: "John Sok",
    phone: "+855 12 345 678",
  },
  {
    id: "wh-2",
    code: "WH002",
    name: "Siem Reap Regional Hub",
    description: "Northern territory logistics and intake warehouse",
    address: "National Road 6, Siem Reap, Cambodia",
    latitude: 13.3633,
    longitude: 103.8564,
    contactPerson: "Dara Vichea",
    phone: "+855 98 765 432",
  },
  {
    id: "wh-3",
    code: "WH003",
    name: "Battambang Storage Depot",
    description: "Western Cambodia regional stocking depot",
    address: "Sangkat Svay Pao, Battambang, Cambodia",
    latitude: 13.0957,
    longitude: 103.2022,
    contactPerson: "Rithy Chan",
    phone: "+855 88 112 233",
  },
];

export async function getWarehouses(): Promise<Warehouse[]> {
  try {
    const data = await request<Warehouse[]>(
      API_ENDPOINTS.WAREHOUSES.LIST,
      "GET",
    );
    return Array.isArray(data) && data.length > 0 ? data : INITIAL_WAREHOUSES;
  } catch {
    return INITIAL_WAREHOUSES;
  }
}

export async function createWarehouse(
  payload: CreateWarehouseInput,
): Promise<Warehouse> {
  try {
    return await request<Warehouse>(
      API_ENDPOINTS.WAREHOUSES.CREATE,
      "POST",
      payload,
    );
  } catch (err) {
    console.warn(
      "Backend warehouses/create offline, saving to mock list:",
      err,
    );
    const newWh: Warehouse = {
      id: `wh-${Date.now()}`,
      code: payload.code.toUpperCase(),
      name: payload.name,
      description: payload.description,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
      contactPerson: payload.contactPerson,
      phone: payload.phone,
    };
    INITIAL_WAREHOUSES.unshift(newWh);
    return newWh;
  }
}

export async function updateWarehouse(
  id: string,
  payload: UpdateWarehouseInput,
): Promise<Warehouse> {
  try {
    return await request<Warehouse>(
      API_ENDPOINTS.WAREHOUSES.UPDATE(id),
      "PATCH",
      payload,
    );
  } catch (err) {
    console.warn("Backend warehouses/update offline, updating mock list:", err);
    const target = INITIAL_WAREHOUSES.find((w) => w.id === id);
    if (target) {
      if (payload.name) target.name = payload.name;
      if (payload.description) target.description = payload.description;
      if (payload.address) target.address = payload.address;
      if (payload.phone) target.phone = payload.phone;
      if (payload.contactPerson) target.contactPerson = payload.contactPerson;
      return target;
    }
    return {
      id,
      code: "UPDATED",
      name: payload.name || "Updated Warehouse",
      description: payload.description,
    };
  }
}
