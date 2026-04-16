import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";
import type { Employee } from "../employees/employees.api";
import type { Member } from "../members/members.api";

/** Row returned by dashboard celebration endpoints (staff or member). */
export type UpcomingCelebrationRow = Employee | Member;

export interface DashboardCounts {
  totalMembers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPendingAmount: number;
  membersNearExpiry: number;
  membersWithPendingPayments: number;
  newMembersThisMonth: number;
  totalDiscountGiven?: number;
  discountedMembersCount?: number;
}

export interface ActiveMember {
  memberName: string;
  email: string;
  phone: string;
  planName: string;
  planPrice: number;
  startDate: string;
  expiryDate: string;
  paymentStatus: string;
  pendingAmount: number;
}

export interface MemberNearExpiry {
  memberName: string;
  email: string;
  phone: string;
  planName: string;
  expiryDate: string;
  daysRemaining: number;
  pendingAmount: number;
  paymentStatus: string;
}

export interface MemberWithPending {
  memberName: string;
  email: string;
  phone: string;
  planName: string;
  planPrice: number;
  totalPaid: number;
  pendingAmount: number;
  paymentStatus: string;
}

export interface RecentPayment {
  memberName: string;
  email: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  transactionId?: string;
}

export interface NewMember {
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
}

export interface DashboardData {
  counts: DashboardCounts;
  activeMembers: ActiveMember[];
  membersNearExpiry: MemberNearExpiry[];
  membersWithPendingPayments: MemberWithPending[];
  recentPayments: RecentPayment[];
  newMembers: NewMember[];
}

export interface MemberAnalytics {
  totalMembers: number;
  membersWithActiveSubscriptions: number;
  membersWithExpiredSubscriptions: number;
  membersWithoutSubscription: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  currentMonth: { revenue: number; payments: number };
  lastMonth: { revenue: number; payments: number };
  pending: { amount: number; subscriptions: number };
  paymentModeBreakdown: { _id: string; total: number; count: number }[];
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  statusBreakdown: { _id: string; count: number }[];
  paymentStatusBreakdown: { _id: string; count: number; totalPending: number }[];
  expiringSoon: {
    count: number;
    list: { memberName: string; email: string; planName: string; expiryDate: string; daysRemaining: number }[];
  };
  expiringInMonth: number;
  popularPlans: { _id: string; planName: string; price: number; activeSubscriptions: number }[];
}

export interface PaymentTrends {
  monthlyTrends: { revenue: number; payments: number; year: number; month: number }[];
}

export interface MemberExpiringIn7Days {
  memberName: string;
  email: string;
  phone: string;
  planName: string;
  expiryDate: string;
  daysRemaining: number;
  pendingAmount: number;
  paymentStatus: string;
  flow: string;
}

export interface ExpiringIn7DaysData {
  count: number;
  members: MemberExpiringIn7Days[];
}

export interface PaymentUpdate {
  memberName: string;
  email: string;
  phone: string;
  amount: number;
  received?: number;
  pending?: number;
  paymentMode: string;
  paymentDate: string;
  transactionId?: string;
  notes?: string;
  createdAt: string;
  flow: string;
}

export interface PaymentUpdatesData {
  count: number;
  payments: PaymentUpdate[];
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
}

export const analyticsApi = {
  getDashboard: (filters?: DashboardFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.month) params.append('month', filters.month);
    if (filters?.year) params.append('year', filters.year);
    const queryString = params.toString();
    const url = queryString
      ? `${API_CONFIG.ANALYTICS.DASHBOARD}?${queryString}`
      : API_CONFIG.ANALYTICS.DASHBOARD;
    return requestService.get<DashboardData>(url);
  },

  getMemberAnalytics: () =>
    requestService.get<MemberAnalytics>(API_CONFIG.ANALYTICS.MEMBERS),

  getRevenueAnalytics: () =>
    requestService.get<RevenueAnalytics>(API_CONFIG.ANALYTICS.REVENUE),

  getSubscriptionAnalytics: () =>
    requestService.get<SubscriptionAnalytics>(API_CONFIG.ANALYTICS.SUBSCRIPTIONS),

  getPaymentTrends: () =>
    requestService.get<PaymentTrends>(API_CONFIG.ANALYTICS.PAYMENT_TRENDS),

  getExpiringIn7Days: () =>
    requestService.get<ExpiringIn7DaysData>(API_CONFIG.ANALYTICS.EXPIRING_IN_7_DAYS),

  getPaymentUpdates: () =>
    requestService.get<PaymentUpdatesData>(API_CONFIG.ANALYTICS.PAYMENT_UPDATES),

  getUpcomingBirthdays: () =>
    requestService.get<UpcomingCelebrationRow[]>(
      API_CONFIG.ANALYTICS.UPCOMING_BIRTHDAYS,
    ),

  getUpcomingAnniversaries: () =>
    requestService.get<UpcomingCelebrationRow[]>(
      API_CONFIG.ANALYTICS.UPCOMING_ANNIVERSARIES,
    ),
};