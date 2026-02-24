// src/config/config.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

export const API_CONFIG = {
  BASE_URL,

  AUTH: {
    ADMIN_LOGIN: "/auth/admin/login",
    ADMIN_LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  ADMIN: {
    PROFILE: "/admin/profile",
    UPDATE_PROFILE: "/admin/update-profile",
  },

  USERS: {
    GET_ALL: "/users",
    GET_BY_ID: (id: string) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },

  CUSTOMERS: {
    GET_ALL: "/customers",
    GET_BY_ID: (id: string) => `/customers/${id}`,
    CREATE: "/customers",
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`,
  },

  LEADS: {
    GET_ALL: "/leads",
    GET_BY_ID: (id: string) => `/leads/${id}`,
    CREATE: "/leads",
    UPDATE: (id: string) => `/leads/${id}`,
    DELETE: (id: string) => `/leads/${id}`,
    UPDATE_STATUS: (id: string) => `/leads/${id}/status`,
  },

  NOTIFICATIONS: {
    GET_ALL: "/notifications",
    CREATE: "/notifications",
    BROADCAST: "/notifications/broadcast",
  },

  DASHBOARD: {
    STATS: "/dashboard/stats",
    ANALYTICS: "/dashboard/analytics",
  },
};