import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
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

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

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

    // Calculate image dimensions to fit the page
    const imgWidth = pageWidth - 20; // 10mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPosition = 10;

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 10, yPosition, imgWidth, imgHeight);

    // If the image is taller than one page, add additional pages
    let remainingHeight = imgHeight - (pageHeight - yPosition - 10);
    while (remainingHeight > 0) {
      pdf.addPage();
      yPosition = 10;
      pdf.addImage(
        imgData,
        "PNG",
        10,
        yPosition - (imgHeight - remainingHeight),
        imgWidth,
        imgHeight
      );
      remainingHeight -= pageHeight - 20;
    }

    // Save the PDF
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

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };
  } catch (error) {
    console.error("Error printing invoice:", error);
    alert("Failed to print invoice. Please try again.");
  }
};
