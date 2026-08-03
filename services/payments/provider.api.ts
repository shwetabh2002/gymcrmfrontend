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
