import {
  downloadPlatformInvoicePdf,
  type PlatformInvoicePdfData,
} from "@/lib/platformInvoicePdf";
import type { PlatformInvoice } from "@/services/subscription/subscription.api";

export function invoiceToPdfData(
  inv: PlatformInvoice,
  fallbackBillTo?: PlatformInvoicePdfData["billTo"],
): PlatformInvoicePdfData {
  return {
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.paidAt || inv.periodStart,
    planCode: inv.planCode,
    branches: inv.branches,
    periodStart: inv.periodStart,
    periodEnd: inv.periodEnd,
    subtotal: inv.subtotal,
    taxPercentage: inv.taxPercentage ?? 0,
    taxAmount: inv.taxAmount,
    totalAmount: inv.totalAmount,
    currency: inv.currency,
    payMode: inv.payMode,
    paymentMethod: inv.paymentMethod,
    paymentInstrument: inv.paymentInstrument,
    razorpayPaymentId: inv.razorpayPaymentId,
    razorpayOrderId: inv.razorpayOrderId,
    billTo: inv.billTo ||
      fallbackBillTo || {
        name: "Gym",
      },
    issuer: {
      name: "GymFlow",
      legalLine: "Platform subscription tax invoice",
    },
  };
}

export function downloadPaidPlatformInvoice(
  inv: PlatformInvoice,
  fallbackBillTo?: PlatformInvoicePdfData["billTo"],
) {
  if (inv.status !== "PAID") {
    throw new Error("Only paid invoices can be downloaded");
  }
  downloadPlatformInvoicePdf(invoiceToPdfData(inv, fallbackBillTo));
}
