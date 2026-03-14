# Invoice Generation Tool - Documentation

## Overview

The Invoice Generation Tool allows you to create professional PDF invoices for payments. This system integrates seamlessly with the payments module and provides a complete invoice management solution.

## Features

✅ **PDF Export** - Download invoices as PDF files  
✅ **Print Support** - Print invoices directly from the browser  
✅ **Professional Template** - Clean, modern invoice design  
✅ **Configurable Details** - Include gym info, member details, items, and notes  
✅ **Live Preview** - See invoice before generating PDF  
✅ **Responsive Design** - Works on desktop and mobile devices  

## Components

### 1. **InvoiceTemplate.tsx**
The core invoice template component that renders a professional-looking invoice.

**Props:**
```typescript
interface InvoiceTemplateProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  items: Array<{ description: string; amount: number }>;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  gymName?: string;
  gymAddress?: string;
  gymEmail?: string;
  gymPhone?: string;
  showActions?: boolean;
  onDownloadPDF?: () => void;
  onPrint?: () => void;
}
```

**Usage:**
```tsx
import InvoiceTemplate from "@/app/(app)/invoices/InvoiceTemplate";

export default function MyComponent() {
  return (
    <InvoiceTemplate
      invoiceNumber="INV-20260314-ABC1"
      invoiceDate="2026-03-14"
      memberName="John Doe"
      memberEmail="john@example.com"
      items={[{ description: "Monthly Membership", amount: 5000 }]}
      subtotal={5000}
      taxPercentage={18}
      taxAmount={900}
      totalAmount={5900}
      showActions={true}
    />
  );
}
```

### 2. **InvoiceGeneratorModal.tsx**
A modal dialog that allows users to preview and generate invoices.

**Props:**
```typescript
interface Props {
  open: boolean;
  onClose: () => void;
  invoiceData: InvoiceGeneratorData | null;
}
```

**Usage:**
```tsx
import { useState } from "react";
import InvoiceGeneratorModal from "@/app/(app)/invoices/InvoiceGeneratorModal";

export default function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Generate Invoice</button>
      <InvoiceGeneratorModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        invoiceData={...}
      />
    </>
  );
}
```

### 3. **useInvoiceGenerator Hook**
A custom React hook for managing invoice generator state.

**Usage:**
```tsx
import { useInvoiceGenerator } from "@/services/invoices/invoices.generator.hook";

export default function MyComponent() {
  const { isOpen, invoiceData, openGenerator, closeGenerator } = useInvoiceGenerator({
    gymName: "My Gym",
    gymAddress: "123 Fitness St",
    gymEmail: "contact@mygym.com",
    gymPhone: "+1 (555) 123-4567"
  });

  const handleOpenInvoice = () => {
    openGenerator({
      invoiceNumber: "INV-20260314-ABC1",
      invoiceDate: "2026-03-14",
      memberName: "John Doe",
      memberEmail: "john@example.com",
      items: [{ description: "Payment", amount: 5000 }],
      subtotal: 5000,
      taxPercentage: 0,
      taxAmount: 0,
      totalAmount: 5000,
    });
  };

  return (
    <>
      <button onClick={handleOpenInvoice}>Open Invoice</button>
      <InvoiceGeneratorModal
        open={isOpen}
        onClose={closeGenerator}
        invoiceData={invoiceData}
      />
    </>
  );
}
```

### 4. **PDF Generator Utility**
Utility functions for PDF generation and printing.

**Functions:**

#### `generateInvoicePDF(invoiceData, elementId)`
Generates and downloads a PDF invoice.

```typescript
import { generateInvoicePDF } from "@/lib/pdf-generator";

const handleDownload = async () => {
  await generateInvoicePDF({
    invoiceNumber: "INV-001",
    invoiceDate: "2026-03-14",
    memberName: "John Doe",
    // ... other properties
  });
};
```

#### `printInvoice(elementId)`
Opens print dialog for the invoice.

```typescript
import { printInvoice } from "@/lib/pdf-generator";

const handlePrint = async () => {
  await printInvoice("invoice-template");
};
```

## Integration with Payments Module

The invoice generation is fully integrated with the payments module. Users can:

1. View all payments in the payments table
2. Click the "📄 Invoice" button for any payment
3. See a live preview of the invoice
4. Download as PDF or print

**How the integration works:**

```tsx
// In payments/page.tsx
const handleGenerateInvoice = () => {
  const invoiceNumber = generateInvoiceNumberForPayment(p._id);
  const invoiceData: InvoiceGeneratorData = {
    invoiceNumber,
    invoiceDate: p.paymentDate,
    dueDate: p.paymentDate,
    memberId: typeof p.memberId === "object" ? p.memberId._id : p.memberId,
    memberName: member?.name ?? "Unknown",
    memberEmail: member?.email ?? "unknown@example.com",
    memberPhone: member?.phone,
    items: [
      {
        description: `Payment (${p.paymentMode.replace("_", " ")})${p.transactionId ? ` - ${p.transactionId}` : ""}`,
        amount: p.amount,
      },
    ],
    subtotal: p.amount,
    taxPercentage: 0,
    taxAmount: 0,
    totalAmount: p.amount,
    notes: p.notes || undefined,
  };
  openInvoiceGenerator(invoiceData);
};
```

