import jsPDF from "jspdf";

/** Tax invoice for a GymFlow platform subscription charge. */
export type PlatformInvoicePdfData = {
  invoiceNumber: string;
  invoiceDate: string;
  planCode: string;
  planName?: string;
  branches: number;
  periodStart: string;
  periodEnd: string;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  currency?: string;
  payMode?: string | null;
  paymentMethod?: string | null;
  paymentInstrument?: string | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  billTo: {
    name: string;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
  };
  issuer?: {
    name?: string;
    legalLine?: string;
  };
};

function money(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(2)}`;
  }
}

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function downloadPlatformInvoicePdf(data: PlatformInvoicePdfData) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 16;
  let y = margin;

  const issuerName = data.issuer?.name || "GymFlow";
  const currency = data.currency || "INR";

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(issuerName, margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(data.issuer?.legalLine || "Platform subscription tax invoice", margin, y);
  pdf.setTextColor(0);
  y += 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("TAX INVOICE", pageW - margin, margin, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Invoice: ${data.invoiceNumber}`, pageW - margin, margin + 7, {
    align: "right",
  });
  pdf.text(`Date: ${fmtDate(data.invoiceDate)}`, pageW - margin, margin + 12, {
    align: "right",
  });

  y += 4;
  pdf.setDrawColor(210);
  pdf.line(margin, y, pageW - margin, y);
  y += 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Bill to", margin, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(data.billTo.name || "Gym", margin, y);
  y += 5;
  if (data.billTo.email) {
    pdf.text(data.billTo.email, margin, y);
    y += 5;
  }
  if (data.billTo.phone) {
    pdf.text(data.billTo.phone, margin, y);
    y += 5;
  }
  if (data.billTo.city) {
    pdf.text(data.billTo.city, margin, y);
    y += 5;
  }

  y += 6;
  pdf.setFont("helvetica", "bold");
  pdf.text("Subscription", margin, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  const planLabel = data.planName || data.planCode;
  pdf.text(
    `${planLabel} · ${data.branches} branch${data.branches === 1 ? "" : "es"}`,
    margin,
    y,
  );
  y += 5;
  pdf.text(
    `Period: ${fmtDate(data.periodStart)} – ${fmtDate(data.periodEnd)}`,
    margin,
    y,
  );
  y += 5;
  if (data.payMode) {
    pdf.text(
      `Billing: ${data.payMode === "autopay" ? "Autopay" : "One-time"}`,
      margin,
      y,
    );
    y += 5;
  }

  y += 6;
  pdf.setDrawColor(210);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  // Amounts table
  const right = pageW - margin;
  const labelX = margin;
  const valueX = right;

  const row = (label: string, value: string, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.text(label, labelX, y);
    pdf.text(value, valueX, y, { align: "right" });
    y += 6;
  };

  row("Subtotal", money(data.subtotal, currency));
  row(`GST (${data.taxPercentage}%)`, money(data.taxAmount, currency));
  y += 1;
  pdf.setDrawColor(180);
  pdf.line(margin, y, pageW - margin, y);
  y += 7;
  row("Total payable", money(data.totalAmount, currency), true);

  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Payment", margin, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  if (data.razorpayPaymentId) {
    pdf.text(`Payment ID: ${data.razorpayPaymentId}`, margin, y);
    y += 5;
  }
  if (data.razorpayOrderId) {
    pdf.text(`Order ID: ${data.razorpayOrderId}`, margin, y);
    y += 5;
  }
  const methodBits = [data.paymentMethod, data.paymentInstrument]
    .filter(Boolean)
    .join(" · ");
  if (methodBits) {
    pdf.text(`Method: ${methodBits}`, margin, y);
    y += 5;
  }
  pdf.text("Status: PAID", margin, y);
  y += 12;

  pdf.setFontSize(9);
  pdf.setTextColor(110);
  pdf.text(
    "This invoice is for GymFlow platform subscription fees. Keep for your records.",
    margin,
    y,
    { maxWidth: pageW - margin * 2 },
  );

  pdf.save(`platform-invoice-${data.invoiceNumber}.pdf`);
}
