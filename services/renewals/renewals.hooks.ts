import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  renewalsApi,
  RenewalQueueParams,
  UpdateFollowUpPayload,
} from "./renewals.api";

export const useRenewalQueue = (params?: RenewalQueueParams) =>
  useQuery({
    queryKey: ["renewals", "queue", params ?? {}],
    queryFn: () => renewalsApi.getQueue(params),
  });

export const useRenewalCounts = (params?: {
  withinDays?: number;
  expiredWithinDays?: number;
}) =>
  useQuery({
    queryKey: ["renewals", "counts", params ?? {}],
    queryFn: () => renewalsApi.getCounts(params),
  });

export const useUpdateFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subscriptionId,
      payload,
    }: {
      subscriptionId: string;
      payload: UpdateFollowUpPayload;
    }) => renewalsApi.updateFollowUp(subscriptionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renewals"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["member-subscriptions"] });
    },
  });
};
