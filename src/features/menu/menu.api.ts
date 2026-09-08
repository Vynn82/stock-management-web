import { request } from "@/lib/api/request";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { MenuItem, CreateMenuItemInput } from "./menu.types";
import { User, UserMenuItem } from "@/types/auth";
import { getRoles } from "@/features/roles/roles.api";
import { isSuperAdmin } from "@/lib/auth/permissions";

const INITIAL_MENUS: MenuItem[] = [
  {
    id: "14560e4d-ca26-4afb-a897-5f6a4322dc8b",
    name: "Dashboard",
    label: "Inventory",
    path: "/dashboard",
    icon: "Package",
    sortOrder: 1,
  },
  {
    id: "menu-stock",
    name: "STOCK",
    label: "Stock & Products",
    path: "/products",
    icon: "Boxes",
    parentId: "14560e4d-ca26-4afb-a897-5f6a4322dc8b",
    sortOrder: 2,
  },
  {
    id: "menu-warehouses",
    name: "WAREHOUSES",
    label: "Warehouses",
    path: "/warehouses",
    icon: "Building2",
    parentId: "14560e4d-ca26-4afb-a897-5f6a4322dc8b",
    sortOrder: 3,
  },
];

export async function getMenus(): Promise<MenuItem[]> {
  try {
    const data = await request<MenuItem[]>(API_ENDPOINTS.MENU.LIST, "GET");
    return Array.isArray(data) && data.length > 0 ? data : INITIAL_MENUS;
  } catch {
    return INITIAL_MENUS;
  }
}

export async function createMenu(
  payload: CreateMenuItemInput,
): Promise<MenuItem> {
  return await request<MenuItem>(API_ENDPOINTS.MENU.CREATE, "POST", payload);
}

/**
 * Fetch menus assigned to a specific role from /roles/:roleId/menus
 */
export async function getRoleMenus(
  roleId: string,
  customHeaders?: Record<string, string>,
): Promise<UserMenuItem[]> {
  try {
    const res = await request<any>(
      API_ENDPOINTS.ROLES.MENUS(roleId),
      "GET",
      undefined,
      customHeaders,
    );

    if (Array.isArray(res)) return res;
    if (res && typeof res === "object") {
      if ("menus" in res && Array.isArray(res.menus)) return res.menus;
      if ("data" in res && Array.isArray(res.data)) return res.data;
    }
    return [];
  } catch (err) {
    console.warn(`Failed to fetch menus for role ${roleId}:`, err);
    return [];
  }
}

/**
 * Build hierarchical menu tree from flat or nested menu items
 */
export function buildMenuTree(items: UserMenuItem[]): UserMenuItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  // Check if items are already nested
  const hasNestedChildren = items.some(
    (item) => Array.isArray(item.children) && item.children.length > 0,
  );
  if (hasNestedChildren) {
    return [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  // Build hierarchy from flat items with parentId
  const itemMap = new Map<string, UserMenuItem>();
  const rootItems: UserMenuItem[] = [];

  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  items.forEach((item) => {
    const current = itemMap.get(item.id);
    if (!current) return;
    if (item.parentId && itemMap.has(item.parentId)) {
      const parent = itemMap.get(item.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(current);
    } else {
      rootItems.push(current);
    }
  });

  const sortRecursive = (list: UserMenuItem[]) => {
    list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    list.forEach((m) => {
      if (m.children && m.children.length > 0) {
        sortRecursive(m.children);
      }
    });
  };

  sortRecursive(rootItems);
  return rootItems;
}

/**
 * Fetch the appropriate menu list for a given user:
 * 1. Queries /roles to resolve the user's roleId(s).
 * 2. Fetches each role's assigned menus via /roles/:roleId/menus.
 * 3. Falls back to /users/me menus or /menu if super admin.
 */
export async function fetchUserMenus(
  user: User | null,
  token?: string,
): Promise<UserMenuItem[]> {
  if (!user) return [];

  const customHeaders: Record<string, string> = {};
  if (token) {
    customHeaders["Authorization"] = `Bearer ${token}`;
  }

  // 1. Resolve role ID(s)
  let targetRoleIds: string[] = [];
  if (user.roleId) {
    targetRoleIds.push(user.roleId);
  }

  try {
    const allRoles = await getRoles();
    const userRoleNames = [user.role, ...(user.roles || [])]
      .filter(Boolean)
      .map((r) => (r as string).toUpperCase());

    const matched = allRoles.filter((r) =>
      userRoleNames.includes((r.name || "").toUpperCase()),
    );
    for (const m of matched) {
      if (m.id && !targetRoleIds.includes(m.id)) {
        targetRoleIds.push(m.id);
      }
    }
  } catch (err) {
    console.warn("Could not fetch roles list to resolve roleId:", err);
  }

  // 2. Query /roles/:roleId/menus for each matching role
  const collectedMenus: UserMenuItem[] = [];
  for (const roleId of targetRoleIds) {
    const roleMenus = await getRoleMenus(roleId, customHeaders);
    if (Array.isArray(roleMenus) && roleMenus.length > 0) {
      collectedMenus.push(...roleMenus);
    }
  }

  // Deduplicate by item id or path
  const uniqueItems = new Map<string, UserMenuItem>();
  collectedMenus.forEach((m) => {
    const key = m.id || m.path || m.name;
    if (key && !uniqueItems.has(key)) {
      uniqueItems.set(key, m);
    }
  });
  let resolvedList = Array.from(uniqueItems.values());

  // 3. Fallback for SUPER_ADMIN if /roles/:roleId/menus returned empty
  if (resolvedList.length === 0 && isSuperAdmin(user)) {
    // Check if /users/me already loaded menus
    if (user.menus && user.menus.length > 0) {
      resolvedList = user.menus;
    } else {
      try {
        const systemMenus = await request<UserMenuItem[]>(
          API_ENDPOINTS.MENU.LIST,
          "GET",
          undefined,
          customHeaders,
        );
        if (Array.isArray(systemMenus) && systemMenus.length > 0) {
          resolvedList = systemMenus;
        }
      } catch {
        // Ignore fallback errors
      }
    }
  } else if (resolvedList.length === 0 && user.menus && user.menus.length > 0) {
    resolvedList = user.menus;
  }

  return buildMenuTree(resolvedList);
}
