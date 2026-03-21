import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  trainingTypesApi,
  TrainingType,
  CreateTrainingTypePayload,
  UpdateTrainingTypePayload,
} from "./training-types.api";

const QUERY_KEY = ["training-types"];

export function useTrainingTypes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => trainingTypesApi.getTrainingTypes(),
  });
}

export function useTrainingTypeById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => trainingTypesApi.getTrainingTypeById(id),
    enabled: !!id,
  });
}

export function useActiveTrainingTypes() {
  return useQuery({
    queryKey: [...QUERY_KEY, "active"],
    queryFn: () => trainingTypesApi.getActiveTrainingTypes(),
  });
}

export function useCreateTrainingType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTrainingTypePayload) =>
      trainingTypesApi.createTrainingType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateTrainingType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTrainingTypePayload }) =>
      trainingTypesApi.updateTrainingType(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteTrainingType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      trainingTypesApi.deleteTrainingType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
