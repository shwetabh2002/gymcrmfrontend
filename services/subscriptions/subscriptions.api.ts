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
  subscriptionStatus: "ACTIVE" | "EXPIRED" | "ENDED" | "CANCELLED" | "EXPIRING_SOON";
  planPrice: number;
  totalPaid: number;
  pendingAmount: number;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID";
  /** GST snapshot at assignment — later gym settings must not rewrite this cycle */
  taxPercentage?: number | null;
  taxMode?: "included" | "excluded" | string | null;
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
  /** Required when initialPayment < plan price */
  dueReminderDate?: string;
}

export interface UpdateMemberSubscriptionPayload {
  startDate?: string;
  expiryDate?: string;
  subscriptionStatus?: "ACTIVE" | "EXPIRED" | "ENDED" | "CANCELLED" | "EXPIRING_SOON";
  planPrice?: number;
  totalPaid?: number;
  pendingAmount?: number;
  paymentStatus?: "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID";
}

export interface AddPaymentPayload {
  amount: number;
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type SubscriptionListParams = {
  page?: number;
  limit?: number;
  search?: string;
  /** ALL | ACTIVE | EXPIRING_SOON | EXPIRED | ENDED | CANCELLED */
  status?: string;
};

export const memberSubscriptionsApi = {
  /** Unpaged. The server caps this, so prefer the paged call for real lists. */
  getMemberSubscriptions: () =>
    requestService.get<MemberSubscription[]>(
      API_CONFIG.MEMBER_SUBSCRIPTIONS.BASE,
    ),

  /** Server-side paging, search and status filter. */
  getSubscriptionsPaged: (params: SubscriptionListParams) =>
    requestService.get<Paginated<MemberSubscription>>(
      API_CONFIG.MEMBER_SUBSCRIPTIONS.BASE,
      params,
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
