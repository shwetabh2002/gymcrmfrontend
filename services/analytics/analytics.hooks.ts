import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "./analytics.api";

export const useDashboard = () =>
  useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: analyticsApi.getDashboard,
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