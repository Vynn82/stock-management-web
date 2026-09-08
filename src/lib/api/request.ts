import axios, { Method } from "axios";
import config from "./config";
import { getStatus, setStatus } from "@/store/statusStore";
import { AUTH_STORAGE_KEY } from "@/lib/constants";

export interface RequestErrorDetails {
  help: string;
  validateStatus: "error";
  hasFeedback: boolean;
}

export interface RequestErrorResult<T = unknown> {
  status: string | number;
  errors: Record<string, RequestErrorDetails>;
  data?: T;
  message?: string;
}

export const request = async <T = any>(
  endpoint: string = "",
  method: string = "GET",
  data: any = {},
  customHeaders?: Record<string, string>,
): Promise<T> => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  try {
    let contentType: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (typeof FormData !== "undefined" && data instanceof FormData) {
      contentType = {
        "Content-Type": "multipart/form-data",
      };
    }

    // Attach Bearer token from sessionStorage if available
    const authHeader: Record<string, string> = {};
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const token = parsed.accessToken || parsed.token;
          if (token) {
            authHeader["Authorization"] = `Bearer ${token}`;
          }
        }
      } catch {
        // Ignore sessionStorage read errors
      }
    }

    const axiosConfig: any = {
      url: config.BASE_URL + cleanEndpoint,
      method: method as Method,
      headers: {
        Accept: "application/json",
        ...contentType,
        ...authHeader,
        ...customHeaders,
      },
      timeout: 4000,
      withCredentials: true,
    };

    if (method.toUpperCase() !== "GET") {
      axiosConfig.data = data;
    }

    const res = await axios(axiosConfig);

    console.log("Axios: ", res);
    setStatus(res.status);
    return res.data;
  } catch (err: any) {
    console.log("this is err: ", err);

    if (err.code === "ERR_NETWORK") {
      setStatus("error");
      throw new Error(
        "Network error: Unable to reach the server. Please check your connection.",
      );
    }

    const response = err.response;
    if (response) {
      console.log("Full Respone:::", response);
      const status = response.status;
      console.log(status);
      const resData = response.data;
      const errors: Record<string, RequestErrorDetails> = {};

      if (status == 500 || status == "500") {
        console.log("Server error");
        setStatus("500");
        throw new Error(
          resData?.message || "Internal server error occurred (500).",
        );
      }

      if (status == 401 || status == "401") {
        console.log("=====IT GO 401====");
        setStatus("403");
        // Only return resData for login to expose error message to form
        if (cleanEndpoint.includes("auth/login")) {
          return resData;
        }
        throw new Error(resData?.message || "Unauthorized (401)");
      }

      if (resData?.errors && typeof resData.errors === "object") {
        console.log("IT GO TO data.errors");
        Object.keys(resData.errors).forEach((key) => {
          const val = resData.errors[key];
          errors[key] = {
            help: Array.isArray(val) ? val[0] : String(val),
            validateStatus: "error",
            hasFeedback: true,
          };
        });
      }

      setStatus(status);
      console.log("DAATA----", resData);

      const customErr: any = new Error(
        resData?.message || `Request failed with status code ${status}`,
      );
      customErr.status = status;
      customErr.errors = errors;
      customErr.data = resData;
      customErr.response = response;
      throw customErr;
    }

    throw err;
  }
};

export default request;
