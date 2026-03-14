import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plansApi, CreatePlanPayload, UpdatePlanPayload } from "./plans.api";

// 🔹 Fetch All Plans
export const usePlans = () => {
  return useQuery({
    queryKey: ["plans"],
    queryFn: plansApi.getPlans,
  });
};

// 🔹 Fetch Single Plan
export const usePlanById = (id: string) => {
  return useQuery({
    queryKey: ["plans", id],
    queryFn: () => plansApi.getPlanById(id),
    enabled: !!id,
  });
};

// 🔹 Create Plan
export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePlanPayload) =>
      plansApi.createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
};

// 🔹 Update Plan
export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePlanPayload }) =>
      plansApi.updatePlan(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans", id] });
    },
  });
};

// 🔹 Delete Plan
export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => plansApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
};
