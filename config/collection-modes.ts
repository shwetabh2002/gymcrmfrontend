// @/config/collection-modes — how the front desk collects money.
// Mirrors backend src/config/payment-modes.config.ts.

/**
 * CASH / ONLINE are manual-fill: staff types what was received.
 * AUTOPAY takes no amount by hand — a mandate link goes to the member and every
 * later renewal is debited automatically.
 */
export const COLLECTION_MODES = ["CASH", "ONLINE", "AUTOPAY"] as const;
export type CollectionMode = (typeof COLLECTION_MODES)[number];

export const COLLECTION_MODE_OPTIONS: {
  value: CollectionMode;
  label: string;
  /** True when the amount fields are filled in by hand. */
  manual: boolean;
}[] = [
  { value: "CASH", label: "Cash", manual: true },
  { value: "ONLINE", label: "Online (manual entry)", manual: true },
  { value: "AUTOPAY", label: "UPI Autopay (mandate)", manual: false },
];

export function isManualMode(mode: string | ""): boolean {
  return mode === "CASH" || mode === "ONLINE";
}

/** Ledger mode sent to the API for a manual collection. */
export function ledgerModeFor(mode: CollectionMode): "CASH" | "ONLINE" {
  return mode === "CASH" ? "CASH" : "ONLINE";
}
