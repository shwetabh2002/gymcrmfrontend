import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, PaymentsResponse } from "./invoices.api";

// Payment-focused hooks (replacing old invoice system)
export const useAllPayments = () =>
  useQuery({
    queryKey: ["payments", "all"],
    queryFn: invoicesApi.getAllPayments,
    select: (data: PaymentsResponse) => data.data,
  });

export const usePaymentsByMember = (memberId: string) =>
  useQuery({
    queryKey: ["payments", "member", memberId],
    queryFn: () => invoicesApi.getPaymentsByMember(memberId),
    enabled: !!memberId,
    select: (data: PaymentsResponse) => data.data,
  });

// Member management hooks for invoice/payment context
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