"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import styles from "./Invoices.module.css";
import { useAllPayments } from "@/services/invoices/invoices.hooks";
import { PaymentRecord } from "@/services/invoices/invoices.api";
import InvoiceGeneratorModal from "./InvoiceGeneratorModal";
import { useInvoiceGenerator } from "@/services/invoices/invoices.generator.hook";
import { FaEye } from "react-icons/fa";

import { IoMdDocument } from "react-icons/io";
const PAGE_SIZE = 10;

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

function getDisplayTransactionId(payment: PaymentRecord) {
  if (payment.transactionId && payment.transactionId.trim().length > 0) {
    return payment.transactionId;
  }
  return `INV-${payment._id.slice(-6).toUpperCase()}`;
}

export default function InvoicesPage() {
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [mounted, setMounted]       = useState(false);

  const { isOpen, invoiceData, openFromPayment, close } = useInvoiceGenerator();

  useEffect(() => { setMounted(true); }, []);

  // Debounce search — wait 400ms after user stops typing before hitting the API
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: response, isLoading, isError } = useAllPayments({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  const payments   = response?.data ?? [];
  const summary    = response?.summary;
  const pagination = response?.pagination;

  const totalPages  = pagination?.totalPages ?? 1;
  const totalCount  = pagination?.total ?? 0;
  const hasNext     = pagination?.hasNextPage ?? false;
  const hasPrev     = pagination?.hasPrevPage ?? false;

  // Stats are across ALL filtered payments (backend summary)
  const totalAmount   = summary?.totalAmount   ?? payments.reduce((s, p) => s + (p.amount   || 0), 0);
  const totalReceived = summary?.totalReceived ?? payments.reduce((s, p) => s + (p.received || 0), 0);
  const totalPending  = summary?.totalPending  ?? payments.reduce((s, p) => s + (p.pending  || 0), 0);

  const STATS = [
    { label: "Total Payments", val: String(summary?.totalPayments ?? totalCount), sub: "all filtered" },
    { label: "Total Amount",   val: `₹${totalAmount.toLocaleString()}`,            sub: "all filtered" },
    { label: "Total Received", val: `₹${totalReceived.toLocaleString()}`,          sub: "all filtered" },
    { label: "Total Pending",  val: `₹${totalPending.toLocaleString()}`,           sub: "all filtered" },
  ];

  // Build page number buttons — show at most 5 around current page
  const pageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  };

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
              <input
                className={styles.searchInput}
                placeholder="Search member name or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
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
                  <th>Transaction ID</th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Received</th>
                  <th>Pending</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#444" }}>
                      {debouncedSearch ? "No payments match your search." : "No payments found."}
                    </td>
                  </tr>
                )}
                {payments.map((payment) => {
                  const member = getMember(payment);
                  return (
                    <tr key={payment._id}>
                      <td className={styles.cellId}>{getDisplayTransactionId(payment)}</td>
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
                          ><FaEye /></button>
                          <button
                            className={styles.iconBtn}
                            title="Generate Invoice"
                            onClick={() => openFromPayment(payment)}
                          ><IoMdDocument /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {debouncedSearch
              ? `${payments.length} result${payments.length !== 1 ? "s" : ""} for "${debouncedSearch}"`
              : `Showing ${((page - 1) * PAGE_SIZE) + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} payments`}
          </span>
          <div className={styles.paginationBtns}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => p - 1)}
              disabled={!hasPrev || isLoading}
            >‹</button>

            {pageNumbers().map(n => (
              <button
                key={n}
                className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ""}`}
                onClick={() => setPage(n)}
                disabled={isLoading}
              >{n}</button>
            ))}

            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNext || isLoading}
            >›</button>
          </div>
        </div>
      </motion.div>

      {/* Payment detail modal */}
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
                          {selectedPayment.pending > 0 ? "Partial" : "Complete"}
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
                        <span className={`${styles.detailValue} ${selectedPayment.pending > 0 ? styles.amountPending : styles.amountZero}`}>
                          ₹{selectedPayment.pending.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {selectedPayment.notes && (
                      <div className={styles.notesSection}>
                        <h4 className={styles.notesTitle}>Notes</h4>
                        <p className={styles.notesText}>{selectedPayment.notes}</p>
                      </div>
                    )}

                    <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        className={styles.btnPrimary}
                        onClick={() => {
                          openFromPayment(selectedPayment);
                          setSelectedPayment(null);
                        }}
                      >
                        📄 Generate Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {mounted && createPortal(
        <InvoiceGeneratorModal
          open={isOpen}
          onClose={close}
          invoiceData={invoiceData}
        />,
        document.body
      )}
    </div>
  );
}