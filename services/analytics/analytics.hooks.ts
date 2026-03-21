import { useQuery } from "@tanstack/react-query";
import { analyticsApi, DashboardFilters } from "./analytics.api";

export const useDashboard = (filters?: DashboardFilters) =>
  useQuery({
    queryKey: ["analytics", "dashboard", filters],
    queryFn: () => analyticsApi.getDashboard(filters),
    refetchInterval: 60_000, // auto-refresh every 60s
  });

export const useMemberAnalytics = () =>
  useQuery({
    queryKey: ["analytics", "members"],
    queryFn: analyticsApi.getMemberAnalytics,
  });

export const useRevenueAnalytics = () =>
  useQuery({
    queryKey: ["analytics", "revenue"],
    queryFn: analyticsApi.getRevenueAnalytics,
  });

export const useSubscriptionAnalytics = () =>
  useQuery({
    queryKey: ["analytics", "subscriptions"],
    queryFn: analyticsApi.getSubscriptionAnalytics,
  });

export const usePaymentTrends = () =>
  useQuery({
    queryKey: ["analytics", "payment-trends"],
    queryFn: analyticsApi.getPaymentTrends,
  });

export const useExpiringIn7Days = () =>
  useQuery({
    queryKey: ["analytics", "expiring-in-7-days"],
    queryFn: analyticsApi.getExpiringIn7Days,
    refetchInterval: 300_000, // auto-refresh every 5 minutes
  });

export const usePaymentUpdates = () =>
  useQuery({
    queryKey: ["analytics", "payment-updates"],
    queryFn: analyticsApi.getPaymentUpdates,
    refetchInterval: 60_000, // auto-refresh every 60s
  });