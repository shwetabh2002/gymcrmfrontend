import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";
import type { AdminLoginResponse } from "../admin/admin.api";
import type { InvoiceLayout } from "@/config/invoice";

export interface LocationRow {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  status: "ACTIVE" | "INACTIVE" | string;
  isDefault: boolean;
  /** null = inherit company GymSettings design */
  invoiceLayout?: InvoiceLayout | null;
  invoiceShowLogo?: boolean | null;
  invoiceShowStamp?: boolean | null;
  invoiceShowGstin?: boolean | null;
  invoiceShowAddress?: boolean | null;
  invoiceShowContact?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLocationPayload {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  isDefault?: boolean;
  invoiceLayout?: InvoiceLayout;
  invoiceShowLogo?: boolean;
  invoiceShowStamp?: boolean;
  invoiceShowGstin?: boolean;
  invoiceShowAddress?: boolean;
  invoiceShowContact?: boolean;
}

export interface UpdateLocationPayload {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  status?: "ACTIVE" | "INACTIVE";
  isDefault?: boolean;
  /** null clears → company default design */
  invoiceLayout?: InvoiceLayout | null;
  invoiceShowLogo?: boolean | null;
  invoiceShowStamp?: boolean | null;
  invoiceShowGstin?: boolean | null;
  invoiceShowAddress?: boolean | null;
  invoiceShowContact?: boolean | null;
}

export const locationsApi = {
  list: () => requestService.get<LocationRow[]>(API_CONFIG.LOCATIONS.BASE),

  create: (payload: CreateLocationPayload) =>
    requestService.post<LocationRow>(API_CONFIG.LOCATIONS.BASE, payload),

  update: (id: string, payload: UpdateLocationPayload) =>
    requestService.put<LocationRow>(API_CONFIG.LOCATIONS.BY_ID(id), payload),

  remove: (id: string) =>
    requestService.delete(API_CONFIG.LOCATIONS.BY_ID(id)),

  select: (id: string) =>
    requestService.post<AdminLoginResponse, Record<string, never>>(
      API_CONFIG.LOCATIONS.SELECT(id),
      {},
    ),

  clearActive: () =>
    requestService.post<AdminLoginResponse, Record<string, never>>(
      API_CONFIG.LOCATIONS.CLEAR_ACTIVE,
      {},
    ),
};
