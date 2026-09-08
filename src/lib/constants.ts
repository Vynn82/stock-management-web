export const APP_NAME = "Stock Management";

export const AUTH_STORAGE_KEY = "authResponse";
export const AUTH_TOKEN_COOKIE = "auth_token";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SETUP_PASSWORD: "/setup-password",
  DASHBOARD: "/dashboard",
  MY_REQUESTS: "/my-requests",
  MY_APPROVALS: "/my-approvals",
  PRODUCTS: "/products",
  PRODUCT_CREATE: "/products/create",
  REQUESTS: "/my-requests",
  CATEGORIES: "/categories",
  BRANDS: "/brands",
  WAREHOUSES: "/warehouses",
  STAFF: "/staff",
  ROLES: "/roles",
  PERMISSIONS: "/permissions",
  REPORTS: "/reports",
} as const;
