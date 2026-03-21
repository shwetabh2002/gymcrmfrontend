"use client";
import Image from "next/image";
import { useRef, useLayoutEffect, useState } from "react";
import styles from "./InvoiceTemplate.module.css";

export interface InvoiceTemplateProps {
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
  gymGST?: string;
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
  membershipPlan,
  duration,
  membershipFee,
  personalTrainingFee,
  otherCharges,
  paymentMode,
  items,
  subtotal,
  taxPercentage,
  taxAmount,
  totalAmount,
  notes,
  gymName = "Dalyfstyle Fitness",
  gymAddress = "B-1,2,3 Aditya Mall, Indirapuram, Ghaziabad (UP)",
  gymEmail = "dalyfstylefitness.official@gmail.com",
  gymPhone = "8595834424",
  gymGST = "09AA0FD5745M1ZQ",
  showActions = true,
  onDownloadPDF,
  onPrint,
}: InvoiceTemplateProps) {
  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
    } catch { return date; }
  };

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isPaid = taxPercentage === 0 && subtotal === totalAmount;
  const hasStructuredFees = membershipFee !== undefined || personalTrainingFee !== undefined || otherCharges !== undefined;
  
  // Build row index helper
  let rowIdx = 0;

  const invoiceRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const TARGET_HEIGHT = 1122;

  useLayoutEffect(() => {
    if (!invoiceRef.current) return;
    const el = invoiceRef.current;
    // Reset scale to measure true height
    el.style.transform = "";
    el.style.transformOrigin = "";
    const naturalHeight = el.scrollHeight;
    if (naturalHeight > TARGET_HEIGHT) {
      const s = TARGET_HEIGHT / naturalHeight;
      setScale(s);
    } else {
      setScale(1);
    }
  }, []);

  return (
    <div className={styles.invoiceContainer}>
      {showActions && (
        <div className={styles.actionBar}>
          <button className={styles.actionBtnOutline} onClick={onPrint}>🖨 Print</button>
          <button className={styles.actionBtn} onClick={onDownloadPDF}>⬇ Download PDF</button>
        </div>
      )}

      <div
        id="invoice-template"
        ref={invoiceRef}
        className={styles.invoice}
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: scale < 1 ? "top left" : undefined,
          width: scale < 1 ? `${100 / scale}%` : "100%",
          height: `${TARGET_HEIGHT}px`,
        }}
      >

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.logoWrap}>
              <Image src="/small_logo.png" alt={gymName} width={100} height={100}
                style={{ objectFit: "contain" }} unoptimized />
            </div>
            <div className={styles.headerInfo}>
              <div className={styles.gymName}>{gymName}</div>
              <div className={styles.gymTagline}>FITNESS &amp; WELLNESS</div>
              <div className={styles.gymMeta}>{gymAddress}</div>
              <div className={styles.gymMeta}>{gymEmail}&nbsp;·&nbsp;{gymPhone}</div>
              {gymGST && <div className={styles.gymGST}>GST: {gymGST}</div>}
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.invoiceLabel}>INVOICE</div>
            <div className={styles.invoiceNumber}>{invoiceNumber}</div>
            <div className={styles.invoiceDateRow}>
              <span className={styles.invoiceDateLabel}>Date</span>
              <span className={styles.invoiceDateVal}>{formatDate(invoiceDate)}</span>
            </div>
            {dueDate && (
              <div className={styles.invoiceDateRow}>
                <span className={styles.invoiceDateLabel}>Valid Until</span>
                <span className={styles.invoiceDateVal}>{formatDate(dueDate)}</span>
              </div>
            )}
            {isPaid && <div className={styles.paidStamp}>✓ PAID</div>}
          </div>
        </div>

        {/* ── Gold accent divider ── */}
        <div className={styles.accentDivider} />

        {/* ── Client + Membership Info ── */}
        <div className={styles.infoSection}>
          <div className={styles.infoBlock}>
            <div className={styles.infoBlockTitle}>CLIENT DETAILS</div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Client Name</span>
              <span className={styles.infoVal}>{memberName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Client Phone</span>
              <span className={styles.infoVal}>{memberContact}</span>
            </div>
            {memberInstagram && (
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Instagram</span>
                <span className={styles.infoVal}>{memberInstagram}</span>
              </div>
            )}
          </div>

          <div className={styles.infoDividerV} />

          <div className={styles.infoBlock}>
            <div className={styles.infoBlockTitle}>MEMBERSHIP DETAILS</div>
            {membershipPlan && (
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Membership Plan</span>
                <span className={styles.infoVal}>{membershipPlan}</span>
              </div>
            )}
            {duration && (
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Duration</span>
                <span className={styles.infoVal}>{duration}</span>
              </div>
            )}
            {paymentMode && (
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Payment Mode</span>
                <span className={styles.paymentBadge}>{paymentMode}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Items Table ── */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNo}>#</th>
              <th className={styles.thDesc}>Description</th>
              <th className={styles.thAmt}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {hasStructuredFees ? (
              <>
                {membershipFee !== undefined && membershipFee >= 0 && (() => { rowIdx++; return (
                  <tr className={styles.rowEven}>
                    <td className={styles.tdNo}>{String(rowIdx).padStart(2,"0")}</td>
                    <td className={styles.tdDesc}>
                      Membership Fee
                      {membershipPlan && <span className={styles.tdSubtext}> — {membershipPlan}</span>}
                      {duration && <span className={styles.tdSubtext}> · {duration}</span>}
                    </td>
                    <td className={styles.tdAmt}>{formatCurrency(membershipFee)}</td>
                  </tr>
                )})()}
                {personalTrainingFee !== undefined && personalTrainingFee >= 0 && (() => { rowIdx++; return (
                  <tr className={rowIdx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td className={styles.tdNo}>{String(rowIdx).padStart(2,"0")}</td>
                    <td className={styles.tdDesc}>Personal Training</td>
                    <td className={styles.tdAmt}>{formatCurrency(personalTrainingFee)}</td>
                  </tr>
                )})()}
                {otherCharges !== undefined && otherCharges >= 0 && (() => { rowIdx++; return (
                  <tr className={rowIdx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td className={styles.tdNo}>{String(rowIdx).padStart(2,"0")}</td>
                    <td className={styles.tdDesc}>Other Charges</td>
                    <td className={styles.tdAmt}>{formatCurrency(otherCharges)}</td>
                  </tr>
                )})()}
              </>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td className={styles.tdNo}>{String(idx + 1).padStart(2, "0")}</td>
                  <td className={styles.tdDesc}>{item.description}</td>
                  <td className={styles.tdAmt}>{formatCurrency(item.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ── Summary ── */}
        <div className={styles.summarySection}>
          <div className={styles.summaryLeft}>
            {notes && (
              <div className={styles.notesWrap}>
                <div className={styles.notesHeading}>NOTES</div>
                <p className={styles.notesText}>{notes}</p>
              </div>
            )}
          </div>
          <div className={styles.summaryBox}>
            {/* Inclusive GST: GST = total * 12/112, base = total - GST */}
            {(() => {
              const inclusiveGSTRate = 12;
              const gstAmount = Math.round((totalAmount * inclusiveGSTRate) / (100 + inclusiveGSTRate) * 100) / 100;
              const baseAmount = Math.round((totalAmount - gstAmount) * 100) / 100;
              return (
                <>
                  <div className={styles.summaryLine}>
                    <span className={styles.summaryKey}>Base Amount</span>
                    <span className={styles.summaryVal}>{formatCurrency(baseAmount)}</span>
                  </div>
                  <div className={styles.summaryLine}>
                    <span className={styles.summaryKey}>GST @12% (inclusive)</span>
                    <span className={styles.summaryVal}>{formatCurrency(gstAmount)}</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.totalLine}>
                    <span className={styles.totalKey}>TOTAL AMOUNT</span>
                    <span className={styles.totalVal}>{formatCurrency(totalAmount)}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* ── Signatures ── */}
        <div className={styles.signatureSection}>
          <div className={styles.signatureBlock}>
            <div className={styles.signatureLine} />
            <div className={styles.signatureLabel}>AUTHORIZED SIGNATURE</div>
            <div className={styles.signatureSub}>{gymName}</div>
          </div>
          <div className={styles.signatureBlock} style={{ textAlign: "right" }}>
            <div className={styles.signatureLine} />
            <div className={styles.signatureLabel}>CLIENT SIGNATURE</div>
            <div className={styles.signatureSub}>{memberName}</div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <Image src="/small_logo.png" alt={gymName} width={18} height={18}
              style={{ objectFit: "contain" }} unoptimized />
            <span className={styles.footerGymName}>{gymName}</span>
            <span className={styles.footerDot}>·</span>
            <span className={styles.footerSub}>Thank you for being a valued member.</span>
          </div>
          <div className={styles.footerRight}>Please retain this invoice for your records.</div>
        </div>

      </div>
    </div>
  );
}