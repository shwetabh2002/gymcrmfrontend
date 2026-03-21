import Image from "next/image";
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
  gymPhone = "+91 1234567890",
  showActions = true,
  onDownloadPDF,
  onPrint,
}: InvoiceTemplateProps) {
  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const isPaid = taxPercentage === 0 && subtotal === totalAmount;

  return (
    <div className={styles.invoiceContainer}>
      {/* Action bar — hidden in PDF/print */}
      {showActions && (
        <div className={styles.actionBar} data-no-print>
          <button className={styles.actionBtnOutline} onClick={onPrint} title="Print invoice">
            🖨 Print
          </button>
          <button className={styles.actionBtn} onClick={onDownloadPDF} title="Download as PDF">
            ⬇ Download PDF
          </button>
        </div>
      )}

      {/* ── The actual invoice document ── */}
      <div id="invoice-template" className={styles.invoice}>

        {/* Top accent bar */}
        <div className={styles.accentBar} />

        {/* Header: Logo + Gym info + Invoice badge */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.logoRow}>
              <div className={styles.logoWrap}>
                <Image
                  src="/big_logo.png"
                  alt={gymName}
                  width={56}
                  height={56}
                  style={{ objectFit: "contain" }}
                  unoptimized
                />
              </div>
              <div>
                <div className={styles.gymName}>{gymName}</div>
                <div className={styles.gymTagline}>FITNESS &amp; WELLNESS</div>
              </div>
            </div>
            <div className={styles.gymMeta}>
              <span>{gymAddress}</span>
              <span className={styles.metaDot}>·</span>
              <span>{gymPhone}</span>
              <span className={styles.metaDot}>·</span>
              <span>{gymEmail}</span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.invoiceBadge}>INVOICE</div>
            <div className={styles.invoiceNumber}>{invoiceNumber}</div>
            {isPaid && <div className={styles.paidStamp}>PAID</div>}
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Bill To + Dates */}
        <div className={styles.metaGrid}>
          <div className={styles.metaBlock}>
            <div className={styles.metaHeading}>BILL TO</div>
            <div className={styles.metaName}>{memberName}</div>
            <div className={styles.metaDetail}>{memberContact}</div>
            {memberInstagram && (
              <div className={styles.metaDetail}>{memberInstagram}</div>
            )}
          </div>

          <div className={styles.metaBlock}>
            <div className={styles.metaHeading}>INVOICE DATE</div>
            <div className={styles.metaName}>{formatDate(invoiceDate)}</div>
          </div>

          {dueDate && (
            <div className={styles.metaBlock}>
              <div className={styles.metaHeading}>VALID UNTIL</div>
              <div className={styles.metaName}>{formatDate(dueDate)}</div>
            </div>
          )}
        </div>

        {/* Line items table */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNo}>#</th>
              <th className={styles.thDesc}>Description</th>
              <th className={styles.thAmt}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td className={styles.tdNo}>{String(idx + 1).padStart(2, "0")}</td>
                <td className={styles.tdDesc}>{item.description}</td>
                <td className={styles.tdAmt}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className={styles.summaryWrap}>
          <div className={styles.summaryBox}>
            {subtotal !== totalAmount && (
              <>
                <div className={styles.summaryLine}>
                  <span className={styles.summaryKey}>Subtotal</span>
                  <span className={styles.summaryVal}>{formatCurrency(subtotal)}</span>
                </div>
                {taxPercentage > 0 && (
                  <div className={styles.summaryLine}>
                    <span className={styles.summaryKey}>Tax ({taxPercentage}%)</span>
                    <span className={styles.summaryVal}>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className={styles.summaryDivider} />
              </>
            )}
            <div className={styles.totalLine}>
              <span className={styles.totalKey}>Total Amount</span>
              <span className={styles.totalVal}>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className={styles.notesWrap}>
            <div className={styles.notesHeading}>NOTES</div>
            <p className={styles.notesText}>{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <div className={styles.footerLogoRow}>
              <Image
                src="/small_logo.png"
                alt={gymName}
                width={20}
                height={20}
                style={{ objectFit: "contain" }}
                unoptimized
              />
              <span className={styles.footerGymName}>{gymName}</span>
            </div>
            <div className={styles.footerSub}>Thank you for being a valued member.</div>
          </div>
          <div className={styles.footerRight}>
            Please retain this invoice for your records.
          </div>
        </div>

      </div>
    </div>
  );
}