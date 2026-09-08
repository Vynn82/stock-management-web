export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "auth/login",
    CHANGE_PASSWORD: "auth/change-password",
    REFRESH: "auth/refresh",
    LOGOUT: "auth/logout",
  },
  USERS: {
    LIST: "users",
    ME: "users/me",
    CREATE: "users",
    UPDATE_ROLE: (id: string) => `users/${id}/role`,
  },
  ROLES: {
    LIST: "roles",
    CREATE: "roles",
    PERMISSIONS: (id: string) => `roles/${id}/permissions`,
    DELETE_PERMISSION: (id: string, permId: string) =>
      `roles/${id}/permissions/${permId}`,
    MENUS: (id: string) => `roles/${id}/menus`,
  },
  PERMISSIONS: {
    LIST: "permissions",
    CREATE: "permissions",
    BULK: "permissions/bulk",
    RESOURCES: "permissions/resources",
  },
  MENU: {
    LIST: "menu",
    CREATE: "menu",
  },
  CATEGORIES: {
    LIST: "categories",
    CREATE: "categories",
    UPDATE: (id: string) => `categories/${id}`,
  },
  BRANDS: {
    LIST: "brands",
    CREATE: "brands",
    UPDATE: (id: string) => `brands/${id}`,
  },
  WAREHOUSES: {
    LIST: "warehouses",
    CREATE: "warehouses",
    UPDATE: (id: string) => `warehouses/${id}`,
  },
  REQUESTS: {
    LIST: "requests",
    CREATE: "requests",
    COMMIT: (id: string) => `requests/${id}/commit`,
    IMPORT: "requests/import",
    IMPORT_TEMPLATE: "requests/import/template",
  },
  // Backward compatibility alias for legacy product calls
  PRODUCTS: {
    LIST: "requests",
    CREATE: "requests",
    DETAIL: (id: string) => `requests/${id}`,
    UPDATE: (id: string) => `requests/${id}`,
    DELETE: (id: string) => `requests/${id}`,
  },
  STAFF: {
    LIST: "users",
    DETAIL: (id: string) => `users/${id}`,
    CREATE: "users",
    UPDATE: (id: string) => `users/${id}`,
    DELETE: (id: string) => `users/${id}`,
  },
  REPORTS: {
    SUMMARY: "reports/summary",
    STOCK: "reports/stock",
  },
} as const;

export default API_ENDPOINTS;
