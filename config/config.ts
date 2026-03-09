// @/config/config — all API route constants
// Centralised so any endpoint change is a one-line edit

export const API_CONFIG = {
  AUTH: {
    ADMIN_LOGIN:   "/auth/admin/login",
    ADMIN_LOGOUT:  "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",
  },

  MEMBERS: {
    BASE:   "/members",
    BY_ID:  (id: string) => `/members/${id}`,
  },

  PLANS: {
    BASE:   "/subscription-plans",
    BY_ID:  (id: string) => `/subscription-plans/${id}`,
  },
} as const;