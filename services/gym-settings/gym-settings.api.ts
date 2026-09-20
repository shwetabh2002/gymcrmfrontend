import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";
import apiClient from "@/services/apiClient";
import type { UploadLimits } from "@/lib/upload";
import type { InvoiceLayout } from "@/config/invoice";

export interface GymSettings {
  _id: string;
  companyId: string;
  memberIdPrefix: string;
  gymName?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  stampUrl?: string | null;
  primaryColor?: string;
  invoiceAddress?: string | null;
  invoiceEmail?: string | null;
  invoicePhone?: string | null;
  invoiceGstin?: string | null;
  invoiceFooter?: string | null;
  websiteUrl?: string | null;
  invoiceLayout?: InvoiceLayout;
  invoiceShowLogo?: boolean;
  invoiceShowStamp?: boolean;
  invoiceShowGstin?: boolean;
  invoiceShowAddress?: boolean;
  invoiceShowContact?: boolean;
  invoiceStampAlign?: "left" | "center" | "right";
  invoiceTaxPercentage?: number;
  invoiceTaxMode?: "excluded" | "included";
  /** SAC / HSN printed on the invoice line */
  invoiceSacCode?: string | null;
  /** State whose GST applies */
  invoicePlaceOfSupply?: string | null;
  /** split = CGST + SGST halves, single = one combined line */
  invoiceTaxBreakup?: string;
  invoiceShowAmountInWords?: boolean;
  invoiceTerms?: string | null;
  /** Per-gym UPI Autopay feature flag (default off) */
  autopayEnabled?: boolean;
  /** Mandate method: currently UPI Autopay only */
  autopayMethod?: string;
  /** Per-debit ceiling = plan price × this (headroom for price rises) */
  autopayMandateMultiplier?: number;
  /** How long the mandate stays valid, in months */
  autopayMandateValidityMonths?: number;
  countryCode?: string;
  countryName?: string;
  currency?: string;
  currencySymbol?: string;
  locale?: string;
  upload?: UploadLimits;
  updatedAt?: string;
  createdAt?: string;
}

export interface UpdateGymSettingsPayload {
  memberIdPrefix?: string;
  gymName?: string;
  primaryColor?: string;
  invoiceAddress?: string;
  invoiceEmail?: string;
  invoicePhone?: string;
  invoiceGstin?: string;
  invoiceFooter?: string;
  websiteUrl?: string;
  logoUrl?: string;
  faviconUrl?: string;
  stampUrl?: string;
  invoiceLayout?: InvoiceLayout;
  invoiceShowLogo?: boolean;
  invoiceShowStamp?: boolean;
  invoiceShowGstin?: boolean;
  invoiceShowAddress?: boolean;
  invoiceShowContact?: boolean;
  invoiceStampAlign?: "left" | "center" | "right";
  invoiceTaxPercentage?: number;
  invoiceTaxMode?: "excluded" | "included";
  /** SAC / HSN printed on the invoice line */
  invoiceSacCode?: string | null;
  /** State whose GST applies */
  invoicePlaceOfSupply?: string | null;
  /** split = CGST + SGST halves, single = one combined line */
  invoiceTaxBreakup?: string;
  invoiceShowAmountInWords?: boolean;
  invoiceTerms?: string | null;
  autopayEnabled?: boolean;
  autopayMethod?: string;
  autopayMandateMultiplier?: number;
  autopayMandateValidityMonths?: number;
  countryCode?: string;
}

async function postMultipart<T>(
  url: string,
  file: File,
  params?: Record<string, string>,
): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<T>(url, form, {
    params,
    transformRequest: [
      (body, headers) => {
        if (headers && typeof headers === "object") {
          delete (headers as Record<string, unknown>)["Content-Type"];
        }
        return body;
      },
    ],
  });
  return data;
}

export const gymSettingsApi = {
  get: () => requestService.get<GymSettings>(API_CONFIG.GYM_SETTINGS.BASE),
  update: (payload: UpdateGymSettingsPayload) =>
    requestService.put<GymSettings, UpdateGymSettingsPayload>(
      API_CONFIG.GYM_SETTINGS.BASE,
      payload,
    ),
  upload: (file: File, kind: "logo" | "favicon" | "stamp" = "logo") =>
    postMultipart<GymSettings>(API_CONFIG.GYM_SETTINGS.UPLOAD, file, { kind }),
};
