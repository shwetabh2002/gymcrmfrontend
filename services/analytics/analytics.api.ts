import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export interface DashboardCounts {
  totalMembers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPendingAmount: number;
  membersNearExpiry: number;
  membersWithPendingPayments: number;
  newMembersThisMonth: number;
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

export const analyticsApi = {
  getDashboard: () =>
    requestService.get<DashboardData>(API_CONFIG.ANALYTICS.DASHBOARD),

  getMemberAnalytics: () =>
    requestService.get<MemberAnalytics>(API_CONFIG.ANALYTICS.MEMBERS),

  getRevenueAnalytics: () =>
    requestService.get<RevenueAnalytics>(API_CONFIG.ANALYTICS.REVENUE),

  getSubscriptionAnalytics: () =>
    requestService.get<SubscriptionAnalytics>(API_CONFIG.ANALYTICS.SUBSCRIPTIONS),

  getPaymentTrends: () =>
    requestService.get<PaymentTrends>(API_CONFIG.ANALYTICS.PAYMENT_TRENDS),
};