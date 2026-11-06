import axios from "axios";
import config from "@/lib/api/config";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getStoredAuth } from "@/lib/auth/session";
import { CurrentUserResponse } from "@/types/auth";

/**
 * Real auth calls for the sign-in / reset screens. Unlike `auth.api.ts` these
 * never fall back to mock data: a failure is shown to the person as it is.
 */

export type AuthErrorKind =
  | "invalid" // wrong Staff ID / password / code
  | "inactive" // account switched off
  | "validation" // 400
  | "throttled" // 429
  | "offline" // server not reachable
  | "server"; // 5xx

export class AuthError extends Error {
  kind: AuthErrorKind;
  status?: number;
  constructor(message: string, kind: AuthErrorKind, status?: number) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

function pickMessage(data: unknown): string {
  const raw = (data as { message?: unknown } | undefined)?.message;
  if (Array.isArray(raw)) return String(raw[0] ?? "");
  return typeof raw === "string" ? raw : "";
}

async function post<T>(endpoint: string, body: unknown, token?: string): Promise<T> {
  try {
    const res = await axios.post<T>(config.BASE_URL + endpoint, body, {
      timeout: 15000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.data;
  } catch (err) {
    const e = err as { response?: { status: number; data?: unknown } };
    if (!e.response) {
      throw new AuthError("Can't reach the server. Check your connection and try again.", "offline");
    }
    const { status, data } = e.response;
    const message = pickMessage(data);
    // Next's dev/prod proxy answers a plain-text 500 when the API is down.
    if (status === 500 && typeof data === "string") {
      throw new AuthError("The server isn't responding right now. Please try again shortly.", "offline", status);
    }
    if (status === 502 || status === 503 || status === 504) {
      throw new AuthError(
        status === 503 && message ? message : "The server isn't responding right now. Please try again shortly.",
        status === 503 && message ? "server" : "offline",
        status,
      );
    }
    if (status >= 500) throw new AuthError("Something went wrong on the server. Please try again.", "server", status);
    if (status === 429) throw new AuthError("Too many attempts. Please wait a moment and try again.", "throttled", status);
    if (status === 401) {
      const inactive = /not active/i.test(message);
      throw new AuthError(
        message || "Invalid Staff ID or password.",
        inactive ? "inactive" : "invalid",
        status,
      );
    }
    throw new AuthError(message || "Please check what you entered and try again.", status === 400 ? "validation" : "invalid", status);
  }
}

export interface SignInResult {
  accessToken: string;
  refreshToken?: string;
  mustChangePassword: boolean;
  user?: CurrentUserResponse;
}

export const signIn = (staffId: string, password: string) =>
  post<SignInResult>(API_ENDPOINTS.AUTH.LOGIN, { staffId: staffId.trim(), password });

export const requestResetCode = (staffId: string) =>
  post<{ message: string }>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { staffId: staffId.trim() });

export const verifyResetCode = (staffId: string, otp: string) =>
  post<{ resetToken: string }>(API_ENDPOINTS.AUTH.VERIFY_RESET_OTP, { staffId: staffId.trim(), otp });

export const submitNewPassword = (resetToken: string, newPassword: string) =>
  post<{ message?: string }>(API_ENDPOINTS.AUTH.RESET_PASSWORD, { resetToken, newPassword });

export const changeFirstPassword = (currentPassword: string, newPassword: string) => {
  const stored = getStoredAuth();
  const token = stored?.accessToken || stored?.token;
  return post<{ accessToken: string; refreshToken?: string }>(
    API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
    { currentPassword, newPassword },
    token,
  );
};
