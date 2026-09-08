import { User } from "@/types/auth";

/**
 * Check if the user has super admin / administrator privileges
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  const role = (user.role || "").toUpperCase();
  if (role === "ADMIN" || role === "SUPERADMIN" || role === "SUPER_ADMIN") {
    return true;
  }
  if (
    user.roles?.some((r) => {
      const upper = (r || "").toUpperCase();
      return (
        upper === "ADMIN" || upper === "SUPERADMIN" || upper === "SUPER_ADMIN"
      );
    })
  ) {
    return true;
  }
  return false;
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: User | null,
  requiredPermission: string,
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return Boolean(user.permissions?.includes(requiredPermission));
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  user: User | null,
  permissions: string[],
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return permissions.some((perm) => user.permissions?.includes(perm));
}
