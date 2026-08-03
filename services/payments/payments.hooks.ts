import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, CreatePaymentPayload, UpdatePaymentPayload } from "./payments.api";

export const usePayments = () =>
  useQuery({ queryKey: ["payments"], queryFn: paymentsApi.getPayments });

export const usePaymentById = (id: string) =>
  useQuery({
    queryKey: ["payments", id],
    queryFn: () => paymentsApi.getPaymentById(id),
    enabled: !!id,
  });

export const usePaymentsByMember = (memberId: string) =>
  useQuery({
    queryKey: ["payments", "member", memberId],
    queryFn: () => paymentsApi.getPaymentsByMember(memberId),
    enabled: !!memberId,
  });

export const usePaymentsBySubscription = (subscriptionId: string) =>
  useQuery({
    queryKey: ["payments", "subscription", subscriptionId],
    queryFn: () => paymentsApi.getPaymentsBySubscription(subscriptionId),
    enabled: !!subscriptionId,
  });

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsApi.createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

export const useUploadPaymentProof = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      paymentsApi.uploadProof(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentPayload }) =>
      paymentsApi.updatePayment(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};
