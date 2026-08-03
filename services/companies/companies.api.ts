import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";
import type { AdminLoginResponse } from "../admin/admin.api";

export interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  source: string;
  phone?: string | null;
  city?: string | null;
  countryCode?: string;
  countryName?: string;
  currency?: string;
  memberIdPrefix?: string;
  ownerUserId?: string | null;
  createdAt?: string;
}

export interface ManualOnboardPayload {
  gymName: string;
  phone?: string;
  city?: string;
  countryCode?: string;
  memberIdPrefix?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export const companiesApi = {
  list: () => requestService.get<CompanyRow[]>(API_CONFIG.COMPANIES.BASE),

  onboard: (payload: ManualOnboardPayload) =>
    requestService.post(API_CONFIG.COMPANIES.ONBOARD, payload),

  select: (id: string) =>
    requestService.post<AdminLoginResponse, Record<string, never>>(
      API_CONFIG.COMPANIES.SELECT(id),
      {},
    ),

  clearActive: () =>
    requestService.post<AdminLoginResponse, Record<string, never>>(
      API_CONFIG.COMPANIES.CLEAR_ACTIVE,
      {},
    ),
};
