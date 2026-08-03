import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";
import apiClient from "@/services/apiClient";

export type PaymentMode = "CASH" | "CARD" | "ONLINE" | "UPI" | "BANK_TRANSFER";

export interface Payment {
  _id: string;
  subscriptionId: string | {
    _id: string;
    planPrice: number;
    totalPaid: number;
    paymentStatus: string;
  };
  memberId: string | {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  paymentMode: PaymentMode;
  paymentDate: string;
  transactionId?: string;
  notes?: string;
  proofUrl?: string | null;
  receivedBy?: string | { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentPayload {
  subscriptionId: string;
  memberId: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentDate: string;
  transactionId?: string;
  notes?: string;
}

export interface UpdatePaymentPayload {
  amount?: number;
  paymentMode?: PaymentMode;
  paymentDate?: string;
  transactionId?: string;
  notes?: string;
}

async function postMultipartPaymentProof(
  id: string,
  file: File,
): Promise<Payment> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<Payment>(
    API_CONFIG.PAYMENTS.PROOF(id),
    form,
    {
      transformRequest: [
        (body, headers) => {
          if (headers && typeof headers === "object") {
            delete (headers as Record<string, unknown>)["Content-Type"];
          }
          return body;
        },
      ],
    },
  );
  return data;
}

export const paymentsApi = {
  getPayments: () =>
    requestService.get<Payment[]>(API_CONFIG.PAYMENTS.BASE),

  getPaymentById: (id: string) =>
    requestService.get<Payment>(API_CONFIG.PAYMENTS.BY_ID(id)),

  getPaymentsByMember: (memberId: string) =>
    requestService.get<Payment[]>(API_CONFIG.PAYMENTS.BY_MEMBER(memberId)),

  getPaymentsBySubscription: (subscriptionId: string) =>
    requestService.get<Payment[]>(
      API_CONFIG.PAYMENTS.BY_SUBSCRIPTION(subscriptionId),
    ),

  createPayment: (payload: CreatePaymentPayload) =>
    requestService.post<Payment, CreatePaymentPayload>(
      API_CONFIG.PAYMENTS.BASE,
      payload,
    ),

  uploadProof: (id: string, file: File) =>
    postMultipartPaymentProof(id, file),

  updatePayment: (id: string, payload: UpdatePaymentPayload) =>
    requestService.put<Payment, UpdatePaymentPayload>(
      API_CONFIG.PAYMENTS.BY_ID(id),
      payload,
    ),

  deletePayment: (id: string) =>
    requestService.delete<{ message: string }>(API_CONFIG.PAYMENTS.BY_ID(id)),
};
