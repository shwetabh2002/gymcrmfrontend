"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Invoices.module.css";
import { useAllPayments, useAllMembers } from "@/services/invoices/invoices.hooks";
import { PaymentRecord, MemberRecord } from "@/services/invoices/invoices.api";
import InvoiceTemplate from "./InvoiceTemplate";
import InvoiceGeneratorModal, { InvoiceGeneratorData } from "./InvoiceGeneratorModal";
import { createPortal } from "react-dom";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function getMember(payment: PaymentRecord) {
  if (payment.memberId && typeof payment.memberId === "object") return payment.memberId;
  return null;
}

export default function InvoicesPage() {
  const { data: payments, isLoading, isError } = useAllPayments();
  const { data: members } = useAllMembers();

  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceGeneratorData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const paymentsArray = Array.isArray(payments) ? payments : [];
  const membersArray = Array.isArray(members) ? members : [];

  const total        = paymentsArray.length;
  const totalAmount  = paymentsArray.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalReceived = paymentsArray.reduce((sum, p) => sum + (p.received || 0), 0);
  const totalPending = paymentsArray.reduce((sum, p) => sum + (p.pending || 0), 0);
  const thisMonth    = paymentsArray.filter(p => {
    const payDate = new Date(p.paymentDate);
    const now = new Date();
    return payDate.getMonth() === now.getMonth() && payDate.getFullYear() === now.getFullYear();
  }).length;

  const filtered = useMemo(() => {
    if (!paymentsArray.length) return [];
    return paymentsArray.filter(payment => {
      const member = getMember(payment);
      const q = search.toLowerCase();
      return !q ||
        payment.transactionId?.toLowerCase().includes(q) ||
        member?.name.toLowerCase().includes(q) ||
        (member?.phone ?? "").includes(q);
    });
  }, [paymentsArray, search]);

  const STATS = [
    { label: "Total Payments", val: String(total),                       sub: "all time" },
    { label: "Total Amount",   val: `₹${totalAmount.toLocaleString()}`,  sub: "billed" },
    { label: "Total Received", val: `₹${totalReceived.toLocaleString()}`, sub: "collected" },
    { label: "Total Pending",  val: `₹${totalPending.toLocaleString()}`,  sub: "outstanding" },
  ];

  return (
    <div className={styles.page}>

      <motion.div className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Payments</h1>
          <p className={styles.pageDesc}>Track all member payments and outstanding balances.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={() => {
            // Generate invoice from selected payment or create new one
            if (selectedPayment) {
              // Generate invoice from the selected payment
              const member = getMember(selectedPayment);
              const invoiceData: InvoiceGeneratorData = {
                invoiceNumber: `INV-${Date.now()}`,
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                memberId: selectedPayment.memberId?.toString() || '',
                memberName: member?.name || 'Unknown Member',
                memberContact: member?.phone || member?.email || '',
                memberInstagram: '',
                items: [
                  { description: `Payment - ${selectedPayment.mop.toUpperCase()}`, amount: selectedPayment.amount }
                ],
                subtotal: selectedPayment.amount,
                taxPercentage: 18,
                taxAmount: Math.round(selectedPayment.amount * 0.18),
                totalAmount: selectedPayment.amount + Math.round(selectedPayment.amount * 0.18),
                notes: selectedPayment.notes || `Payment received via ${selectedPayment.mop.toUpperCase()}`,
                gymName: 'Your Gym Name',
                gymAddress: '123 Gym Street, City, State',
                gymEmail: 'gym@email.com',
                gymPhone: '+91 1234567890'
              };
              setInvoiceData(invoiceData);
            } else {
              // Create dummy invoice data
              const dummyInvoice: InvoiceGeneratorData = {
                invoiceNumber: `INV-${Date.now()}`,
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                memberId: '',
                memberName: 'Sample Member',
                memberContact: 'sample@email.com',
                memberInstagram: '@sample',
                items: [
                  { description: 'Gym Membership', amount: 5000 }
                ],
                subtotal: 5000,
                taxPercentage: 18,
                taxAmount: 900,
                totalAmount: 5900,
                notes: 'Sample invoice for testing',
                gymName: 'Your Gym Name',
                gymAddress: '123 Gym Street, City, State',
                gymEmail: 'gym@email.com',
                gymPhone: '+91 1234567890'
              };
              setInvoiceData(dummyInvoice);
            }
            setShowInvoiceGenerator(true);
          }}>
            {selectedPayment ? '📄 Generate Invoice' : '+ Create Invoice'}
          </button>
          <button className={styles.btnSecondary}>⬇ Export PDF</button>
        </div>
      </motion.div>

      <motion.div className={styles.statStrip} custom={0} variants={fadeUp} initial="hidden" animate="visible">
        {STATS.map((st) => (
          <div key={st.label} className={styles.statCell}>
            <span className={styles.statLabel}><span className={styles.statLabelDot} />{st.label}</span>
            <span className={styles.statVal}>{st.val}</span>
            <span className={styles.statSub}>{st.sub}</span>
          </div>
        ))}
      </motion.div>

      <motion.div className={styles.card} custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />All Payments</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search payment or member…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && <p style={{ padding: "1rem", color: "#555" }}>Loading payments…</p>}
          {isError   && <p style={{ padding: "1rem", color: "#e63946" }}>Failed to load payments.</p>}

          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Transaction ID</th><th>Member</th><th>Amount</th>
                  <th>Received</th><th>Pending</th><th>Method</th>
                  <th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#444" }}>
                    {paymentsArray.length === 0 ? "No payments found." : "No payments match your search."}
                  </td></tr>
                )}
                {filtered.map((payment) => {
                  const member = getMember(payment);
                  return (
                    <tr key={payment._id}>
                      <td className={styles.cellId}>{payment.transactionId ?? "—"}</td>
                      <td>
                        <div className={styles.cellName}>{member?.name ?? "—"}</div>
                        <div className={styles.cellEmail}>{member?.phone ?? "—"}</div>
                      </td>
                      <td className={styles.cellAmount}>₹{payment.amount.toLocaleString()}</td>
                      <td className={styles.cellAmount}>₹{payment.received.toLocaleString()}</td>
                      <td className={styles.cellAmount}>₹{payment.pending.toLocaleString()}</td>
                      <td style={{ textTransform: "uppercase", fontSize: "0.82rem" }}>{payment.mop}</td>
                      <td className={styles.cellMono}>
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className={styles.iconBtn}
                            title="View Details"
                            onClick={() => setSelectedPayment(payment)}
                          >👁</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {filtered.length !== paymentsArray.length
              ? `Showing ${filtered.length} of ${paymentsArray.length} payments`
              : `${paymentsArray.length} payment${paymentsArray.length !== 1 ? "s" : ""}`}
          </span>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn} disabled>‹</button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
            <button className={styles.pageBtn} disabled>›</button>
          </div>
        </div>
      </motion.div>

      {mounted && selectedPayment && createPortal(
        <AnimatePresence>
          {selectedPayment && (
            <>
              <motion.div
                className={styles.backdrop}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedPayment(null)}
              />
              <motion.div
                className={styles.invoiceViewModal}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
              >
                <div className={styles.invoiceViewHeader}>
                  <h2 className={styles.invoiceViewTitle}>Payment Details</h2>
                  <button className={styles.closeBtn} onClick={() => setSelectedPayment(null)}>✕</button>
                </div>
                <div className={styles.invoiceViewContent}>
                  <div className={styles.paymentDetails}>
                    <div className={styles.paymentHeader}>
                      <h3 className={styles.paymentTitle}>Payment Details</h3>
                      <div className={styles.paymentStatus}>
                        <span className={`${styles.statusBadge} ${selectedPayment.pending > 0 ? styles.statusPartial : styles.statusComplete}`}>
                          {selectedPayment.pending > 0 ? 'Partial' : 'Complete'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.paymentGrid}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Payment Method</span>
                        <span className={styles.detailValue}>{selectedPayment.mop.toUpperCase()}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Payment Date</span>
                        <span className={styles.detailValue}>{new Date(selectedPayment.paymentDate).toLocaleDateString()}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Total Amount</span>
                        <span className={styles.detailValue}>₹{selectedPayment.amount.toLocaleString()}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Amount Received</span>
                        <span className={`${styles.detailValue} ${styles.amountReceived}`}>₹{selectedPayment.received.toLocaleString()}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Pending Amount</span>
                        <span className={`${styles.detailValue} ${selectedPayment.pending > 0 ? styles.amountPending : styles.amountZero}`}>₹{selectedPayment.pending.toLocaleString()}</span>
                      </div>
                    </div>

                    {selectedPayment.notes && (
                      <div className={styles.notesSection}>
                        <h4 className={styles.notesTitle}>Notes</h4>
                        <p className={styles.notesText}>{selectedPayment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {mounted && showInvoiceGenerator && createPortal(
        <InvoiceGeneratorModal
          open={showInvoiceGenerator}
          onClose={() => {
            setShowInvoiceGenerator(false);
            setInvoiceData(null);
          }}
          invoiceData={invoiceData}
        />,
        document.body
      )}
    </div>
  );
}