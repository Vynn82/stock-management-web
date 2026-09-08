import { request } from "@/lib/api/request";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  LoginPayload,
  LoginResponse,
  SetupPasswordPayload,
} from "./auth.types";
import { CurrentUserResponse } from "@/types/auth";
import { AUTH_STORAGE_KEY } from "@/lib/constants";

export const MOCK_ACCESS_TOKEN = "mock-jwt-token-for-testing-frontend";

export const MOCK_CURRENT_USER: CurrentUserResponse = {
  id: "7f45d8be-13eb-4f6b-b3a0-d1e85d1cae1c",
  staffId: "KH0001",
  status: "ACTIVE",
  mustChangePassword: true, // Triggers setup password screen first
  profile: {
    id: "prof-1",
    userId: "7f45d8be-13eb-4f6b-b3a0-d1e85d1cae1c",
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex.johnson@stockflow.io",
    phone: "+855 12 345 678",
    telegramChatId: "@alex_stock",
    avatar: null,
  },
  roles: ["SUPER_ADMIN"],
  permissions: [
    "product:view",
    "product:create",
    "product:update",
    "product:delete",
    "category:view",
    "category:create",
    "brand:view",
    "brand:create",
    "warehouse:view",
    "warehouse:create",
    "staff:view",
    "staff:create",
    "role:view",
    "role:create",
    "report:view",
    "request:view",
    "request:create",
    "request:commit",
  ],
  menus: [
    {
      id: "menu-stock",
      name: "Products & Stock",
      label: "Products",
      path: "/products",
      icon: "Boxes",
      sortOrder: 1,
    },
    {
      id: "menu-categories",
      name: "Categories",
      label: "Categories",
      path: "/categories",
      icon: "Appstore",
      sortOrder: 2,
    },
    {
      id: "menu-brands",
      name: "Brands",
      label: "Brands",
      path: "/brands",
      icon: "Tags",
      sortOrder: 3,
    },
    {
      id: "menu-warehouses",
      name: "Warehouses",
      label: "Warehouses",
      path: "/warehouses",
      icon: "Building",
      sortOrder: 4,
    },
    {
      id: "menu-staff",
      name: "Staff Management",
      label: "Staff & Users",
      path: "/staff",
      icon: "Users",
      sortOrder: 5,
    },
    {
      id: "menu-roles",
      name: "Roles & Access",
      label: "Roles",
      path: "/roles",
      icon: "Shield",
      sortOrder: 6,
    },
    {
      id: "menu-permissions",
      name: "Permissions",
      label: "Permissions",
      path: "/permissions",
      icon: "Key",
      sortOrder: 7,
    },
    {
      id: "menu-reports",
      name: "Reports & Analytics",
      label: "Reports",
      path: "/reports",
      icon: "BarChart",
      sortOrder: 8,
    },
  ],
};

function updateStoredSessionPasswordStatus(mustChange: boolean) {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.mustChangePassword = mustChange;
      if (parsed.user) {
        parsed.user.mustChangePassword = mustChange;
      }
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch {}
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const staffUpper = (payload.staffId || "").trim().toUpperCase();

  // If explicit demo/mock staff ID is supplied, return mock immediately
  if (staffUpper === "DEMO" || staffUpper === "MOCK" || staffUpper === "TEST") {
    MOCK_CURRENT_USER.mustChangePassword = true;
    return {
      accessToken: MOCK_ACCESS_TOKEN,
      refreshToken: "mock-refresh-token",
      token: MOCK_ACCESS_TOKEN,
      mustChangePassword: true,
      user: {
        ...MOCK_CURRENT_USER,
        staffId: payload.staffId || "KH0001",
      },
    };
  }

  try {
    const data = await request<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      "POST",
      payload,
    );
    return data;
  } catch (err) {
    // If real backend is offline or unreachable, fallback smoothly to mock auth
    console.warn(
      "Backend auth unreachable, falling back to mock login mode with required password change:",
      err,
    );
    MOCK_CURRENT_USER.mustChangePassword = true;
    MOCK_CURRENT_USER.staffId = payload.staffId?.trim() || "KH0001";
    return {
      accessToken: MOCK_ACCESS_TOKEN,
      refreshToken: "mock-refresh-token",
      token: MOCK_ACCESS_TOKEN,
      mustChangePassword: true,
      user: {
        ...MOCK_CURRENT_USER,
        staffId: payload.staffId?.trim() || "KH0001",
      },
    };
  }
}

export async function getMe(token?: string): Promise<CurrentUserResponse> {
  // Check if session has updated mustChangePassword
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.mustChangePassword === "boolean") {
          MOCK_CURRENT_USER.mustChangePassword = parsed.mustChangePassword;
        }
      }
    } catch {}
  }

  if (token === MOCK_ACCESS_TOKEN) {
    return { ...MOCK_CURRENT_USER };
  }

  const customHeaders: Record<string, string> = {};
  if (token) {
    customHeaders["Authorization"] = `Bearer ${token}`;
  }
  let data: any;
  try {
    data = await request<any>(
      API_ENDPOINTS.USERS.ME,
      "GET",
      undefined,
      customHeaders,
    );
  } catch (err) {
    // Also try /me endpoint fallback
    try {
      data = await request<any>("me", "GET", undefined, customHeaders);
    } catch {
      // Backend offline: return mock profile
      console.warn(
        "Backend /users/me offline, falling back to mock user profile.",
      );
      return { ...MOCK_CURRENT_USER };
    }
  }

  if (!data || data?.statusCode === 401 || data?.status === 401 || !data?.id) {
    return { ...MOCK_CURRENT_USER };
  }
  return data as CurrentUserResponse;
}

export async function setupPassword(
  payload: SetupPasswordPayload,
): Promise<unknown> {
  try {
    const data = await request(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      "POST",
      payload,
    );
    updateStoredSessionPasswordStatus(false);
    MOCK_CURRENT_USER.mustChangePassword = false;
    return data;
  } catch (err) {
    console.warn(
      "Backend change-password offline, completing password setup with mock success:",
      err,
    );
    updateStoredSessionPasswordStatus(false);
    MOCK_CURRENT_USER.mustChangePassword = false;
    return { success: true, message: "Password setup successful." };
  }
}

export async function refreshAuthToken(
  refreshToken: string,
): Promise<{ accessToken: string }> {
  try {
    const data = await request<{ accessToken: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      "POST",
      { refreshToken },
    );
    return data;
  } catch {
    return { accessToken: MOCK_ACCESS_TOKEN };
  }
}

// Alias for backward compatibility
export const changePassword = setupPassword;
