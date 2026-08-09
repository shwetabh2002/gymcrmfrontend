// @/lib/invoice-format — presentation helpers for the invoice document.
// Everything here is driven by gym settings or country config; nothing assumes
// a particular gym, currency or tax regime.

import type { CountryConfig } from "@/config/countries";

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const rest = n % 10;
  return rest ? `${tens} ${ONES[rest]}` : tens;
}

/** Indian grouping: crore / lakh / thousand / hundred. */
function indianWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const push = (value: number, label: string) => {
    if (value) parts.push(`${twoDigits(value)} ${label}`.trim());
  };
  push(Math.floor(n / 10000000), "Crore");
  n %= 10000000;
  push(Math.floor(n / 100000), "Lakh");
  n %= 100000;
  push(Math.floor(n / 1000), "Thousand");
  n %= 1000;
  push(Math.floor(n / 100), "Hundred");
  n %= 100;
  if (n) parts.push(twoDigits(n));
  return parts.join(" ");
}

/** International grouping: billion / million / thousand. */
function westernWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const scales: Array<[number, string]> = [
    [1_000_000_000, "Billion"],
    [1_000_000, "Million"],
    [1_000, "Thousand"],
  ];
  for (const [value, label] of scales) {
    const count = Math.floor(n / value);
    if (count) {
      parts.push(`${westernWords(count)} ${label}`);
      n %= value;
    }
  }
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n) parts.push(twoDigits(n));
  return parts.join(" ");
}

/**
 * "Two Thousand Three Hundred Sixty Rupees and Fifty Paise Only".
 *
 * Grouping and the currency/fraction names come from the gym's country, so a
 * non-Indian gym gets "Dollars and Cents" with western grouping.
 */
export function amountInWords(
  amount: number,
  country: Pick<CountryConfig, "code" | "currency">,
): string {
  const value = Math.max(0, Number(amount) || 0);
  const whole = Math.floor(value);
  const fraction = Math.round((value - whole) * 100);

  const names: Record<string, { major: string; minor: string }> = {
    INR: { major: "Rupees", minor: "Paise" },
    USD: { major: "Dollars", minor: "Cents" },
    AED: { major: "Dirhams", minor: "Fils" },
    GBP: { major: "Pounds", minor: "Pence" },
    SGD: { major: "Dollars", minor: "Cents" },
    AUD: { major: "Dollars", minor: "Cents" },
  };
  const unit = names[country.currency] || {
    major: country.currency,
    minor: "",
  };

  const toWords = country.code === "IN" ? indianWords : westernWords;
  const head = `${toWords(whole)} ${unit.major}`;
  const tail =
    fraction > 0 && unit.minor
      ? ` and ${toWords(fraction)} ${unit.minor}`
      : "";
  return `${head}${tail} Only`;
}

export type TaxLine = { label: string; amount: number };

/**
 * Tax rows to print.
 *
 * `split` halves the rate into CGST + SGST, which is what an intra-state Indian
 * invoice must show. `single` keeps one combined line, for IGST or any market
 * without that split. Zero-rated invoices produce no rows at all.
 */
export function buildTaxLines(
  taxAmount: number,
  taxPercentage: number,
  breakup: string | undefined,
  label = "GST",
): TaxLine[] {
  if (!taxPercentage || !taxAmount) return [];
  if (breakup === "single") {
    return [{ label: `I${label} (${taxPercentage}%)`, amount: taxAmount }];
  }
  const half = taxPercentage / 2;
  // Split on the amount too, so the printed halves always add back to the total.
  const first = Math.round((taxAmount / 2) * 100) / 100;
  return [
    { label: `C${label} (${half}%)`, amount: first },
    { label: `S${label} (${half}%)`, amount: taxAmount - first },
  ];
}

/** Badge shown on the document: what has actually been collected. */
export function paymentStatusLabel(input: {
  totalAmount: number;
  amountPaid?: number | null;
}): { label: string; tone: "paid" | "partial" | "due" } {
  const paid = Number(input.amountPaid) || 0;
  if (paid <= 0) return { label: "Unpaid", tone: "due" };
  if (paid + 0.01 >= input.totalAmount) return { label: "Paid", tone: "paid" };
  return { label: "Partially paid", tone: "partial" };
}
