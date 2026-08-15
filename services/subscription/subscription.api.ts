import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

/** Where this gym stands with the platform. */
export type BillingSnapshot = {
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "READ_ONLY" | "CANCELLED";
  planCode: string;
  planName: string;
  interval: "MONTHLY" | "YEARLY";
  currency: string;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  currentPeriodEnd: string | null;
  branches: number;
  pricePerBranch: number;
  /** What the next charge will be at today's branch count. */
  nextAmount: number;
  features: string[];
  maxBranches: number | null;
  maxMembers: number | null;
  /** False once the account is read-only — the CRM hides write actions. */
  canWrite: boolean;
  mandateApproved: boolean;
  mandateShareUrl: string | null;
  lastFailureReason: string | null;
  cancelledAt: string | null;
  billingConfigured?: boolean;
};

export type PlatformPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  pricePerBranch: number;
  interval: string;
  currency: string;
  trialDays: number;
  features: string[];
  maxBranches: number | null;
  maxMembers: number | null;
  isRecommended: boolean;
  pricing: {
    monthlyPerBranch: number;
    yearlyPerBranch: number;
    yearlyMonthsCharged: number;
    yearlySavingMonths: number;
  };
};

export type PlatformInvoice = {
  id: string;
  invoiceNumber: string;
  planCode: string;
  branches: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  failureReason: string | null;
};

export type MandateStart = {
  shareUrl: string;
  qrData: string;
  amount: number;
  currency: string;
  branches: number;
  planCode: string;
  expiresAt: string;
};

export const subscriptionApi = {
  mine: () => requestService.get<BillingSnapshot>(API_CONFIG.SUBSCRIPTION.BASE),

  plans: () =>
    requestService.get<PlatformPlan[]>(API_CONFIG.SUBSCRIPTION.PLANS),

  invoices: () =>
    requestService.get<PlatformInvoice[]>(API_CONFIG.SUBSCRIPTION.INVOICES),

  changePlan: (planCode: string, interval: "MONTHLY" | "YEARLY" = "MONTHLY") =>
    requestService.post<BillingSnapshot, { planCode: string; interval: string }>(
      API_CONFIG.SUBSCRIPTION.PLAN,
      { planCode, interval },
    ),

  /** Returns the UPI Autopay link the gym owner approves to start paying. */
  startMandate: () =>
    requestService.post<MandateStart, Record<string, never>>(
      API_CONFIG.SUBSCRIPTION.MANDATE,
      {},
    ),

  cancel: (reason?: string) =>
    requestService.post<BillingSnapshot, { reason?: string }>(
      API_CONFIG.SUBSCRIPTION.CANCEL,
      { reason },
    ),

  resume: () =>
    requestService.post<BillingSnapshot, Record<string, never>>(
      API_CONFIG.SUBSCRIPTION.RESUME,
      {},
    ),
};

/** SUPER_ADMIN view of every gym's standing. */
export type PlatformOverview = {
  counts: {
    trialing: number;
    active: number;
    pastDue: number;
    readOnly: number;
    cancelled: number;
    total: number;
  };
  mrr: number;
  lifetimeRevenue: number;
  paidCharges: number;
  trialsEndingSoon: Array<{
    companyId: string;
    companyName: string;
    planCode: string;
    trialEndsAt: string;
    daysLeft: number;
  }>;
};

export type PlatformCompanyRow = {
  companyId: string;
  companyName: string;
  city: string | null;
  phone: string | null;
  signedUpAt: string | null;
  status: string;
  planCode: string;
  interval: string;
  pricePerBranch: number;
  branches: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  lastChargeAt: string | null;
  lastAmount: number;
  mandateApproved: boolean;
  dunningAttempts: number;
  lastFailureReason: string | null;
  cancelledAt: string | null;
};

export const platformApi = {
  overview: () =>
    requestService.get<PlatformOverview>(API_CONFIG.PLATFORM.OVERVIEW),

  companies: (status?: string) =>
    requestService.get<PlatformCompanyRow[]>(
      API_CONFIG.PLATFORM.COMPANIES,
      status && status !== "ALL" ? { status } : undefined,
    ),

  plans: () => requestService.get<PlatformPlan[]>(API_CONFIG.PLATFORM.PLANS),

  runBilling: () =>
    requestService.post<Record<string, number>, Record<string, never>>(
      API_CONFIG.PLATFORM.RUN_BILLING,
      {},
    ),
};
