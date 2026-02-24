import {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosInstance,
} from "axios";
import { authStorage } from "./storage/authStorage";
import { API_CONFIG } from "@/config/config";

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupInterceptors = (apiClient: AxiosInstance) => {
  // 🔹 Attach Access Token
  apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = authStorage.getAccessToken();

    if (
      accessToken &&
      !config.url?.includes(API_CONFIG.AUTH.REFRESH_TOKEN)
    ) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

  // 🔹 Handle 401 → Refresh Token
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;

if (!originalRequest) {
  return Promise.reject(error);
}
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
  !originalRequest.url?.includes(API_CONFIG.AUTH.REFRESH_TOKEN)

      ) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = authStorage.getRefreshToken();

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const response = await apiClient.post(
            API_CONFIG.AUTH.REFRESH_TOKEN,
            { refreshToken }
          );

          const newAccessToken = response.data?.tokens?.accessToken;

          if (!newAccessToken) {
            throw new Error("Failed to refresh access token");
          }

          // 🔥 Update stored access token (keep old refresh)
const newRefreshToken =
  response.data?.tokens?.refreshToken || refreshToken;

authStorage.setTokens(
  newAccessToken,
  newRefreshToken
);

          processQueue(null, newAccessToken);

          originalRequest.headers = originalRequest.headers || {};
originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);

          authStorage.clearTokens();

          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};