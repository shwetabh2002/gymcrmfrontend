import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, CreateInvoicePayload, UpdateInvoicePayload } from "./invoices.api";

export const useInvoices = () =>
  useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.getInvoices });

export const useInvoiceById = (id: string) =>
  useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoicesApi.getInvoiceById(id),
    enabled: !!id,
  });

export const useInvoicesByMember = (memberId: string) =>
  useQuery({
    queryKey: ["invoices", "member", memberId],
    queryFn: () => invoicesApi.getInvoicesByMember(memberId),
    enabled: !!memberId,
  });

export const useInvoicesBySubscription = (subscriptionId: string) =>
  useQuery({
    queryKey: ["invoices", "subscription", subscriptionId],
    queryFn: () => invoicesApi.getInvoicesBySubscription(subscriptionId),
    enabled: !!subscriptionId,
  });

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoicesApi.createInvoice(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInvoicePayload }) =>
      invoicesApi.updateInvoice(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.deleteInvoice(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoices"] }); },
  });
};