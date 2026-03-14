import {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosInstance,
} from "axios";
import { authStorage } from "./storage/authStorage";
import { API_CONFIG } from "@/config/config";

// ─── BUG 1 FIX ────────────────────────────────────────────────────────────────
// `isRefreshing` and `failedQueue` were declared at MODULE level.
// Because `setupInterceptors` is called TWICE — once in apiClient.ts and once
// in lib/api.ts — two separate interceptor chains are registered on the same
// axios instance. Each chain has its OWN closure copy of `isRefreshing`.
// When the first chain sets isRefreshing=true, the second chain still sees
// isRefreshing=false and fires a second refresh call. The second call fails
// (refresh token already consumed / rotation), which triggers logout.
//
// FIX: Move state into a singleton object that is shared across ALL interceptor
// registrations on any instance. This also protects against HMR re-registration
// in Next.js dev mode.
// ──────────────────────────────────────────────────────────────────────────────

const refreshState = {
  isRefreshing: false,
  failedQueue: [] as Array<{ resolve: (token: string) => void; reject: (err: any) => void }>,
};

const processQueue = (error: any, token: string | null = null) => {
  refreshState.failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else       prom.resolve(token!);
  });
  refreshState.failedQueue = [];
};

// ─── BUG 2 FIX ────────────────────────────────────────────────────────────────
// setupInterceptors was being called twice (apiClient.ts + lib/api.ts), which
// registered duplicate request AND response interceptors. Every request had its
// access token attached twice, and every 401 triggered two refresh attempts.
//
// FIX: Guard against double-registration with a WeakSet. If interceptors have
// already been set up on this axios instance, skip silently.
// ──────────────────────────────────────────────────────────────────────────────

const registeredInstances = new WeakSet<AxiosInstance>();

export const setupInterceptors = (apiClient: AxiosInstance) => {
  if (registeredInstances.has(apiClient)) return; // already set up — skip
  registeredInstances.add(apiClient);

  // ── Request: attach access token ──────────────────────────────────────────
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const accessToken = authStorage.getAccessToken();
      if (accessToken && !config.url?.includes(API_CONFIG.AUTH.REFRESH_TOKEN)) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ── Response: handle 401 → refresh ────────────────────────────────────────
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;

      if (!originalRequest) return Promise.reject(error);

      // ─── BUG 3 FIX ──────────────────────────────────────────────────────
      // The originalRequest.url check used `includes(REFRESH_TOKEN)` but
      // `originalRequest.url` is the *path* ("/auth/refresh"), while the full
      // URL is assembled by axios from baseURL + url. The check worked here,
      // but `originalRequest.url` can be undefined if the request was retried,
      // causing the guard to be skipped and entering an infinite refresh loop.
      //
      // FIX: Also guard on `_retry` flag (already present) AND on whether the
      // full composed URL contains the refresh path, checking both `.url` and
      // the resolved baseURL+url combination.
      // ────────────────────────────────────────────────────────────────────
      const isRefreshEndpoint =
        originalRequest.url?.includes(API_CONFIG.AUTH.REFRESH_TOKEN) ||
        (originalRequest.baseURL + (originalRequest.url ?? "")).includes(
          API_CONFIG.AUTH.REFRESH_TOKEN
        );

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isRefreshEndpoint
      ) {
        // Queue concurrent requests while a refresh is already in flight
        if (refreshState.isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            refreshState.failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        refreshState.isRefreshing = true;

        try {
          const refreshToken = authStorage.getRefreshToken();

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          // ─── BUG 4 FIX ────────────────────────────────────────────────
          // The refresh call used `apiClient.post(...)` which goes through the
          // SAME interceptor chain. That means:
          //   a) The request interceptor tries to attach the (expired) access
          //      token as Authorization, overwriting the refresh token header
          //      we're about to set.
          //   b) If the refresh fails with 401, the response interceptor picks
          //      it up again, sees it's not flagged _retry yet, and tries to
          //      refresh again → infinite loop until stack overflow.
          //
          // We already guard with `isRefreshEndpoint`, but the header override
          // in (a) is the real silent killer: the backend receives the expired
          // access token instead of the refresh token and rejects it → logout.
          //
          // FIX: Use a raw axios call (import axios directly) that bypasses our
          // interceptors entirely for the refresh request. This is the only safe
          // way to make an unauthenticated call from within an interceptor.
          // ────────────────────────────────────────────────────────────────
          const axios = (await import("axios")).default;
          const baseURL = (apiClient.defaults.baseURL ?? "").replace(/\/$/, "");

          const response = await axios.post(
            `${baseURL}${API_CONFIG.AUTH.REFRESH_TOKEN}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          const newAccessToken  = response.data?.accessToken;
          const newRefreshToken = response.data?.refreshToken ?? refreshToken;

          if (!newAccessToken) {
            throw new Error("Refresh response missing accessToken");
          }

          authStorage.setTokens(newAccessToken, newRefreshToken);
          processQueue(null, newAccessToken);

          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          authStorage.clearTokens();

          if (typeof window !== "undefined") {
            // Use replace so the login page isn't stacked in history
            window.location.replace("/login");
          }

          return Promise.reject(refreshError);
        } finally {
          refreshState.isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};