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
  currentPeriodStart?: string | null;
  currentPeriodEnd: string | null;
  branches: number;
  pricePerBranch: number;
  /** What the next charge will be at today's branch count. */
  nextAmount: number;
  lastAmount?: number | null;
  lastChargeAt?: string | null;
  billingMode?: "ONE_TIME" | "AUTOPAY" | null;
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
  /** Sales-led — gym submits inquiry instead of self-serve switch. */
  isContactSales?: boolean;
  pricing: {
    monthlyPerBranch: number;
    yearlyPerBranch: number;
    yearlyMonthsCharged: number;
    yearlySavingMonths: number;
  };
};

export type CustomInquiryPayload = {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  branchCount: number;
  approxMembers?: number;
  needs?: string[];
  currentSoftware?: string;
  message?: string;
};

export type PlatformInquiry = {
  id: string;
  companyId: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  branchCount: number;
  approxMembers: number | null;
  needs: string[];
  currentSoftware: string | null;
  message: string | null;
  status: "NEW" | "CONTACTED" | "CLOSED";
  adminNotes: string | null;
  contactedAt: string | null;
  createdAt: string;
};

export type PlatformInvoice = {
  id: string;
  invoiceNumber: string;
  planCode: string;
  branches: number;
  subtotal: number;
  taxPercentage?: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  failureReason: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  paymentMethod?: string | null;
  paymentInstrument?: string | null;
  payMode?: string | null;
  providerStatus?: string | null;
  billTo?: {
    name: string;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
  };
};

export type MandateStart = {
  /** Hosted Razorpay link — used for Autopay mandate setup. */
  shareUrl: string | null;
  qrData: string | null;
  amount: number;
  currency: string;
  branches: number;
  planCode: string;
  expiresAt: string;
  mode?: "one_time" | "autopay";
  /** One-time pay uses Checkout.js modal instead of a redirect. */
  checkout?: boolean;
  orderId?: string;
  keyId?: string;
  amountPaise?: number;
  chargeId?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
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

  /** one_time = Checkout modal; autopay = hosted UPI mandate link */
  startMandate: (mode: "one_time" | "autopay" = "one_time") =>
    requestService.post<MandateStart, { mode: "one_time" | "autopay" }>(
      API_CONFIG.SUBSCRIPTION.MANDATE,
      { mode },
    ),

  verifyCheckout: (payload: {
    orderId: string;
    paymentId: string;
    signature: string;
    chargeId?: string;
  }) =>
    requestService.post<
      { ok: boolean; handled?: string },
      typeof payload
    >(API_CONFIG.SUBSCRIPTION.VERIFY_CHECKOUT, payload),

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

  submitCustomInquiry: (payload: CustomInquiryPayload) =>
    requestService.post<PlatformInquiry, CustomInquiryPayload>(
      API_CONFIG.SUBSCRIPTION.CUSTOM_INQUIRY,
      payload,
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
  adminEmail?: string | null;
  adminName?: string | null;
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

export type PlatformActivityFeed = {
  enabled: boolean;
  available?: boolean;
  featureUnlocked?: boolean;
  planIncludes?: boolean;
  entitled?: boolean;
  gymEnabled?: boolean;
  retentionDays?: number;
  companyId?: string | null;
  needsGym?: boolean;
  items: Array<{
    id: string;
    companyId: string;
    actorId: string | null;
    actorName: string;
    actorEmail?: string | null;
    actorRole?: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    summary: string;
    httpMethod?: string | null;
    httpPath?: string | null;
    statusCode?: number | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>;
};

export const platformApi = {
  overview: () =>
    requestService.get<PlatformOverview>(API_CONFIG.PLATFORM.OVERVIEW),

  companies: (status?: string, q?: string) =>
    requestService.get<PlatformCompanyRow[]>(
      API_CONFIG.PLATFORM.COMPANIES,
      {
        ...(status && status !== "ALL" ? { status } : {}),
        ...(q?.trim() ? { q: q.trim() } : {}),
      },
    ),

  companyInvoices: (companyId: string) =>
    requestService.get<PlatformInvoice[]>(
      API_CONFIG.PLATFORM.COMPANY_INVOICES(companyId),
    ),

  extendTrial: (
    companyId: string,
    payload: { days?: number; until?: string } = { days: 7 },
  ) =>
    requestService.post<BillingSnapshot, { days?: number; until?: string }>(
      API_CONFIG.PLATFORM.EXTEND_TRIAL(companyId),
      payload,
    ),

  activity: (companyId?: string, limit = 50) =>
    requestService.get<PlatformActivityFeed>(API_CONFIG.PLATFORM.ACTIVITY, {
      ...(companyId ? { companyId } : {}),
      limit,
    }),


  plans: () => requestService.get<PlatformPlan[]>(API_CONFIG.PLATFORM.PLANS),

  runBilling: () =>
    requestService.post<Record<string, number>, Record<string, never>>(
      API_CONFIG.PLATFORM.RUN_BILLING,
      {},
    ),

  inquiries: (status?: string) =>
    requestService.get<PlatformInquiry[]>(
      API_CONFIG.PLATFORM.INQUIRIES,
      status && status !== "ALL" ? { status } : undefined,
    ),

  updateInquiry: (
    id: string,
    payload: { status: "NEW" | "CONTACTED" | "CLOSED"; adminNotes?: string },
  ) =>
    requestService.patch<PlatformInquiry, typeof payload>(
      API_CONFIG.PLATFORM.INQUIRY(id),
      payload,
    ),
};
