import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  memberSubscriptionsApi,
  CreateMemberSubscriptionPayload,
  UpdateMemberSubscriptionPayload,
  AddPaymentPayload,
} from "./subscriptions.api";

// 🔹 Fetch All Member Subscriptions
export const useMemberSubscriptions = () => {
  return useQuery({
    queryKey: ["member-subscriptions"],
    queryFn: memberSubscriptionsApi.getMemberSubscriptions,
  });
};

// 🔹 Fetch Single Member Subscription by subscription ID
export const useMemberSubscriptionById = (id: string) => {
  return useQuery({
    queryKey: ["member-subscriptions", id],
    queryFn: () => memberSubscriptionsApi.getMemberSubscriptionById(id),
    enabled: !!id,
  });
};

// 🔹 Fetch all subscriptions for a specific member
export const useMemberSubscriptionsByMember = (memberId: string) => {
  return useQuery({
    queryKey: ["member-subscriptions", "member", memberId],
    queryFn: () => memberSubscriptionsApi.getMemberSubscriptionsByMember(memberId),
    enabled: !!memberId,
  });
};

// 🔹 Create Member Subscription (assign plan to member)
export const useCreateMemberSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMemberSubscriptionPayload) =>
      memberSubscriptionsApi.createMemberSubscription(payload),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions", "member", memberId] });
      // Invalidate members so currentSubscriptionId refreshes
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

// 🔹 Update Member Subscription (status, dates, etc.)
export const useUpdateMemberSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMemberSubscriptionPayload }) =>
      memberSubscriptionsApi.updateMemberSubscription(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions", id] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

// 🔹 Add Payment to a Subscription
export const useAddSubscriptionPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddPaymentPayload }) =>
      memberSubscriptionsApi.addPayment(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions", id] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

// 🔹 Delete Member Subscription
export const useDeleteMemberSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => memberSubscriptionsApi.deleteMemberSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};