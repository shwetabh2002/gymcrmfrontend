import { APP_CONFIG, usingFallbackApiUrl } from "./app.config";

if (usingFallbackApiUrl && typeof window !== "undefined") {
  // A warning, not a throw: a missing env var must not break the whole app.
  console.warn(
    `NEXT_PUBLIC_API_BASE_URL is not set — falling back to ${APP_CONFIG.apiBaseUrl}`,
  );
}

/** @deprecated prefer APP_CONFIG — kept so existing imports keep working. */
export const config = {
  apiBaseUrl: APP_CONFIG.apiBaseUrl,
};

export {
  APP_CONFIG,
  HTTP_CONFIG,
  QUERY_CONFIG,
  TOAST_CONFIG,
} from "./app.config";
export {
  EASE_OUT_EXPO,
  MOTION_DURATION,
  MODAL_TRANSITION,
  PANEL_TRANSITION,
  PAGE_TRANSITION,
  STAGGER_STEP,
  staggered,
} from "./motion";

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
