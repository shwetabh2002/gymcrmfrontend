"use client";

import { useBranding } from "@/lib/context/BrandingContext";
import type { InvoiceLayout } from "@/config/invoice";
import { formatMoney } from "@/config/countries";
import {
  amountInWords,
  buildTaxLines,
  paymentStatusLabel,
} from "@/lib/invoice-format";
import styles from "./InvoiceTemplate.module.css";

export interface InvoiceTemplateProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  memberName: string;
  memberContact: string;
  memberInstagram?: string;
  /** Gym's own member number, e.g. GYM-0042 */
  memberIdNo?: string | null;
  /** What was bought and for how long */
  planName?: string | null;
  planFrom?: string | null;
  planTo?: string | null;
  items: Array<{
    description: string;
    amount: number;
  }>;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  /** How GST was applied — changes labels on breakdown */
  taxMode?: "included" | "excluded" | string;
  /** split = CGST + SGST halves, single = one combined line */
  taxBreakup?: string;
  /** SAC / HSN printed against the line item */
  sacCode?: string | null;
  placeOfSupply?: string | null;
  showAmountInWords?: boolean;
  invoiceTerms?: string | null;
  /** What has actually been collected against this invoice */
  amountPaid?: number | null;
  paymentMode?: string | null;
  paymentDate?: string | null;
  paymentReference?: string | null;
  /** Optional overrides — defaults from company branding; all brand bits optional */
  gymName?: string;
  gymAddress?: string;
  gymEmail?: string;
  gymPhone?: string;
  gymLogoUrl?: string | null;
  gymStampUrl?: string | null;
  gymGstin?: string | null;
  gymFooter?: string | null;
  gymWebsite?: string | null;
  /** Branch / location name shown under gym name */
  locationName?: string;
  primaryColor?: string;
  layout?: InvoiceLayout;
  showLogo?: boolean;
  showStamp?: boolean;
  showGstin?: boolean;
  showAddress?: boolean;
  showContact?: boolean;
  stampAlign?: import("@/config/invoice").InvoiceStampAlign;
  showActions?: boolean;
  onDownloadPDF?: () => void;
  onPrint?: () => void;
}

