/**
 * Invoice layout options — keep in sync with backend `src/config/invoice.config.ts`.
 */
export const INVOICE_LAYOUTS = ["classic", "modern", "minimal"] as const;
export type InvoiceLayout = (typeof INVOICE_LAYOUTS)[number];

export const INVOICE_LAYOUT_LABELS: Record<InvoiceLayout, string> = {
  classic: "Classic — logo left, title right",
  modern: "Modern — centered brand header",
  minimal: "Minimal — text-first, compact",
};

export const INVOICE_STAMP_ALIGNS = ["left", "center", "right"] as const;
export type InvoiceStampAlign = (typeof INVOICE_STAMP_ALIGNS)[number];

export const INVOICE_STAMP_ALIGN_LABELS: Record<InvoiceStampAlign, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

export type InvoiceDisplayOptions = {
  /** SAC / HSN printed against the line item. */
  sacCode?: string | null;
  /** State whose GST applies. */
  placeOfSupply?: string | null;
  /** split = CGST + SGST, single = one combined tax line. */
  taxBreakup?: string;
  showAmountInWords?: boolean;
  terms?: string | null;
  layout: InvoiceLayout;
  showLogo: boolean;
  showStamp: boolean;
  showGstin: boolean;
  showAddress: boolean;
  showContact: boolean;
  stampAlign: InvoiceStampAlign;
};

/** SAC for gym / fitness services; a gym may override it in Settings. */
export const DEFAULT_SAC_CODE = "999723";

export const DEFAULT_INVOICE_DISPLAY: InvoiceDisplayOptions = {
  layout: "classic",
  showLogo: true,
  showStamp: true,
  showGstin: true,
  showAddress: true,
  showContact: true,
  stampAlign: "right",
  sacCode: DEFAULT_SAC_CODE,
  placeOfSupply: null,
  /** CGST + SGST halves; "single" prints one combined line (IGST). */
  taxBreakup: "split",
  showAmountInWords: true,
  terms: null,
};

export function isInvoiceStampAlign(v: unknown): v is InvoiceStampAlign {
  return (
    typeof v === "string" &&
    (INVOICE_STAMP_ALIGNS as readonly string[]).includes(v)
  );
}