## Styling

All components use CSS Modules for scoped styling:

- **InvoiceTemplate.module.css** - Invoice template styles
- **InvoiceGeneratorModal.module.css** - Modal dialog styles
- **Payments.module.css** - Integration styles (shared)

## Invoice Number Generation

Invoice numbers follow this format:
```
INV-YYYYMMDD-XXXX
```

Where:
- `YYYY` = Year
- `MM` = Month
- `DD` = Day
- `XXXX` = Last 4 characters of payment/invoice ID (uppercase)

Example: `INV-20260314-ABC1`

## PDF Export Details

**PDF Generation:**
- Uses `jsPDF` for PDF creation
- Uses `html2canvas` for HTML to image conversion
- Automatic page breaks for long invoices
- High DPI rendering (scale: 2)
- White background for printing

**File naming:**
```
invoice-[invoiceNumber].pdf
```

Example: `invoice-INV-20260314-ABC1.pdf`

## Customization

### Change Gym Name/Details

**Option 1: Via Hook**
```tsx
const { isOpen, invoiceData, openGenerator, closeGenerator } = useInvoiceGenerator({
  gymName: "Your Gym Name",
  gymAddress: "Your Address",
  gymEmail: "your-email@gym.com",
  gymPhone: "+1 (555) YOUR-PHONE"
});
```

**Option 2: Via Component Props**
```tsx
<InvoiceTemplate
  // ... other props
  gymName="Your Gym Name"
  gymAddress="Your Address"
  gymEmail="your-email@gym.com"
  gymPhone="+1 (555) YOUR-PHONE"
/>
```

### Modify Invoice Colors

Edit `InvoiceTemplate.module.css`:
```css
.invoice {
  color: #212121; /* Change text color */
}

.totalValue {
  color: #e63946; /* Change total amount color */
}
```

### Add More Invoice Items

Pass multiple items in the `items` array:
```tsx
items={[
  { description: "Monthly Fee", amount: 5000 },
  { description: "Registration", amount: 500 },
  { description: "Late Fees", amount: 100 }
]}
```

The subtotal will automatically show the sum of all items.

## Dependencies

- **jspdf** (^4.2.0) - PDF generation
- **html2canvas** (^1.4.1) - HTML to canvas conversion
- **framer-motion** - Animations (already in project)
- **react** - UI library (already in project)

## Error Handling

The PDF generator includes try-catch blocks and provides user-friendly error messages:

```typescript
try {
  await generateInvoicePDF(invoiceData, "invoice-template");
} catch (error) {
  console.error("Error generating PDF:", error);
  alert("Failed to generate PDF. Please try again.");
}
```

## Browser Support

- Chrome/Chromium ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

## Performance Notes

- Invoice generation is fast (typically < 500ms)
- PDFs are generated client-side (no server load)
- Large invoices with many items may take longer to render

## Future Enhancements

Possible improvements:
- Email invoice directly to member
- Invoice templates library
- Bulk invoice generation
- Invoice numbering sequences (with reset)
- Custom logo support
- Multi-currency support
- Payment terms customization
- Discount line items

## Troubleshooting

### PDF Not Generating
- Check browser console for errors
- Ensure popup blocker is disabled for print
- Verify all required data is provided

### Styling Issues
- Clear browser cache (Ctrl+Shift+Delete)
- Check CSS media queries for print styles
- Verify `@media print` rules are applied

### Invoice Data Missing
- Ensure member data is loaded before opening modal
- Check that all required props are provided
- Verify data transformation logic in payment handler

## Example: Complete Implementation

```tsx
"use client";

import { useInvoiceGenerator } from "@/services/invoices/invoices.generator.hook";
import InvoiceGeneratorModal from "@/app/(app)/invoices/InvoiceGeneratorModal";

export default function MyPage() {
  const { isOpen, invoiceData, openGenerator, closeGenerator } = useInvoiceGenerator({
    gymName: "FitLife Gym",
    gymAddress: "123 Main St, Springfield",
    gymEmail: "contact@fitlife.com",
    gymPhone: "+1 (555) 123-4567"
  });

  const handleGenerateInvoice = () => {
    openGenerator({
      invoiceNumber: "INV-20260314-0001",
      invoiceDate: "2026-03-14",
      dueDate: "2026-03-21",
      memberId: "member-123",
      memberName: "John Doe",
      memberEmail: "john@example.com",
      memberPhone: "555-123-4567",
      items: [
        { description: "Monthly Membership", amount: 5000 },
        { description: "Personal Training Session", amount: 2000 }
      ],
      subtotal: 7000,
      taxPercentage: 18,
      taxAmount: 1260,
      totalAmount: 8260,
      notes: "Thank you for your membership!"
    });
  };

  return (
    <div>
      <button onClick={handleGenerateInvoice}>Generate Invoice</button>
      <InvoiceGeneratorModal
        open={isOpen}
        onClose={closeGenerator}
        invoiceData={invoiceData}
      />
    </div>
  );
}
```

---

For more information, contact the development team.
