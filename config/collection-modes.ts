// @/config/collection-modes — how the front desk collects money per member.
// Mirrors backend src/config/payment-modes.config.ts.

/**
 * Staff chooses per member at onboarding, regardless of whether the gym has
 * Autopay turned ON:
 *   CASH            → manual cash entry
 *   ONLINE          → manual online entry (gym's static QR / UPI / card transfer)
 *   RAZORPAY_SINGLE → Razorpay QR / payment link for ONE-TIME payment (no Autopay mandate)
 *   AUTOPAY         → Razorpay QR / auth link with recurring UPI Autopay mandate
 */
export const COLLECTION_MODES = [
  "CASH",
  "ONLINE",
  "RAZORPAY_SINGLE",
  "AUTOPAY",
] as const;
export type CollectionMode = (typeof COLLECTION_MODES)[number];

export const COLLECTION_MODE_OPTIONS: {
  value: CollectionMode;
  label: string;
  /** True when the amount fields are recorded manually without a Razorpay link. */
  manual: boolean;
}[] = [
  { value: "CASH", label: "Cash", manual: true },
  { value: "ONLINE", label: "Online — Manual Entry", manual: true },
  {
    value: "RAZORPAY_SINGLE",
    label: "Online — Razorpay One-Time (QR / Link, No Autopay)",
    manual: false,
  },
  {
    value: "AUTOPAY",
    label: "UPI Autopay — Recurring Mandate (QR / Link)",
    manual: false,
  },
];

export function isManualMode(mode: string | ""): boolean {
  return mode === "CASH" || mode === "ONLINE";
}

export function isRazorpayCheckoutMode(mode: string | ""): boolean {
  return mode === "RAZORPAY_SINGLE" || mode === "AUTOPAY";
}

/** Ledger mode sent to the API for a manual collection. */
export function ledgerModeFor(mode: CollectionMode): "CASH" | "ONLINE" {
  return mode === "CASH" ? "CASH" : "ONLINE";
}
