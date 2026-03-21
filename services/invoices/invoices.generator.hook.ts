import { useState, useCallback } from "react";
import { InvoiceGeneratorData } from "@/app/(app)/invoices/InvoiceGeneratorModal";
import { PaymentRecord } from "@/services/invoices/invoices.api";
import { Member } from "@/services/members/members.api";

const GYM_DEFAULTS = {
  gymName: "Dalyfstyle Fitness",
  gymAddress: "123 Fitness St, City",
  gymEmail: "admin@gym.com",
  gymPhone: "+91 1234567890",
};

/** Build invoice data from a PaymentRecord (populated memberId object) */
export function buildInvoiceFromPayment(payment: PaymentRecord): InvoiceGeneratorData {
  const member = payment.memberId;
  const contact = member?.phone || member?.email || "";

  return {
    invoiceNumber: `INV-${payment._id.slice(-6).toUpperCase()}`,
    invoiceDate: payment.paymentDate || new Date().toISOString().split("T")[0],
    memberId: member?._id ?? "",
    memberName: member?.name ?? "Unknown Member",
    memberContact: contact,
    items: [
      {
        description: `Gym Payment — ${payment.mop.toUpperCase()}${
          payment.transactionId ? ` (Txn: ${payment.transactionId})` : ""
        }`,
        amount: payment.received,
      },
      ...(payment.pending > 0
        ? [{ description: "Pending Balance", amount: payment.pending }]
        : []),
    ],
    subtotal: payment.amount,
    taxPercentage: 0,
    taxAmount: 0,
    totalAmount: payment.amount,
    notes: payment.notes || undefined,
    ...GYM_DEFAULTS,
  };
}

/** Build invoice data from a Member record */
export function buildInvoiceFromMember(member: Member): InvoiceGeneratorData {
  const contact =
    member.phone || member.contactNumber || member.email || "";
  const amount = member.amount ?? member.membershipAmount ?? 0;
  const received = member.received ?? 0;
  const pending = member.pending ?? Math.max(0, amount - received);

  const items: InvoiceGeneratorData["items"] = [];

  if (member.membershipPlan || member.membershipMonths) {
    items.push({
      description: `Membership — ${
        member.membershipPlan ||
        `${member.membershipMonths} Month${(member.membershipMonths ?? 1) > 1 ? "s" : ""}`
      }`,
      amount: received,
    });
  } else {
    items.push({ description: "Gym Membership", amount: received });
  }

  if (pending > 0) {
    items.push({ description: "Pending Balance", amount: pending });
  }

  return {
    invoiceNumber: `INV-${member._id.slice(-6).toUpperCase()}`,
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: member.expiryDate?.slice(0, 10),
    memberId: member._id,
    memberName: member.name,
    memberContact: contact,
    memberInstagram: member.instagramHandle,
    items,
    subtotal: amount,
    taxPercentage: 0,
    taxAmount: 0,
    totalAmount: amount,
    notes: member.mop
      ? `Payment via ${member.mop.toUpperCase()}`
      : undefined,
    ...GYM_DEFAULTS,
  };
}

export function useInvoiceGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceGeneratorData | null>(null);

  const openFromPayment = useCallback((payment: PaymentRecord) => {
    setInvoiceData(buildInvoiceFromPayment(payment));
    setIsOpen(true);
  }, []);

  const openFromMember = useCallback((member: Member) => {
    setInvoiceData(buildInvoiceFromMember(member));
    setIsOpen(true);
  }, []);

  const openFromData = useCallback((data: InvoiceGeneratorData) => {
    setInvoiceData(data);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInvoiceData(null);
  }, []);

  return { isOpen, invoiceData, openFromPayment, openFromMember, openFromData, close };
}