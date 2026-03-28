// @/config/config — all API route constants
// Centralised so any endpoint change is a one-line edit

export const API_CONFIG = {
  AUTH: {
    ADMIN_LOGIN:   "/auth/admin/login",
    ADMIN_LOGOUT:  "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",
  },

  MEMBERS: {
    BASE:     "/members",
    REGISTER: "/members/register",
    BY_ID:    (id: string) => `/members/${id}`,
    PAYMENTS: "/members/payments",
    IMPORT:   "/members/import",
  },

  PLANS: {
    BASE:   "/subscription-plans",
    BY_ID:  (id: string) => `/subscription-plans/${id}`,
  },

  MEMBER_SUBSCRIPTIONS: {
    BASE:        "/member-subscriptions",
    BY_ID:       (id: string) => `/member-subscriptions/${id}`,
    BY_MEMBER:   (memberId: string) => `/member-subscriptions/member/${memberId}`,
    ADD_PAYMENT: (id: string) => `/member-subscriptions/${id}/payment`,
  },

  PAYMENTS: {
    BASE:            "/payments",
    BY_ID:           (id: string) => `/payments/${id}`,
    BY_MEMBER:       (memberId: string) => `/payments/member/${memberId}`,
    BY_SUBSCRIPTION: (subscriptionId: string) => `/payments/subscription/${subscriptionId}`,
  },

  INVOICES: {
    BASE:            "/invoices",
    BY_ID:           (id: string) => `/invoices/${id}`,
    BY_MEMBER:       (memberId: string) => `/invoices/member/${memberId}`,
    BY_SUBSCRIPTION: (subscriptionId: string) => `/invoices/subscription/${subscriptionId}`,
  },

  ANALYTICS: {
    DASHBOARD:         "/analytics/dashboard",
    MEMBERS:           "/analytics/members",
    REVENUE:           "/analytics/revenue",
    SUBSCRIPTIONS:     "/analytics/subscriptions",
    PAYMENT_TRENDS:    "/analytics/payment-trends",
    EXPIRING_IN_7_DAYS: "/analytics/expiring-in-7-days",
    PAYMENT_UPDATES:   "/analytics/payment-updates",
  },

  EMPLOYEES: {
    BASE:        "/employees",
    BY_ID:       (id: string) => `/employees/${id}`,
    AUTH_UNLOCK: "/employees/auth/unlock",
    AUTH_LOCK:   "/employees/auth/lock",
    AUTH_STATUS: "/employees/auth/status",
  },
} as const;