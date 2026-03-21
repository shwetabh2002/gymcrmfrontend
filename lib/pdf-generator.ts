import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  memberName: string;
  memberContact: string;
  memberInstagram?: string;
  membershipPlan?: string;
  duration?: string;
  membershipFee?: number;
  personalTrainingFee?: number;
  otherCharges?: number;
  paymentMode?: "CASH" | "UPI" | "CARD";
  items: Array<{
    description: string;
    amount: number;
  }>;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  gymName?: string;
  gymAddress?: string;
  gymEmail?: string;
  gymPhone?: string;
  gymGST?: string;
}

export const generateInvoicePDF = async (
  invoiceData: InvoiceData,
  elementId: string = "invoice-template"
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Invoice template element with id "${elementId}" not found`);
    }

    // Hide the print button before capturing
    const printButton = element.querySelector("[data-no-print]");
    const originalDisplay = printButton ? (printButton as HTMLElement).style.display : "";
    if (printButton) {
      (printButton as HTMLElement).style.display = "none";
    }

    // Temporarily reset any scale transform so html2canvas captures full size
    const originalTransform = element.style.transform;
    const originalWidth = element.style.width;
    element.style.transform = "none";
    element.style.width = "100%";

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      // Capture exactly the element's bounding box
      width: element.offsetWidth,
      height: element.offsetHeight,
      windowWidth: element.offsetWidth,
      windowHeight: element.offsetHeight,
    });

    // Restore transform and width
    element.style.transform = originalTransform;
    element.style.width = originalWidth;

    // Restore the print button
    if (printButton) {
      (printButton as HTMLElement).style.display = originalDisplay;
    }

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Stretch image to fill the full A4 page — no margins, no multi-page
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);

    pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
};

export const printInvoice = async (elementId: string = "invoice-template"): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Invoice template element with id "${elementId}" not found`);
    }

    const printWindow = window.open("", "", "height=600,width=800");
    if (!printWindow) {
      throw new Error("Failed to open print window. Please check your popup blocker.");
    }

    printWindow.document.write(element.outerHTML);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
    };
  } catch (error) {
    console.error("Error printing invoice:", error);
    alert("Failed to print invoice. Please try again.");
  }
};