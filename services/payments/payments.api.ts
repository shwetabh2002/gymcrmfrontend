import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

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

export const paymentsApi = {
  getPayments: () =>
    requestService.get<Payment[]>(API_CONFIG.PAYMENTS.BASE),

  getPaymentById: (id: string) =>
    requestService.get<Payment>(API_CONFIG.PAYMENTS.BY_ID(id)),

  getPaymentsByMember: (memberId: string) =>
    requestService.get<Payment[]>(API_CONFIG.PAYMENTS.BY_MEMBER(memberId)),

  getPaymentsBySubscription: (subscriptionId: string) =>
    requestService.get<Payment[]>(API_CONFIG.PAYMENTS.BY_SUBSCRIPTION(subscriptionId)),

  createPayment: (payload: CreatePaymentPayload) =>
    requestService.post<Payment, CreatePaymentPayload>(API_CONFIG.PAYMENTS.BASE, payload),

  updatePayment: (id: string, payload: UpdatePaymentPayload) =>
    requestService.put<Payment, UpdatePaymentPayload>(API_CONFIG.PAYMENTS.BY_ID(id), payload),

  deletePayment: (id: string) =>
    requestService.delete<{ message: string }>(API_CONFIG.PAYMENTS.BY_ID(id)),
};