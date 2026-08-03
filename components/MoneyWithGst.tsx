"use client";

import {
  formatAmountWithGst,
  type InvoiceTaxMode,
} from "@/lib/tax";

/** Base amount + muted (₹X incl. GST) when tax is excluded. */
export function MoneyWithGst({
  amount,
  taxPercentage,
  taxMode,
  empty = "—",
  className,
  noteClassName,
}: {
  amount: number | null | undefined;
  taxPercentage: number;
  taxMode: InvoiceTaxMode;
  empty?: string;
  className?: string;
  noteClassName?: string;
}) {
  const { primary, gstNote } = formatAmountWithGst(
    amount,
    taxPercentage,
    taxMode,
    empty,
  );

  return (
    <span className={className} style={{ display: "inline-block", lineHeight: 1.35 }}>
      <span style={{ display: "block" }}>{primary}</span>
      {gstNote ? (
        <span
          className={noteClassName}
          style={{
            display: "block",
            fontSize: "0.92em",
            opacity: 0.72,
            whiteSpace: "nowrap",
          }}
        >
          ({gstNote})
        </span>
      ) : null}
    </span>
  );
}
