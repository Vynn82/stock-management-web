import axios, { AxiosRequestConfig } from "axios";
import config from "@/lib/api/config";
import { getStoredAuth, clearStoredAuth } from "@/lib/auth/session";

/**
 * HTTP helpers for the pages that talk to the real API.
 * Unlike `lib/api/request` there is no mock fallback: a failure is thrown as
 * an `ApiError` with a message that can be shown to the person.
 */

export class ApiError extends Error {
  status?: number;
  offline: boolean;
  constructor(message: string, status?: number, offline = false) {
    super(message);
    this.status = status;
    this.offline = offline;
  }
}

function messageOf(data: unknown): string {
  const raw = (data as { message?: unknown } | undefined)?.message;
  if (Array.isArray(raw)) return String(raw[0] ?? "");
  return typeof raw === "string" ? raw : "";
}

async function call<T>(cfg: AxiosRequestConfig): Promise<T> {
  const token = getStoredAuth()?.accessToken || getStoredAuth()?.token;
  const isForm = typeof FormData !== "undefined" && cfg.data instanceof FormData;
  try {
    const res = await axios.request<T>({
      baseURL: config.BASE_URL,
      timeout: 20000,
      ...cfg,
      headers: {
        Accept: "application/json",
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...cfg.headers,
      },
    });
    return res.data;
  } catch (err) {
    const e = err as { response?: { status: number; data?: unknown } };
    if (!e.response) {
      throw new ApiError("Can't reach the server. Check your connection and try again.", undefined, true);
    }
    const { status, data } = e.response;
    const message = messageOf(data);
    if (status === 401 && typeof window !== "undefined") {
      clearStoredAuth();
      window.location.assign("/auth/login?expired=1");
      throw new ApiError("Your session ended. Please sign in again.", 401);
    }
    if (status === 500 && typeof data === "string") {
      throw new ApiError("The server isn't responding right now. Please try again shortly.", status, true);
    }
    if (status === 403) throw new ApiError(message || "You don't have permission to do this.", status);
    if (status === 404) throw new ApiError(message || "Not found.", status);
    if (status >= 500) throw new ApiError(message || "Something went wrong on the server.", status);
    throw new ApiError(message || "Please check what you entered and try again.", status);
  }
}

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) => call<T>({ url, method: "GET", params }),
  post: <T>(url: string, data?: unknown) => call<T>({ url, method: "POST", data }),
  patch: <T>(url: string, data?: unknown) => call<T>({ url, method: "PATCH", data }),
  put: <T>(url: string, data?: unknown) => call<T>({ url, method: "PUT", data }),
  del: <T>(url: string) => call<T>({ url, method: "DELETE" }),
  /** Downloads a file (e.g. an Excel export) and hands it to the browser. */
  download: async (url: string, fallbackName: string): Promise<void> => {
    const blob = await call<Blob>({ url, method: "GET", responseType: "blob", timeout: 60000 });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  },
  postForm: <T>(url: string, data: FormData) => call<T>({ url, method: "POST", data, timeout: 60000 }),
};

export interface Page<T> {
  data: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean };
}

/** Walks every page of a paginated list (the API allows 100 rows per page). */
export async function listAll<T>(url: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page < 200; page++) {
    const json = await api.get<Page<T> | T[]>(url, { ...params, page, limit: 100 });
    if (Array.isArray(json)) return json;
    rows.push(...(json.data ?? []));
    if (!json.meta?.hasNextPage) break;
  }
  return rows;
}
