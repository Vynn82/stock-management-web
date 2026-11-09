import axios from "axios";
import config from "@/lib/api/config";
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

/**
 * Raw persisted auth JSON. Lives in localStorage so the login survives closing
 * the tab/browser (like the mobile app). Older sessions saved in
 * sessionStorage are migrated on first read.
 */
export function readRawAuth(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const persisted = localStorage.getItem(AUTH_STORAGE_KEY);
    if (persisted) return persisted;
  } catch {
    // localStorage unavailable (private mode etc.) - fall through.
  }
  try {
    const legacy = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (legacy) {
      writeRawAuth(legacy);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return legacy;
    }
  } catch {
    // ignore
  }
  return null;
}

export function writeRawAuth(raw: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, raw);
  } catch {
    // Fall back to the tab-only session if persistent storage is blocked.
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, raw);
    } catch {
      // Ignore storage errors.
    }
  }
}

export function getStoredAuth(): StoredAuthData | null {
  try {
    const raw = readRawAuth();
    return raw ? (JSON.parse(raw) as StoredAuthData) : null;
  } catch {
    return null;
  }
}

/** True when the access token's `exp` claim is in the past. */
export function isTokenExpired(token?: string | null): boolean {
  if (!token) return true;
  const exp = decodeJwt<JwtPayload>(token)?.exp;
  if (!exp) return false; // opaque/mock token: let the server decide
  return exp * 1000 <= Date.now();
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

    writeRawAuth(JSON.stringify(data));
  } catch {
    // Ignore storage errors.
  }
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
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

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Trades the stored refresh token for a fresh access token (the API rotates
 * the refresh token too, so only one call may run at a time).
 * Returns the new access token, or null when the session can't be renewed.
 */
export function refreshSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const stored = getStoredAuth();
  const refreshToken = stored?.refreshToken;
  if (!stored || !refreshToken) return Promise.resolve(null);

  refreshInFlight = axios
    .post<{ accessToken: string; refreshToken?: string; mustChangePassword?: boolean }>(
      `${config.BASE_URL}auth/refresh`,
      { refreshToken },
      { timeout: 15000 },
    )
    .then((res) => {
      const next = res.data;
      if (!next?.accessToken) return null;
      // Re-read: another tab/call may have updated the user meanwhile.
      const current = getStoredAuth() ?? stored;
      setStoredAuth({
        ...current,
        accessToken: next.accessToken,
        token: undefined,
        refreshToken: next.refreshToken || refreshToken,
      });
      return next.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

/**
 * Returns a usable access token, silently renewing it when it has expired.
 * Null means the person has to sign in again.
 */
export async function ensureValidToken(): Promise<string | null> {
  const stored = getStoredAuth();
  const token = stored?.accessToken || stored?.token || null;
  if (!token) return null;
  if (!isTokenExpired(token)) return token;
  return refreshSession();
}
