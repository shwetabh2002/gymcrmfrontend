import type { Invoice } from "@/services/invoices/invoices.api";

export type InvoiceLocationInfo = {
  _id: string;
  name: string;
  code?: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
};

/** Prefer invoice's branch details over company-wide invoice settings. */
export function getInvoiceLocation(
  inv: Pick<Invoice, "locationId"> | null | undefined,
): InvoiceLocationInfo | null {
  if (!inv?.locationId || typeof inv.locationId !== "object") return null;
  return inv.locationId;
}

export function buildLocationAddress(
  loc: InvoiceLocationInfo | null | undefined,
): string | undefined {
  if (!loc) return undefined;
  const parts = [loc.address?.trim(), loc.city?.trim()].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

/**
 * Contact overrides from the invoice's location.
 * Layout / stamp design stay on company Gym settings (with live preview).
 */
export function invoiceBrandFromLocation(
  inv: Pick<Invoice, "locationId"> | null | undefined,
): {
  gymAddress?: string;
  gymPhone?: string;
  locationName?: string;
} {
  const loc = getInvoiceLocation(inv);
  if (!loc) return {};

  return {
    gymAddress: buildLocationAddress(loc),
    gymPhone: loc.phone?.trim() || undefined,
    locationName: loc.name?.trim() || undefined,
  };
}
