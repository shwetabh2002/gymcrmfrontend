import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export type WhatsAppStatus = {
  connected: boolean;
  status: string;
  authMode: string | null;
  displayName: string | null;
  phoneNumberId: string | null;
  paymentTemplate: string | null;
  connectedAt: string | null;
  mockAvailable: boolean;
  /** True only when messages leave on their own (Cloud API / mock). */
  autoSendReady: boolean;
  /** True for click-to-chat: connected, but staff must press Send. */
  manualSendOnly?: boolean;
  /** The gym's own WhatsApp number, as shown to members. */
  senderNumber?: string | null;
};

export const whatsappApi = {
  getStatus: () =>
    requestService.get<WhatsAppStatus>(API_CONFIG.WHATSAPP.STATUS),

  connectMock: () =>
    requestService.post<WhatsAppStatus, Record<string, never>>(
      API_CONFIG.WHATSAPP.MOCK,
      {},
    ),

  /** Gym's own number, staff taps Send — no Meta setup needed. */
  connectClickToChat: (senderNumber: string) =>
    requestService.post<WhatsAppStatus, { senderNumber: string }>(
      API_CONFIG.WHATSAPP.CLICK_TO_CHAT,
      { senderNumber },
    ),

  connectCloud: (payload: {
    cloudToken: string;
    phoneNumberId: string;
    paymentTemplate: string;
    templateLanguage?: string;
    displayName?: string;
    senderNumber?: string;
  }) =>
    requestService.post<WhatsAppStatus, typeof payload>(
      API_CONFIG.WHATSAPP.CLOUD,
      payload,
    ),

  disconnect: () =>
    requestService.post<{ ok: boolean }, Record<string, never>>(
      API_CONFIG.WHATSAPP.DISCONNECT,
      {},
    ),
};
