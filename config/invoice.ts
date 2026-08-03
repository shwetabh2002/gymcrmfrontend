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
  layout: InvoiceLayout;
  showLogo: boolean;
  showStamp: boolean;
  showGstin: boolean;
  showAddress: boolean;
  showContact: boolean;
  stampAlign: InvoiceStampAlign;
};

export const DEFAULT_INVOICE_DISPLAY: InvoiceDisplayOptions = {
  layout: "classic",
  showLogo: true,
  showStamp: true,
  showGstin: true,
  showAddress: true,
  showContact: true,
  stampAlign: "right",
};

export function isInvoiceStampAlign(v: unknown): v is InvoiceStampAlign {
  return (
    typeof v === "string" &&
    (INVOICE_STAMP_ALIGNS as readonly string[]).includes(v)
  );
}
