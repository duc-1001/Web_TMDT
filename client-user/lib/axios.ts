import { logout, refreshAccessToken } from "@/services/auth.service";
import { fetchLogout } from "@/store/slices/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import { Store } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { getBackendUrl } from "./backend-url";

let store: Store | null = null;

export const injectStore = (_store: Store) => {
  store = _store;
};

export const getDispatch = (): AppDispatch => {
  if (!store) {
    throw new Error("Redux store has not been injected");
  }
  return store.dispatch;
};
const api = axios.create({
  baseURL: `${getBackendUrl()}/api`,
  withCredentials: true,
  timeout: 120000, // <-- Tăng lên 2 phút (120 giây) cho upload
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.headers?.["Content-Type"] === "multipart/form-data") {
      config.timeout = 300000; // <-- 5 phút cho upload file
    }

    if (config.params) {
      Object.keys(config.params).forEach((key) => {
        if (config.params[key] == null) delete config.params[key];
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as any;
    const dispatch = getDispatch();

    const originalRequest: any = error.config;
    const url = originalRequest.url || "";

    if (url.includes("/auth/me")) {
      return Promise.reject(error);
    }

    if (
      url.includes("/auth/refresh")
    ) {
      dispatch(fetchLogout());
    }

    const code = data?.detail?.code || null;

    const LIST_OF_LOGIN_AUTH_ERRORS = [
      "NOT_LOGGED_IN",
      "INVALID_OR_EXPIRED_TOKEN",
      "INVALID_TOKEN_TYPE",
      "INVALID_TOKEN_PAYLOAD",
      "USER_NOT_FOUND",
    ];

    if (status === 401 && LIST_OF_LOGIN_AUTH_ERRORS.includes(code) && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshAccessToken();
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject({
      success: false,
      status,
      code,
      message: data?.detail?.message || data?.message || error.message || "An error occurred.",
      errors: data?.errors || null,
    });
  }
);

export default api;