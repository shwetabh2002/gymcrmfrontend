import styles from "./InvoiceTemplate.module.css";

export interface InvoiceTemplateProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  memberName: string;
  memberContact: string;
  memberInstagram?: string;
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
  showActions?: boolean;
  onDownloadPDF?: () => void;
  onPrint?: () => void;
}

export default function InvoiceTemplate({
  invoiceNumber,
  invoiceDate,
  dueDate,
  memberName,
  memberContact,
  memberInstagram,
  items,
  subtotal,
  taxPercentage,
  taxAmount,
  totalAmount,
  notes,
  gymName = "Dalyfstyle Fitness",
  gymAddress = "123 Fitness St, City",
  gymEmail = "admin@gym.com",
  gymPhone = "+1 (555) 123-4567",
  showActions = true,
  onDownloadPDF,
  onPrint,
}: InvoiceTemplateProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className={styles.invoiceContainer}>
      {showActions && (
        <div className={styles.actionBar}>
          <button
            className={styles.actionBtn}
            onClick={onDownloadPDF}
            title="Download as PDF"
          >
            ⬇ Download PDF
          </button>
          <button
            className={styles.actionBtn}
            onClick={onPrint}
            title="Print invoice"
          >
            🖨 Print
          </button>
        </div>
      )}

      <div id="invoice-template" className={styles.invoice}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.gymName}>{gymName}</h1>
            <p className={styles.gymDetail}>{gymAddress}</p>
            <p className={styles.gymDetail}>
              <a href={`mailto:${gymEmail}`}>{gymEmail}</a> | {gymPhone}
            </p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.invoiceTitle}>INVOICE</div>
            <div className={styles.invoiceNumber}>#{invoiceNumber}</div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className={styles.detailsGrid}>
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Bill To</h3>
            <p className={styles.detailName}>{memberName}</p>
            <p className={styles.detailText}>{memberContact}</p>
            {memberInstagram && <p className={styles.detailText}>{memberInstagram}</p>}
          </div>

          <div className={styles.detailsSection}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Invoice Date:</span>
              <span className={styles.detailValue}>{formatDate(invoiceDate)}</span>
            </div>
            {dueDate && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Due Date:</span>
                <span className={styles.detailValue}>{formatDate(dueDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thDescription}>Description</th>
              <th className={styles.thAmount}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className={styles.tdDescription}>{item.description}</td>
                <td className={styles.tdAmount}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Section */}
        <div className={styles.summarySection}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Subtotal</span>
            <span className={styles.summaryValue}>{formatCurrency(subtotal)}</span>
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
              Tax ({taxPercentage}%)
            </span>
            <span className={styles.summaryValue}>{formatCurrency(taxAmount)}</span>
          </div>

          <div className={styles.summaryRow + " " + styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className={styles.notesSection}>
            <h4 className={styles.notesTitle}>Notes</h4>
            <p className={styles.notesText}>{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Thank you for your business. Please retain this invoice for your records.
          </p>
        </div>
      </div>
    </div>
  );
}
