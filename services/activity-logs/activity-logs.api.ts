import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export type ActivityLogItem = {
  id: string;
  companyId: string;
  locationId: string | null;
  actorId: string | null;
  actorName: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  httpMethod: string | null;
  httpPath: string | null;
  statusCode: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ActivityLogList = {
  enabled: boolean;
  available: boolean;
  featureUnlocked: boolean;
  planIncludes?: boolean;
  entitled?: boolean;
  gymEnabled?: boolean;
  retentionDays: number;
  total: number;
  items: ActivityLogItem[];
};

export type ActivityAccess = {
  available: boolean;
  globallyEnabled: boolean;
  featureUnlocked: boolean;
  planIncludes: boolean;
  entitled: boolean;
  gymEnabled: boolean;
  retentionDays: number;
};

export const activityLogsApi = {
  list: (params?: {
    q?: string;
    action?: string;
    limit?: number;
    skip?: number;
  }) =>
    requestService.get<ActivityLogList>(API_CONFIG.ACTIVITY_LOGS.BASE, params),

  status: () =>
    requestService.get<ActivityAccess>(API_CONFIG.ACTIVITY_LOGS.STATUS),
};
