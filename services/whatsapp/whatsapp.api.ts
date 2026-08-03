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
  autoSendReady: boolean;
};

export const whatsappApi = {
  getStatus: () =>
    requestService.get<WhatsAppStatus>(API_CONFIG.WHATSAPP.STATUS),

  connectMock: () =>
    requestService.post<WhatsAppStatus, Record<string, never>>(
      API_CONFIG.WHATSAPP.MOCK,
      {},
    ),

  connectCloud: (payload: {
    cloudToken: string;
    phoneNumberId: string;
    paymentTemplate: string;
    templateLanguage?: string;
    displayName?: string;
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
