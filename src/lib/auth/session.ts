import { AUTH_STORAGE_KEY } from "@/lib/constants";
import { User, CurrentUserResponse } from "@/types/auth";

export const TEMP_PASSWORD_KEY = "temp_password";

export function mapCurrentUserToUser(me: CurrentUserResponse): User {
  const firstName = me.profile?.firstName || "";
  const lastName = me.profile?.lastName || "";
  const fullName =
    `${firstName} ${lastName}`.trim() || me.staffId || "Staff Member";
  const primaryRole = me.roles?.[0] || "STAFF";

  return {
    id: me.id,
    staffId: me.staffId,
    firstName,
    lastName,
    name: fullName,
    email: me.profile?.email,
    phone: me.profile?.phone,
    telegramChatId: me.profile?.telegramChatId,
    avatar: me.profile?.avatar,
    role: primaryRole,
    roles: me.roles || [],
    permissions: me.permissions || [],
    menus: me.menus || [],
    mustChangePassword: me.mustChangePassword,
    status: me.status,
    profile: me.profile,
  };
}

export interface JwtPayload {
  sub?: string;
  staffId?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface StoredAuthData {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  mustChangePassword?: boolean;
  user?: User;
  [key: string]: unknown;
}

export function decodeJwt<T = JwtPayload>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join(""),
      ),
    ) as T;
  } catch {
    return null;
  }
}

export function getStoredAuth(): StoredAuthData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthData) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(data: StoredAuthData): void {
  if (typeof window === "undefined") return;

  try {
    const token = data.accessToken || data.token;

    if (token && !data.user) {
      const decoded = decodeJwt<JwtPayload>(token);
      if (decoded) {
        data.user = {
          id: decoded.sub || "",
          staffId: decoded.staffId || "",
          name: decoded.staffId || "Staff Member",
          role: decoded.roles?.[0] || "STAFF",
          roles: decoded.roles || [],
          permissions: decoded.roles || [],
          mustChangePassword: data.mustChangePassword,
        };
      }
    }

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors.
  }
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(TEMP_PASSWORD_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function getTempPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TEMP_PASSWORD_KEY);
}

export function setTempPassword(value: string): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(TEMP_PASSWORD_KEY, value);
  } catch {
    // Ignore storage errors.
  }
}

export function clearTempPassword(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(TEMP_PASSWORD_KEY);
  } catch {
    // Ignore storage errors.
  }
}
