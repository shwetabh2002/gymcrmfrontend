import apiClient from "../apiClient";
import { API_CONFIG } from "@/config/config";

const BASE = API_CONFIG.ATTENDANCE.BASE;

/** Populated employee from GET /attendance */
export interface AttendanceEmployeeRef {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  employeeType?: string;
}

export interface AttendanceRecord {
  _id: string;
  employeeId: string | AttendanceEmployeeRef;
  employeeName: string;
  deviceUserId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  allPunches?: string[];
  status: string;
  workingHours?: number;
  isLate?: boolean;
  remarks?: string;
  deviceSerialNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncEsslPayload {
  from?: string;
  to?: string;
}

export interface SyncEsslResponse {
  success: boolean;
  /** Grep server logs: `[AttendanceFunnel <id>]`. */
  funnelId?: string;
  range: { from: string; to: string };
  linesParsed: number;
  punchesApplied: number;
  skippedOrNoMatch: number;
  sampleErrors: string[];
  hint?: string;
  /** Set when 0 lines parsed — trimmed SOAP body for debugging. */
  responseXmlPreview?: string;
}

export interface EsslStatusResponse {
  ready: boolean;
  source?: "soap" | "sql";
  missingEnvVars: string[];
  missingSqlEnvVars?: string[];
  webApiHost: string | null;
  sqlHost?: string | null;
  sqlDatabase?: string | null;
}

export interface CrmDiagnostics {
  totalAttendance: number;
  forMonth: { month: string; count: number } | null;
  employees: { total: number; withDeviceUserId: number };
  deviceUserMapping: { name: string; employeeId: string; deviceUserId: string }[];
  essl: EsslStatusResponse;
  esslAsmxReachable: { ok: boolean; status?: number; detail: string };
  issues: string[];
  flow: string[];
}

export interface EsslProbeResult {
  ok: boolean;
  error?: string;
  funnelId?: string;
  from: string;
  to: string;
  linesParsed: number;
  sampleLines: string[];
  xmlLength: number;
  responseXmlPreview?: string;
}

export const attendanceApi = {
  list: (params?: { month?: string; startDate?: string; endDate?: string }) =>
    apiClient.get<AttendanceRecord[]>(BASE, { params }),

  esslStatus: () =>
    apiClient.get<EsslStatusResponse>(API_CONFIG.ATTENDANCE.ESSL_STATUS),

  /** Today’s rows — use with refetchInterval for near–real-time UI */
  today: () => apiClient.get<AttendanceRecord[]>(API_CONFIG.ATTENDANCE.TODAY),

  diagnostics: (month?: string) =>
    apiClient.get<CrmDiagnostics>(API_CONFIG.ATTENDANCE.DIAGNOSTICS, {
      params: month ? { month } : undefined,
    }),

  esslProbe: (from?: string, to?: string) =>
    apiClient.get<EsslProbeResult>(API_CONFIG.ATTENDANCE.ESSL_PROBE, {
      params:
        from && to
          ? { from, to }
          : from
            ? { from }
            : to
              ? { to }
              : undefined,
      timeout: 130_000,
    }),

  syncEssl: (payload?: SyncEsslPayload) =>
    apiClient.post<SyncEsslResponse>(
      API_CONFIG.ATTENDANCE.SYNC_ESSL,
      payload ?? {},
      { timeout: 130_000 },
    ),
};
