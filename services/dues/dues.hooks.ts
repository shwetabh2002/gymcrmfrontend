import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { duesApi, DuesQueueParams } from "./dues.api";

export function useDuesQueue(params?: DuesQueueParams) {
  return useQuery({
    queryKey: ["dues", "queue", params ?? {}],
    queryFn: () => duesApi.queue(params),
    placeholderData: (prev) => prev,
  });
}

export function useSetDueReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      subscriptionId,
      dueReminderDate,
    }: {
      subscriptionId: string;
      dueReminderDate: string | null;
    }) => duesApi.setReminder(subscriptionId, dueReminderDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dues"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
