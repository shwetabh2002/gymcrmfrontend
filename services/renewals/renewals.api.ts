import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export type RenewalFollowUpStatus =
  | "PENDING"
  | "CONTACTED"
  | "PROMISED"
  | "RENEWED"
  | "LOST"
  | "SKIPPED";

export type RenewalStatusFilter = RenewalFollowUpStatus | "OPEN" | "ALL";

export interface RenewalQueueItem {
  _id: string;
  memberId: string;
  memberName: string;
  phone: string;
  email: string;
  planId: string;
  planName: string;
  planPrice: number;
  expiryDate: string;
  daysRemaining: number;
  pendingAmount: number;
  paymentStatus: string;
  subscriptionStatus: string;
  renewalFollowUpStatus: RenewalFollowUpStatus;
  lastFollowUpAt?: string | null;
  lastFollowUpByName?: string | null;
  followUpNotes?: string;
  followUpNextActionAt?: string | null;
}

export interface RenewalQueueCounts {
  total: number;
  open: number;
  pending: number;
  contacted: number;
  promised: number;
  renewed: number;
  lost: number;
  skipped: number;
  expiringToday: number;
  expired: number;
  totalPendingAmount: number;
}

export interface RenewalQueueParams {
  withinDays?: number;
  includeExpired?: boolean;
  expiredWithinDays?: number;
  status?: RenewalStatusFilter;
}

export interface UpdateFollowUpPayload {
  renewalFollowUpStatus?: RenewalFollowUpStatus;
  followUpNotes?: string;
  followUpNextActionAt?: string;
}

export const renewalsApi = {
  getQueue: (params?: RenewalQueueParams) =>
    requestService.get<RenewalQueueItem[]>(API_CONFIG.RENEWALS.QUEUE, params),

  getCounts: (params?: { withinDays?: number; expiredWithinDays?: number }) =>
    requestService.get<RenewalQueueCounts>(API_CONFIG.RENEWALS.QUEUE_COUNTS, params),

  updateFollowUp: (subscriptionId: string, payload: UpdateFollowUpPayload) =>
    requestService.patch<RenewalQueueItem>(
      API_CONFIG.RENEWALS.FOLLOW_UP(subscriptionId),
      payload,
    ),
};
