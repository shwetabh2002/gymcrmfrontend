/**
 * Supported launch countries — keep in sync with backend `src/config/countries.config.ts`.
 * Add a country here (+ backend) when launching a new market.
 */
export type CountryConfig = {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  phoneDialCode: string;
};

export const COUNTRIES: CountryConfig[] = [
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
    locale: "en-IN",
    phoneDialCode: "+91",
  },
  // {
  //   code: "AE",
  //   name: "United Arab Emirates",
  //   currency: "AED",
  //   currencySymbol: "AED",
  //   locale: "en-AE",
  //   phoneDialCode: "+971",
  // },
  // {
  //   code: "US",
  //   name: "United States",
  //   currency: "USD",
  //   currencySymbol: "$",
  //   locale: "en-US",
  //   phoneDialCode: "+1",
  // },
  // {
  //   code: "GB",
  //   name: "United Kingdom",
  //   currency: "GBP",
  //   currencySymbol: "£",
  //   locale: "en-GB",
  //   phoneDialCode: "+44",
  // },
  // {
  //   code: "SG",
  //   name: "Singapore",
  //   currency: "SGD",
  //   currencySymbol: "S$",
  //   locale: "en-SG",
  //   phoneDialCode: "+65",
  // },
  // {
  //   code: "AU",
  //   name: "Australia",
  //   currency: "AUD",
  //   currencySymbol: "A$",
  //   locale: "en-AU",
  //   phoneDialCode: "+61",
  // },
];

export const DEFAULT_COUNTRY_CODE = "IN";

const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code?: string | null): CountryConfig {
  const key = (code || DEFAULT_COUNTRY_CODE).toUpperCase();
  return byCode.get(key) || byCode.get(DEFAULT_COUNTRY_CODE)!;
}

export function formatMoney(
  amount: number,
  countryCode?: string | null,
): string {
  const c = getCountry(countryCode);
  try {
    return new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: c.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${c.currencySymbol}${amount.toLocaleString(c.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
