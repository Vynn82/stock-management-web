import axios from "axios";
import { readRawAuth } from "@/lib/auth/session";
import config from "./config";
export { request } from "./request";

export const apiClient = axios.create({
  baseURL: config.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 4000,
  withCredentials: true,
});

// Request interceptor to attach authentication token if available
apiClient.interceptors.request.use((configReq) => {
  if (typeof window !== "undefined") {
    try {
      const stored = readRawAuth();
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed.accessToken || parsed.token;
        if (token) {
          configReq.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }
  return configReq;
});

// Alias export for backward compatibility
export const api = apiClient;
