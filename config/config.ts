// @/config/config — all API route constants
// Centralised so any endpoint change is a one-line edit

export const API_CONFIG = {
  AUTH: {
    ADMIN_LOGIN: "/auth/admin/login",
    ADMIN_LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",
  },

  COMPANIES: {
    BASE: "/companies",
    SIGNUP: "/companies/signup",
    ONBOARD: "/companies/onboard",
    SELECT: (id: string) => `/companies/${id}/select`,
    CLEAR_ACTIVE: "/companies/active/clear",
  },

  LOCATIONS: {
    BASE: "/locations",
    BY_ID: (id: string) => `/locations/${id}`,
    SELECT: (id: string) => `/locations/${id}/select`,
    CLEAR_ACTIVE: "/locations/active/clear",
  },

  MEMBERS: {
    BASE: "/members",
    BY_ID: (id: string) => `/members/${id}`,
    PHOTO: (id: string) => `/members/${id}/photo`,
    CHECKOUT: "/members/checkout",
    CHECKOUT_BY_ID: (sessionId: string) => `/members/checkout/${sessionId}`,
    CHECKOUT_RESEND: (sessionId: string) =>
      `/members/checkout/${sessionId}/resend`,
    CHECKOUT_CANCEL: (sessionId: string) =>
      `/members/checkout/${sessionId}/cancel`,
  },

  PLANS: {
    BASE: "/subscription-plans",
    BY_ID: (id: string) => `/subscription-plans/${id}`,
  },

  MEMBER_SUBSCRIPTIONS: {
    BASE: "/member-subscriptions",
    BY_ID: (id: string) => `/member-subscriptions/${id}`,
    BY_MEMBER: (memberId: string) => `/member-subscriptions/member/${memberId}`,
    ADD_PAYMENT: (id: string) => `/member-subscriptions/${id}/payment`,
  },

  PAYMENTS: {
    BASE: "/payments",
    BY_ID: (id: string) => `/payments/${id}`,
    BY_MEMBER: (memberId: string) => `/payments/member/${memberId}`,
    BY_SUBSCRIPTION: (subscriptionId: string) =>
      `/payments/subscription/${subscriptionId}`,
    PROOF: (id: string) => `/payments/${id}/proof`,
    PROVIDER: "/payment-provider",
    PROVIDER_CONNECT: "/payment-provider/razorpay/connect",
    PROVIDER_API_KEYS: "/payment-provider/razorpay/api-keys",
    PROVIDER_MOCK: "/payment-provider/razorpay/mock",
    PROVIDER_DISCONNECT: "/payment-provider/razorpay/disconnect",
    PROVIDER_WEBHOOK_SECRET: "/payment-provider/razorpay/webhook-secret",
    AUTOPAY_RUN: "/autopay/run",
    AUTOPAY_MANDATE: (subscriptionId: string) =>
      `/autopay/mandate/${subscriptionId}`,
    AUTOPAY_MANDATE_CANCEL: (subscriptionId: string) =>
      `/autopay/mandate/${subscriptionId}/cancel`,
  },

  INVOICES: {
    BASE: "/invoices",
    BY_ID: (id: string) => `/invoices/${id}`,
    BY_MEMBER: (memberId: string) => `/invoices/member/${memberId}`,
    BY_SUBSCRIPTION: (subscriptionId: string) =>
      `/invoices/subscription/${subscriptionId}`,
  },

  ANALYTICS: {
    DASHBOARD: "/analytics/dashboard",
    MEMBERS: "/analytics/members",
    REVENUE: "/analytics/revenue",
    SUBSCRIPTIONS: "/analytics/subscriptions",
    PAYMENT_TRENDS: "/analytics/payment-trends",
  },

  RENEWALS: {
    QUEUE: "/renewals/queue",
    QUEUE_COUNTS: "/renewals/queue/counts",
    FOLLOW_UP: (subscriptionId: string) =>
      `/renewals/${subscriptionId}/follow-up`,
  },

  DUES: {
    QUEUE: "/dues/queue",
    REMINDER: (subscriptionId: string) => `/dues/${subscriptionId}/reminder`,
  },

  EMPLOYEES: {
    BASE: "/employees",
    BY_ID: (id: string) => `/employees/${id}`,
    PHOTO: (id: string) => `/employees/${id}/photo`,
  },

  GYM_SETTINGS: {
    BASE: "/gym-settings",
    UPLOAD: "/gym-settings/upload",
  },

  WHATSAPP: {
    STATUS: "/whatsapp",
    MOCK: "/whatsapp/mock",
    CLOUD: "/whatsapp/cloud",
    CLICK_TO_CHAT: "/whatsapp/click-to-chat",
    DISCONNECT: "/whatsapp/disconnect",
    MESSAGES: "/whatsapp/messages",
  },

  SUBSCRIPTION: {
    BASE: "/subscription",
    PLANS: "/subscription/plans",
    INVOICES: "/subscription/invoices",
    PLAN: "/subscription/plan",
    MANDATE: "/subscription/mandate",
    CANCEL: "/subscription/cancel",
    RESUME: "/subscription/resume",
  },

  PLATFORM: {
    OVERVIEW: "/platform/overview",
    COMPANIES: "/platform/companies",
    PLANS: "/platform/plans",
    RUN_BILLING: "/platform/billing/run",
  },

  EMAIL_TEMPLATES: {
    BASE: "/email-templates",
    BY_TYPE: (type: string) => `/email-templates/${type}`,
    PREVIEW: (type: string) => `/email-templates/${type}/preview`,
    RESET: (type: string) => `/email-templates/${type}/reset`,
  },
} as const;