export default function InvoiceTemplate(props: InvoiceTemplateProps) {
  const branding = useBranding();

  const {
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
    taxMode,
    showActions = true,
    onDownloadPDF,
    onPrint,
  } = props;

  const gymName = props.gymName ?? branding.gymName;
  const gymAddress = props.gymAddress ?? branding.invoiceAddress ?? undefined;
  const gymEmail = props.gymEmail ?? branding.invoiceEmail ?? undefined;
  const gymPhone = props.gymPhone ?? branding.invoicePhone ?? undefined;
  const gymLogoUrl = props.gymLogoUrl ?? branding.logoUrl;
  const gymStampUrl = props.gymStampUrl ?? branding.stampUrl;
  const gymGstin = props.gymGstin ?? branding.invoiceGstin;
  const gymFooter = props.gymFooter ?? branding.invoiceFooter;
  const gymWebsite = props.gymWebsite ?? branding.websiteUrl;
  const locationName = props.locationName?.trim() || undefined;
  const primaryColor = props.primaryColor ?? branding.primaryColor ?? "#e63946";
  const countryCode = branding.country.code;

  const layout: InvoiceLayout =
    props.layout ?? branding.invoice.layout ?? "classic";
  const showLogo =
    (props.showLogo ?? branding.invoice.showLogo) && Boolean(gymLogoUrl);
  const showStamp =
    (props.showStamp ?? branding.invoice.showStamp) && Boolean(gymStampUrl);
  const showGstin =
    (props.showGstin ?? branding.invoice.showGstin) && Boolean(gymGstin);
  const showAddress =
    (props.showAddress ?? branding.invoice.showAddress) && Boolean(gymAddress);
  const showContact = props.showContact ?? branding.invoice.showContact;
  const stampAlign =
    props.stampAlign ?? branding.invoice.stampAlign ?? "right";

  const contactLine = showContact
    ? [gymEmail, gymPhone, gymWebsite].filter(Boolean).join(" · ")
    : "";

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(branding.country.locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatCurrency = (amount: number) => formatMoney(amount, countryCode);

  const memberIdNo = props.memberIdNo;
  const planName = props.planName;
  const planFrom = props.planFrom;
  const planTo = props.planTo;
  const sacCode = props.sacCode ?? branding.invoice.sacCode;
  const placeOfSupply = props.placeOfSupply ?? branding.invoice.placeOfSupply;
  const taxBreakup = props.taxBreakup ?? branding.invoice.taxBreakup;
  const invoiceTerms = props.invoiceTerms ?? branding.invoice.terms;
  const showAmountInWords =
    props.showAmountInWords ?? branding.invoice.showAmountInWords;

  const taxLines = buildTaxLines(taxAmount, taxPercentage, taxBreakup);
  const status = paymentStatusLabel({ totalAmount, amountPaid: props.amountPaid });
  const balanceDue = Math.max(totalAmount - (Number(props.amountPaid) || 0), 0);

  const layoutClass =
    layout === "modern"
      ? styles.layoutModern
      : layout === "minimal"
        ? styles.layoutMinimal
        : styles.layoutClassic;

  const brandBlock = (
    <>
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gymLogoUrl!}
          alt={gymName}
          className={styles.logo}
          crossOrigin="anonymous"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.crossOrigin) {
              img.removeAttribute("crossorigin");
              img.src = gymLogoUrl!;
            }
          }}
        />
      ) : null}
      <h1 className={styles.gymName} style={{ color: primaryColor }}>
        {gymName}
      </h1>
      {locationName ? (
        <p className={styles.gymDetail}>{locationName}</p>
      ) : null}
      {showAddress ? <p className={styles.gymDetail}>{gymAddress}</p> : null}
      {contactLine ? <p className={styles.gymDetail}>{contactLine}</p> : null}
      {showGstin ? (
        <p className={styles.gymDetail}>GSTIN: {gymGstin}</p>
      ) : null}
    </>
  );

  return (
    <div className={styles.invoiceContainer}>
      {showActions && (
        <div className={styles.actionBar}>
          <button
            className={styles.actionBtn}
            style={{ background: primaryColor }}
            onClick={onDownloadPDF}
            title="Download as PDF"
          >
            ⬇ Download PDF
          </button>
          <button
            className={styles.actionBtn}
            style={{ background: primaryColor }}
            onClick={onPrint}
            title="Print invoice"
          >
            🖨 Print
          </button>
        </div>
      )}

      <div
        id="invoice-template"
        className={`${styles.invoice} ${layoutClass}`}
      >
        {/* Header — structure depends on layout; missing assets simply omit */}
        {layout === "modern" ? (
          <div
            className={styles.headerModern}
            style={{ borderBottomColor: primaryColor }}
          >
            <div className={styles.headerModernBrand}>{brandBlock}</div>
            <div className={styles.headerModernMeta}>
              <div
                className={styles.invoiceTitle}
                style={{ color: primaryColor }}
              >
                INVOICE
              </div>
              <div className={styles.invoiceNumber}>#{invoiceNumber}</div>
            </div>
          </div>
        ) : layout === "minimal" ? (
          <div className={styles.headerMinimal}>
            <div className={styles.headerMinimalRow}>
              <div>
                {showLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gymLogoUrl!}
                    alt=""
                    className={styles.logoSmall}
                    crossOrigin="anonymous"
                  />
                ) : null}
                <span className={styles.gymNameMinimal}>{gymName}</span>
              </div>
              <div className={styles.invoiceNumber}>#{invoiceNumber}</div>
            </div>
            {(locationName || showAddress || contactLine || showGstin) && (
              <p className={styles.gymDetailCompact}>
                {[
                  locationName || null,
                  showAddress ? gymAddress : null,
                  contactLine || null,
                  showGstin ? `GSTIN ${gymGstin}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <div
              className={styles.minimalRule}
              style={{ background: primaryColor }}
            />
          </div>
        ) : (
          <div
            className={styles.header}
            style={{ borderBottomColor: primaryColor }}
          >
            <div className={styles.headerLeft}>{brandBlock}</div>
            <div className={styles.headerRight}>
              <div
                className={styles.invoiceTitle}
                style={{ color: primaryColor }}
              >
                INVOICE
              </div>
              <div className={styles.invoiceNumber}>#{invoiceNumber}</div>
            </div>
          </div>
        )}

        <div className={styles.detailsGrid}>
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Bill To</h3>
            <p className={styles.detailName}>{memberName}</p>
            {memberIdNo ? (
              <p className={styles.detailText}>Member ID: {memberIdNo}</p>
            ) : null}
            {memberContact ? (
              <p className={styles.detailText}>{memberContact}</p>
            ) : null}
            {memberInstagram ? (
              <p className={styles.detailText}>{memberInstagram}</p>
            ) : null}
          </div>

          <div className={styles.detailsSection}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Invoice Date:</span>
              <span className={styles.detailValue}>
                {formatDate(invoiceDate)}
              </span>
            </div>
            {dueDate ? (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Due Date:</span>
                <span className={styles.detailValue}>
                  {formatDate(dueDate)}
                </span>
              </div>
            ) : null}
            {planFrom && planTo ? (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Valid:</span>
                <span className={styles.detailValue}>
                  {formatDate(planFrom)} – {formatDate(planTo)}
                </span>
              </div>
            ) : null}
            {placeOfSupply ? (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Place of Supply:</span>
                <span className={styles.detailValue}>{placeOfSupply}</span>
              </div>
            ) : null}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Status:</span>
              <span
                className={`${styles.statusBadge} ${
                  status.tone === "paid"
                    ? styles.statusPaid
                    : status.tone === "partial"
                      ? styles.statusPartial
                      : styles.statusDue
                }`}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thDescription}>Description</th>
              {sacCode ? <th className={styles.thCode}>SAC</th> : null}
              <th className={styles.thAmount}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className={styles.tdDescription}>
                  {item.description}
                  {planName && idx === 0 ? (
                    <span className={styles.tdSubtext}>{planName}</span>
                  ) : null}
                </td>
                {sacCode ? (
                  <td className={styles.tdCode}>{sacCode}</td>
                ) : null}
                <td className={styles.tdAmount}>
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.summarySection}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
              {taxMode === "included" ? "Taxable value" : "Subtotal"}
            </span>
            <span className={styles.summaryValue}>
              {formatCurrency(subtotal)}
            </span>
          </div>
          {taxLines.map((line) => (
            <div className={styles.summaryRow} key={line.label}>
              <span className={styles.summaryLabel}>
                {line.label}
                {taxMode === "included" ? " incl." : ""}
              </span>
              <span className={styles.summaryValue}>
                {formatCurrency(line.amount)}
              </span>
            </div>
          ))}
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span className={styles.totalLabel}>Total</span>
            <span
              className={styles.totalValue}
              style={{ color: primaryColor }}
            >
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {props.amountPaid !== undefined && props.amountPaid !== null ? (
            <>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>
                  Received
                  {props.paymentMode ? ` (${props.paymentMode})` : ""}
                </span>
                <span className={styles.summaryValue}>
                  {formatCurrency(Number(props.amountPaid))}
                </span>
              </div>
              {balanceDue > 0 ? (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Balance due</span>
                  <span className={styles.summaryValue}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {showAmountInWords ? (
          <div className={styles.wordsSection}>
            <span className={styles.wordsLabel}>Amount in words</span>
            <span className={styles.wordsValue}>
              {amountInWords(totalAmount, branding.country)}
            </span>
          </div>
        ) : null}

        {props.paymentReference ? (
          <p className={styles.refLine}>
            Payment reference: {props.paymentReference}
            {props.paymentDate ? ` · ${formatDate(props.paymentDate)}` : ""}
          </p>
        ) : null}

        {notes ? (
          <div className={styles.notesSection}>
            <h4 className={styles.notesTitle}>Notes</h4>
            <p className={styles.notesText}>{notes}</p>
          </div>
        ) : null}

        {invoiceTerms ? (
          <div className={styles.termsSection}>
            <h4 className={styles.notesTitle}>Terms</h4>
            <p className={styles.notesText}>{invoiceTerms}</p>
          </div>
        ) : null}

        {(showStamp || gymFooter) && (
          <div
            className={
              layout === "modern"
                ? styles.footerModern
                : layout === "minimal"
                  ? styles.footerMinimal
                  : styles.footer
            }
            style={{
              textAlign: stampAlign,
              alignItems:
                stampAlign === "left"
                  ? "flex-start"
                  : stampAlign === "right"
                    ? "flex-end"
                    : "center",
            }}
            data-stamp-align={stampAlign}
          >
            {showStamp && gymStampUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gymStampUrl}
                alt="Stamp"
                className={`${styles.stamp} ${
                  stampAlign === "left"
                    ? styles.stampLeft
                    : stampAlign === "right"
                      ? styles.stampRight
                      : styles.stampCenter
                }`}
                crossOrigin="anonymous"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.crossOrigin) {
                    img.removeAttribute("crossorigin");
                    img.src = gymStampUrl;
                  }
                }}
              />
            ) : null}
            {gymFooter ? (
              <p className={styles.footerText}>{gymFooter}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
