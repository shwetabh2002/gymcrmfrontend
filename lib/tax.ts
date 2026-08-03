/**
 * GST / tax — keep in sync with backend `src/invoices/tax.util.ts`.
 */
export const INVOICE_TAX_MODES = ["excluded", "included"] as const;
export type InvoiceTaxMode = (typeof INVOICE_TAX_MODES)[number];

export const INVOICE_TAX_MODE_LABELS: Record<InvoiceTaxMode, string> = {
  excluded: "GST excluded — add on top of plan price",
  included: "GST included — extract from plan price",
};

export type TaxBreakdown = {
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  taxMode: InvoiceTaxMode;
};

export type TaxSettingsLike = {
  invoiceTaxPercentage?: number | null;
  invoiceTaxMode?: string | null;
} | null | undefined;

function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function isInvoiceTaxMode(v: unknown): v is InvoiceTaxMode {
  return (
    typeof v === "string" &&
    (INVOICE_TAX_MODES as readonly string[]).includes(v)
  );
}

export function resolveInvoiceTax(settings?: TaxSettingsLike): {
  taxPercentage: number;
  taxMode: InvoiceTaxMode;
} {
  const taxPercentage =
    typeof settings?.invoiceTaxPercentage === "number"
      ? settings.invoiceTaxPercentage
      : 0;
  const taxMode = isInvoiceTaxMode(settings?.invoiceTaxMode)
    ? settings.invoiceTaxMode
    : "excluded";
  return { taxPercentage, taxMode };
}

export function computeTaxBreakdown(
  priceConfigured: number,
  taxPercentage: number,
  taxMode: InvoiceTaxMode = "excluded",
): TaxBreakdown {
  const price = Math.max(0, Number(priceConfigured) || 0);
  const rate = Math.max(0, Number(taxPercentage) || 0);

  if (rate <= 0 || price <= 0) {
    return {
      subtotal: roundMoney(price),
      taxPercentage: rate,
      taxAmount: 0,
      totalAmount: roundMoney(price),
      taxMode,
    };
  }

  if (taxMode === "included") {
    const totalAmount = roundMoney(price);
    const taxAmount = roundMoney((price * rate) / (100 + rate));
    const subtotal = roundMoney(totalAmount - taxAmount);
    return {
      subtotal,
      taxPercentage: rate,
      taxAmount,
      totalAmount,
      taxMode,
    };
  }

  const subtotal = roundMoney(price);
  const taxAmount = roundMoney((subtotal * rate) / 100);
  const totalAmount = roundMoney(subtotal + taxAmount);
  return {
    subtotal,
    taxPercentage: rate,
    taxAmount,
    totalAmount,
    taxMode,
  };
}

export function formatInr(amount: number): string {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

/**
 * Ledger/base amount with GST-inclusive total in brackets when GST is excluded.
 * - excluded + 18%: primary `₹1,000`, note `₹1,180 incl. GST`
 * - included: primary amount, note `incl. GST`
 * - no tax: primary only
 */
export function formatAmountWithGst(
  amount: number | null | undefined,
  taxPercentage: number,
  taxMode: InvoiceTaxMode,
  empty = "—",
): { primary: string; gstNote: string | null } {
  if (amount === undefined || amount === null) {
    return { primary: empty, gstNote: null };
  }
  const primary = formatInr(amount);
  if (taxPercentage <= 0 || amount <= 0) {
    return { primary, gstNote: null };
  }
  if (taxMode === "included") {
    return { primary, gstNote: "incl. GST" };
  }
  const { totalAmount } = computeTaxBreakdown(
    amount,
    taxPercentage,
    "excluded",
  );
  if (totalAmount === amount) return { primary, gstNote: null };
  return {
    primary,
    gstNote: `${formatInr(totalAmount)} incl. GST`,
  };
}

export function formatAmountWithGstInline(
  amount: number | null | undefined,
  taxPercentage: number,
  taxMode: InvoiceTaxMode,
  empty = "—",
): string {
  const { primary, gstNote } = formatAmountWithGst(
    amount,
    taxPercentage,
    taxMode,
    empty,
  );
  if (!gstNote) return primary;
  return `${primary} (${gstNote})`;
}
