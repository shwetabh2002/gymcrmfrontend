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
  const discount = member?.discount ?? 0;

  // Use original amount from member if available, otherwise use payment amount
  // member.amount = original amount before discount
  // payment.amount = final amount after discount
  const originalAmount = member?.amount ?? payment.amount;
  const finalAmount = payment.amount; // This is already discounted

  return {
    invoiceNumber: `INV-${payment._id.slice(-6).toUpperCase()}`,
    invoiceDate: payment.paymentDate || new Date().toISOString().split("T")[0],
    memberId: member?._id ?? "",
    memberName: member?.name ?? "Unknown Member",
    memberContact: contact,
    memberInstagram: member?.instagramHandle,
    membershipPlan: member?.membershipPlan ||
      (member?.membershipMonths ? `${member.membershipMonths} Month${member.membershipMonths > 1 ? "s" : ""}` : undefined),
    duration: member?.membershipMonths ? `${member.membershipMonths} Month${member.membershipMonths > 1 ? "s" : ""}` : undefined,
    membershipFee: originalAmount,
    discount: discount > 0 ? discount : undefined,
    discountApprovedBy: member?.discountApprovedBy,
    paymentMode: payment.mop as any,
    amountReceived: payment.received,
    amountPending: payment.pending,
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
    subtotal: originalAmount,
    taxPercentage: 0,
    taxAmount: 0,
    totalAmount: finalAmount,
    notes: payment.notes ||
      (discount > 0
        ? `${discount}% discount applied${member?.discountApprovedBy ? ` by ${member.discountApprovedBy}` : ''}`
        : undefined),
    ...GYM_DEFAULTS,
  };
}

/** Build invoice data from a Member record */
export function buildInvoiceFromMember(member: Member): InvoiceGeneratorData {
  const contact =
    member.phone || member.contactNumber || member.email || "";
  const amount = member.amount ?? member.membershipAmount ?? 0;
  const discount = member.discount ?? 0;
  const discountAmount = Math.round((amount * discount / 100) * 100) / 100;
  const amountAfterDiscount = amount - discountAmount;
  const received = member.received ?? 0;
  const pending = member.pending ?? Math.max(0, amountAfterDiscount - received);

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
    membershipPlan: member.membershipPlan ||
      (member.membershipMonths ? `${member.membershipMonths} Month${(member.membershipMonths ?? 1) > 1 ? "s" : ""}` : undefined),
    duration: member.membershipMonths ? `${member.membershipMonths} Month${(member.membershipMonths ?? 1) > 1 ? "s" : ""}` : undefined,
    membershipFee: amount,
    discount: member.discount,
    discountApprovedBy: member.discountApprovedBy,
    paymentMode: member.mop as any,
    amountReceived: received,
    amountPending: pending,
    items,
    subtotal: amount,
    taxPercentage: 0,
    taxAmount: 0,
    totalAmount: amountAfterDiscount,
    notes: member.mop
      ? `Payment via ${member.mop.toUpperCase()}${discount > 0 ? `. ${discount}% discount applied${member.discountApprovedBy ? ` by ${member.discountApprovedBy}` : ''}` : ''}`
      : discount > 0
        ? `${discount}% discount applied${member.discountApprovedBy ? ` by ${member.discountApprovedBy}` : ''}`
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