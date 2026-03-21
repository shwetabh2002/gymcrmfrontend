import { useQuery } from "@tanstack/react-query";
import { invoicesApi, PaymentsResponse, GetPaymentsParams } from "./invoices.api";

// Payments with server-side pagination + search
export const useAllPayments = (params?: GetPaymentsParams) =>
  useQuery({
    queryKey: ["payments", "all", params],
    queryFn: () => invoicesApi.getAllPayments(params),
    // Return the full response so the page can access both data and pagination
  });

export const usePaymentsByMember = (memberId: string) =>
  useQuery({
    queryKey: ["payments", "member", memberId],
    queryFn: () => invoicesApi.getPaymentsByMember(memberId),
    enabled: !!memberId,
    select: (data: PaymentsResponse) => data.data,
  });

export const useAllMembers = () =>
  useQuery({
    queryKey: ["members", "all"],
    queryFn: invoicesApi.getAllMembers,
  });

export const useMemberById = (id: string) =>
  useQuery({
    queryKey: ["members", id],
    queryFn: () => invoicesApi.getMemberById(id),
    enabled: !!id,
  });