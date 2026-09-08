import { request } from "@/lib/api/request";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Permission } from "./permissions.types";

export interface PermissionInput {
  resource: string;
  action: string;
}

export async function getPermissions(): Promise<Permission[]> {
  try {
    const data = await request<Permission[]>(
      API_ENDPOINTS.PERMISSIONS.LIST,
      "GET",
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [
      {
        id: "2b8bfd11-bb4d-460f-9093-15efd343077e",
        name: "product:view",
        category: "product",
        description: "View inventory items and stock requests",
      },
      {
        id: "e303c4c8-4c7f-4d28-a6ce-a505175d2f9c",
        name: "product:create",
        category: "product",
        description: "Create and draft product intake requests",
      },
      {
        id: "3a9c71b0-51a2-47d3-9f5b-118df2831201",
        name: "product:update",
        category: "product",
        description: "Update product catalogs and variant details",
      },
      {
        id: "4f8d91a2-92c1-4ba2-8ef9-247ce1930219",
        name: "product:certify",
        category: "product",
        description: "Certify and approve warehouse intake requests",
      },
    ];
  }
}

export async function addPermission(
  payload: PermissionInput,
): Promise<Permission> {
  return await request<Permission>(
    API_ENDPOINTS.PERMISSIONS.CREATE,
    "POST",
    payload,
  );
}

export async function addPermissionsBulk(
  payload: PermissionInput[],
): Promise<Permission[]> {
  return await request<Permission[]>(
    API_ENDPOINTS.PERMISSIONS.BULK,
    "POST",
    payload,
  );
}

export async function addPermissionResource(
  resource: string,
): Promise<unknown> {
  return await request(API_ENDPOINTS.PERMISSIONS.RESOURCES, "POST", {
    resource,
  });
}
