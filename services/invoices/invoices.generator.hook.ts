import { useState, useCallback } from "react";
import { InvoiceGeneratorData } from "@/app/(app)/invoices/InvoiceGeneratorModal";

export function useInvoiceGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceGeneratorData | null>(
    null,
  );

  const openGenerator = useCallback((data: Partial<InvoiceGeneratorData>) => {
    setInvoiceData({
      invoiceNumber: data.invoiceNumber ?? "",
      invoiceDate: data.invoiceDate ?? new Date().toISOString(),
      dueDate: data.dueDate,
      memberId: data.memberId ?? "",
      memberName: data.memberName ?? "",
      memberContact: data.memberContact ?? "",
      memberInstagram: data.memberInstagram,
      items: data.items ?? [],
      subtotal: data.subtotal ?? 0,
      taxPercentage: data.taxPercentage ?? 0,
      taxAmount: data.taxAmount ?? 0,
      totalAmount: data.totalAmount ?? 0,
      notes: data.notes,
      // Branding is applied by InvoiceTemplate via BrandingContext
      // Location overrides (address / phone / branch) when present
      gymName: data.gymName,
      gymAddress: data.gymAddress,
      gymEmail: data.gymEmail,
      gymPhone: data.gymPhone,
      locationName: data.locationName,
      taxMode: data.taxMode,
      layout: data.layout,
      showLogo: data.showLogo,
      showStamp: data.showStamp,
      showGstin: data.showGstin,
      showAddress: data.showAddress,
      showContact: data.showContact,
    });
    setIsOpen(true);
  }, []);

  const closeGenerator = useCallback(() => {
    setIsOpen(false);
    setInvoiceData(null);
  }, []);

  return {
    isOpen,
    invoiceData,
    openGenerator,
    closeGenerator,
  };
}
