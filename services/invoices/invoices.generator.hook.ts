import { useState, useCallback } from "react";
import { InvoiceGeneratorData } from "@/app/(app)/invoices/InvoiceGeneratorModal";

export interface UseInvoiceGeneratorOptions {
  gymName?: string;
  gymAddress?: string;
  gymEmail?: string;
  gymPhone?: string;
}

export function useInvoiceGenerator(options?: UseInvoiceGeneratorOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceGeneratorData | null>(null);

  const openGenerator = useCallback(
    (data: Partial<InvoiceGeneratorData>) => {
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
        gymName: options?.gymName ?? data.gymName ?? "Gym Admin",
        gymAddress: options?.gymAddress ?? data.gymAddress ?? "123 Fitness St, City",
        gymEmail: options?.gymEmail ?? data.gymEmail ?? "admin@gym.com",
        gymPhone: options?.gymPhone ?? data.gymPhone ?? "+1 (555) 123-4567",
      });
      setIsOpen(true);
    },
    [options]
  );

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
