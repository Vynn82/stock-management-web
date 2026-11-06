import { api } from "@/features/live/http";

export interface RoleRow {
  id: string;
  name: string;
}

export interface PermissionItem {
  id: string;
  name: string;
  action: string;
  assigned: boolean;
}

export interface PermissionGroup {
  name: string;
  permissions: PermissionItem[];
}

export async function fetchRoleList(): Promise<RoleRow[]> {
  const res = await api.get<RoleRow[] | { data: RoleRow[] }>("roles");
  return Array.isArray(res) ? res : res.data;
}

/** `GET /roles/:id/permissions/manage` (needs ROLE_VIEW). */
export async function fetchRolePermissions(roleId: string): Promise<PermissionGroup[]> {
  const res = await api.get<{ resources: PermissionGroup[] }>(`roles/${roleId}/permissions/manage`);
  return res.resources;
}

/** `POST /roles/:id/permissions` (needs ROLE_UPDATE). */
export async function grantPermission(roleId: string, permissionId: string): Promise<void> {
  await api.post(`roles/${roleId}/permissions`, { permissionIds: [permissionId] });
}

/** `DELETE /roles/:roleId/permissions/:permissionId` (needs ROLE_UPDATE). */
export async function revokePermission(roleId: string, permissionId: string): Promise<void> {
  await api.del(`roles/${roleId}/permissions/${permissionId}`);
}
