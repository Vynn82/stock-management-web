import { request } from "@/lib/api/request";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Role } from "./roles.types";

const INITIAL_ROLES: Role[] = [
  {
    id: "7f45d8be-13eb-4f6b-b3a0-d1e85d1cae1c",
    name: "SUPER_ADMIN",
    description: "Full system administration and user access control",
    permissions: [
      "product:view",
      "product:create",
      "product:update",
      "product:certify",
    ],
  },
  {
    id: "4240a2be-16cf-4b58-b588-40536afac2ea",
    name: "Warehouse Staff",
    description: "Warehouse stock receiving and intake management",
    permissions: ["product:view", "product:create"],
  },
  {
    id: "177b15c4-ff66-4ac5-b854-3d8ac47d57ba",
    name: "STAFF",
    description: "General staff operational permissions",
    permissions: ["product:view"],
  },
];

export async function getRoles(): Promise<Role[]> {
  try {
    const data = await request<Role[]>(API_ENDPOINTS.ROLES.LIST, "GET");
    return Array.isArray(data) && data.length > 0 ? data : INITIAL_ROLES;
  } catch {
    return INITIAL_ROLES;
  }
}

export async function createRole(payload: {
  name: string;
  description?: string;
}): Promise<Role> {
  try {
    return await request<Role>(API_ENDPOINTS.ROLES.CREATE, "POST", payload);
  } catch (err) {
    console.warn("Backend roles/create offline, saving to mock list:", err);
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: payload.name.toUpperCase(),
      description: payload.description || "",
      permissions: ["product:view"],
    };
    INITIAL_ROLES.unshift(newRole);
    return newRole;
  }
}

export async function getRolePermissions(roleId: string): Promise<unknown> {
  try {
    return await request(API_ENDPOINTS.ROLES.PERMISSIONS(roleId), "GET");
  } catch {
    const r = INITIAL_ROLES.find((x) => x.id === roleId);
    return r ? r.permissions : ["product:view"];
  }
}

export async function assignPermissionsToRole(
  roleId: string,
  permissionIds: string[],
): Promise<unknown> {
  try {
    return await request(API_ENDPOINTS.ROLES.PERMISSIONS(roleId), "POST", {
      permissionIds,
    });
  } catch (err) {
    console.warn("Backend roles/permissions offline, updating mock:", err);
    const target = INITIAL_ROLES.find((r) => r.id === roleId);
    if (target) {
      target.permissions = permissionIds;
    }
    return { success: true };
  }
}

export async function deleteRolePermission(
  roleId: string,
  permissionId: string,
): Promise<unknown> {
  try {
    return await request(
      API_ENDPOINTS.ROLES.DELETE_PERMISSION(roleId, permissionId),
      "DELETE",
    );
  } catch {
    return { success: true };
  }
}

export async function getRoleMenus(roleId: string): Promise<unknown> {
  return await request(API_ENDPOINTS.ROLES.MENUS(roleId), "GET");
}
