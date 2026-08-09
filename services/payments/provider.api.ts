import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export type ProviderStatus = {
  connected: boolean;
  status: string;
  authMode: string | null;
  accountName: string | null;
  razorpayAccountId: string | null;
  connectedAt: string | null;
  partnerOAuthAvailable: boolean;
  mockAvailable: boolean;
  /** development | production — decides whether Mock is offered at all. */
  environment?: string;
  /** URL the gym pastes into its own Razorpay dashboard. */
  webhookUrl?: string;
  webhookEvents?: string[];
  webhookSecretSet?: boolean;
  /** True for OAuth gyms — the partner-level webhook covers them. */
  webhookOwnedByPlatform?: boolean;
  /** Real UPI Autopay mandates need live credentials, not the mock. */
  mandateCapable?: boolean;
};

export type MandateInfo = {
  id: string;
  status: string;
  method: string;
  maxAmount: number | null;
  expireAt: string | null;
  lastChargedAt: string | null;
  nextChargeAt: string | null;
  lastFailureReason: string | null;
  consecutiveFailures: number;
  awaitingConfirmation: boolean;
};

export type AutopayRunSummary = {
  charged: number;
  pending: number;
  failed: number;
  skipped: number;
  examined: number;
  skippedReasons?: Record<string, number>;
  alreadyRunning?: boolean;
};

export type CheckoutSession = {
  sessionId: string;
  status: string;
  draftMemberId: string;
  planId: string;
  amount: number;
  receivedIntent: number;
  enableAutopay: boolean;
  shareUrl: string | null;
  qrData: string | null;
  whatsappUrl: string | null;
  /** wa_me = fallback only; mock/cloud_api = auto-sent to member phone */
  whatsappMode?: "wa_me" | "cloud_api" | "mock";
  whatsappSent?: boolean;
  whatsappToPhone?: string | null;
  emailSent?: boolean;
  emailToAddress?: string | null;
  expiresAt: string;
  failureReason: string | null;
  subscriptionId: string | null;
  paymentId: string | null;
};

export type CreateCheckoutPayload = {
  name: string;
  phone: string;
  planId: string;
  locationId: string;
  amount: number;
  received: number;
  startingDate: string;
  expiryDate?: string;
  registrationDate?: string;
  dob?: string;
  trainingType?: string;
  trainerId?: string;
  salesPersonId?: string;
  enableAutopay?: boolean;
  /** Member email — needed for the email notification to go anywhere. */
  email?: string;
  /** Both default true on the server; untick to skip that channel. */
  sendWhatsApp?: boolean;
  sendEmail?: boolean;
  idempotencyKey?: string;
};

export const paymentProviderApi = {
  getStatus: () =>
    requestService.get<ProviderStatus>(API_CONFIG.PAYMENTS.PROVIDER),

  startOAuth: () =>
    requestService.get<{ authorizeUrl: string; state: string }>(
      API_CONFIG.PAYMENTS.PROVIDER_CONNECT,
    ),

  connectApiKeys: (payload: {
    keyId: string;
    keySecret: string;
    accountName?: string;
  }) =>
    requestService.post<ProviderStatus, typeof payload>(
      API_CONFIG.PAYMENTS.PROVIDER_API_KEYS,
      payload,
    ),

  connectMock: () =>
    requestService.post<ProviderStatus, Record<string, never>>(
      API_CONFIG.PAYMENTS.PROVIDER_MOCK,
      {},
    ),

  disconnect: () =>
    requestService.post<{ ok: boolean }, Record<string, never>>(
      API_CONFIG.PAYMENTS.PROVIDER_DISCONNECT,
      {},
    ),

  /** Signing secret from the gym's own Razorpay dashboard ("" clears it). */
  setWebhookSecret: (secret: string) =>
    requestService.post<ProviderStatus, { secret: string }>(
      API_CONFIG.PAYMENTS.PROVIDER_WEBHOOK_SECRET,
      { secret },
    ),
};

export const autopayApi = {
  run: () =>
    requestService.post<AutopayRunSummary, Record<string, never>>(
      API_CONFIG.PAYMENTS.AUTOPAY_RUN,
      {},
    ),

  getMandate: (subscriptionId: string) =>
    requestService.get<MandateInfo | null>(
      API_CONFIG.PAYMENTS.AUTOPAY_MANDATE(subscriptionId),
    ),

  cancelMandate: (subscriptionId: string) =>
    requestService.post<
      {
        ok: boolean;
        providerCancelled: boolean;
        mandateId: string;
        billingMode: string;
      },
      Record<string, never>
    >(API_CONFIG.PAYMENTS.AUTOPAY_MANDATE_CANCEL(subscriptionId), {}),
};

export const checkoutApi = {
  create: (payload: CreateCheckoutPayload) =>
    requestService.post<CheckoutSession, CreateCheckoutPayload>(
      API_CONFIG.MEMBERS.CHECKOUT,
      payload,
    ),

  get: (sessionId: string) =>
    requestService.get<CheckoutSession>(
      API_CONFIG.MEMBERS.CHECKOUT_BY_ID(sessionId),
    ),

  resend: (sessionId: string) =>
    requestService.post<CheckoutSession, Record<string, never>>(
      API_CONFIG.MEMBERS.CHECKOUT_RESEND(sessionId),
      {},
    ),

  cancel: (sessionId: string) =>
    requestService.post<CheckoutSession, Record<string, never>>(
      API_CONFIG.MEMBERS.CHECKOUT_CANCEL(sessionId),
      {},
    ),
};
