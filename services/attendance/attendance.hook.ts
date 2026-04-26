import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  attendanceApi,
  SyncEsslPayload,
  AttendanceRecord,
  EsslStatusResponse,
  type EsslProbeResult,
  type CrmDiagnostics,
} from "./attendance.api";

const QUERY_KEY = "attendance";

export function useEsslSyncStatus() {
  return useQuery({
    queryKey: [QUERY_KEY, "essl-status"],
    queryFn: async () => {
      const { data } = await attendanceApi.esslStatus();
      return data;
    },
  });
}

/** Polls GET /attendance/today every `intervalMs` when `enabled` (near real-time after device push). */
export function useAttendanceToday(enabled: boolean, intervalMs = 15_000) {
  return useQuery({
    queryKey: [QUERY_KEY, "today"],
    queryFn: async () => {
      const { data } = await attendanceApi.today();
      return data;
    },
    refetchInterval: enabled ? intervalMs : false,
    refetchOnWindowFocus: true,
  });
}

export function useAttendanceList(params?: {
  month?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: [QUERY_KEY, "list", params],
    queryFn: async () => {
      const { data } = await attendanceApi.list(params);
      return data;
    },
  });
}

export function useCrmDiagnostics(month?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, "diagnostics", month],
    queryFn: async () => {
      const { data } = await attendanceApi.diagnostics(month);
      return data;
    },
  });
}

export function useEsslProbe() {
  return useMutation({
    mutationFn: async (range: { from: string; to: string }) => {
      const { data } = await attendanceApi.esslProbe(range.from, range.to);
      return data;
    },
  });
}

export function useSyncEsslAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload?: SyncEsslPayload) => {
      const { data } = await attendanceApi.syncEssl(payload);
      return data;
    },
    onSuccess: (data) => {
      if (data.punchesApplied > 0) {
        toast.success(
          `Sync complete: ${data.punchesApplied} punch(es) saved (${data.linesParsed} line(s) from eSSL).`,
        );
      } else if (data.linesParsed > 0) {
        toast.error(
          `eSSL returned ${data.linesParsed} line(s) but 0 were saved. Map device user IDs in Employees or see the red hint on the page.`,
          { duration: 7000 },
        );
      } else {
        toast(`Sync finished: no log lines in range. ${data.hint ?? ""}`.trim(), {
          icon: "⚠️",
          duration: 6000,
        });
      }
      if (data.hint && data.punchesApplied > 0) {
        toast(data.hint, { icon: "ℹ️", duration: 5000 });
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "diagnostics"] });
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to sync from eSSL";
      toast.error(msg);
    },
  });
}

export type { AttendanceRecord, SyncEsslPayload, EsslStatusResponse, EsslProbeResult, CrmDiagnostics };
