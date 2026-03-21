import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  trainersApi,
  Trainer,
  CreateTrainerPayload,
  UpdateTrainerPayload,
} from "./trainers.api";

const QUERY_KEY = ["trainers"];

export function useTrainers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => trainersApi.getTrainers(),
  });
}

export function useTrainerById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => trainersApi.getTrainerById(id),
    enabled: !!id,
  });
}

export function useActiveTrainers() {
  return useQuery({
    queryKey: [...QUERY_KEY, "active"],
    queryFn: () => trainersApi.getActiveTrainers(),
  });
}

export function useCreateTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTrainerPayload) =>
      trainersApi.createTrainer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTrainerPayload }) =>
      trainersApi.updateTrainer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      trainersApi.deleteTrainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
