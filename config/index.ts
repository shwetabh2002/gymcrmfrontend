// Validate required env variables
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in environment variables");
}


export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
};

export { UPLOAD_CONFIG, UPLOAD_MAX_FILE_BYTES, UPLOAD_ACCEPT } from "./upload";
export type { UploadLimits } from "./upload";
export {
  INVOICE_LAYOUTS,
  INVOICE_LAYOUT_LABELS,
  INVOICE_STAMP_ALIGNS,
  INVOICE_STAMP_ALIGN_LABELS,
  DEFAULT_INVOICE_DISPLAY,
} from "./invoice";
export type {
  InvoiceLayout,
  InvoiceStampAlign,
  InvoiceDisplayOptions,
} from "./invoice";
export {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  getCountry,
  formatMoney,
} from "./countries";
export type { CountryConfig } from "./countries";
