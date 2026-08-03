import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  gymSettingsApi,
  UpdateGymSettingsPayload,
} from "./gym-settings.api";
import { useAuth } from "@/lib/context/AuthContext";

export const useGymSettings = (enabled = true) => {
  const { user } = useAuth();
  const companyId = user?.companyId ?? null;
  return useQuery({
    queryKey: ["gym-settings", companyId],
    queryFn: gymSettingsApi.get,
    enabled: enabled && !!companyId,
    staleTime: 30_000,
  });
};

export const useUpdateGymSettings = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (payload: UpdateGymSettingsPayload) =>
      gymSettingsApi.update(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["gym-settings", user?.companyId] }),
  });
};

export const useUploadGymAsset = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({
      file,
      kind,
    }: {
      file: File;
      kind?: "logo" | "favicon" | "stamp";
    }) => gymSettingsApi.upload(file, kind ?? "logo"),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["gym-settings", user?.companyId] }),
  });
};
