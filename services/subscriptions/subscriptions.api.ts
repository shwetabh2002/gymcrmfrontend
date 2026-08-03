import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";
import { Plan } from "@/services/plans/plans.api";
import { Member } from "@/services/members/members.api";
import type { PaymentMode } from "@/services/payments/payments.api";

export type PopulatedPlan = Pick<
  Plan,
  | "_id"
  | "name"
  | "duration"
  | "durationType"
  | "price"
  | "description"
  | "status"
  | "createdAt"
  | "updatedAt"
>;

export interface MemberSubscription {
  _id: string;
  memberId: string | Member;
  planId: string | PopulatedPlan;
  startDate: string;
  expiryDate: string;
  subscriptionStatus: "ACTIVE" | "EXPIRED" | "CANCELLED";
  planPrice: number;
  totalPaid: number;
  pendingAmount: number;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID";
  initialPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberSubscriptionPayload {
  memberId: string;
  planId: string;
  startDate: string;
  initialPayment?: number;
  paymentMode?: PaymentMode;
  replaceActive?: boolean;
  expiryDate?: string;
}

export interface UpdateMemberSubscriptionPayload {
  startDate?: string;
  expiryDate?: string;
  subscriptionStatus?: "ACTIVE" | "EXPIRED" | "CANCELLED";
  planPrice?: number;
  totalPaid?: number;
  pendingAmount?: number;
  paymentStatus?: "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID";
}

export interface AddPaymentPayload {
  amount: number;
}

export const memberSubscriptionsApi = {
  getMemberSubscriptions: () =>
    requestService.get<MemberSubscription[]>(
      API_CONFIG.MEMBER_SUBSCRIPTIONS.BASE,
    ),

  getMemberSubscriptionById: (id: string) =>
    requestService.get<MemberSubscription>(
      API_CONFIG.MEMBER_SUBSCRIPTIONS.BY_ID(id),
    ),

  getMemberSubscriptionsByMember: (memberId: string) =>
    requestService.get<MemberSubscription[]>(
      API_CONFIG.MEMBER_SUBSCRIPTIONS.BY_MEMBER(memberId),
    ),

  createMemberSubscription: (payload: CreateMemberSubscriptionPayload) =>
    requestService.post<MemberSubscription, CreateMemberSubscriptionPayload>(
      API_CONFIG.MEMBER_SUBSCRIPTIONS.BASE,
      payload,
    ),

  updateMemberSubscription: (
    id: string,
    payload: UpdateMemberSubscriptionPayload,
  ) =>
    requestService.put<MemberSubscription, UpdateMemberSubscriptionPayload>(
      API_CONFIG.MEMBER_SUBSCRIPTIONS.BY_ID(id),
      payload,
    ),

  addPayment: (id: string, payload: AddPaymentPayload) =>
    requestService.post<MemberSubscription, AddPaymentPayload>(
      API_CONFIG.MEMBER_SUBSCRIPTIONS.ADD_PAYMENT(id),
      payload,
    ),

  deleteMemberSubscription: (id: string) =>
    requestService.delete<{ message: string }>(
      API_CONFIG.MEMBER_SUBSCRIPTIONS.BY_ID(id),
    ),
};
