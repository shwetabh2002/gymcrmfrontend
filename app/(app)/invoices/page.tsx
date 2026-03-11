"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./Invoices.module.css";
import { useInvoices, useDeleteInvoice } from "@/services/invoices/invoices.hooks";
import { Invoice } from "@/services/invoices/invoices.api";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function getMember(inv: Invoice) {
  if (typeof inv.memberId === "object" && inv.memberId !== null) return inv.memberId;
  return null;
}

function badgeClass(status: string) {
  if (status === "FULLY_PAID")    return styles.badgePaid;
  if (status === "PARTIALLY_PAID") return styles.badgePending;
  return styles.badgeFailed;
}

export default function InvoicesPage() {
  const { data: invoices, isLoading, isError } = useInvoices();
  const { mutate: deleteInvoice } = useDeleteInvoice();

  const total    = invoices?.length ?? 0;
  const fullyPaid = invoices?.filter(i => {
    const sub = typeof i.subscriptionId === "object" ? i.subscriptionId : null;
    return sub?.paymentStatus === "FULLY_PAID";
  }).length ?? 0;
  const partial  = invoices?.filter(i => {
    const sub = typeof i.subscriptionId === "object" ? i.subscriptionId : null;
    return sub?.paymentStatus === "PARTIALLY_PAID";
  }).length ?? 0;
  const unpaid   = invoices?.filter(i => {
    const sub = typeof i.subscriptionId === "object" ? i.subscriptionId : null;
    return sub?.paymentStatus === "UNPAID";
  }).length ?? 0;

  const totalAmount = invoices?.reduce((sum, i) => sum + i.totalAmount, 0) ?? 0;

  const STATS = [
    { label: "Total Invoices",  val: String(total),      sub: "all time" },
    { label: "Total Amount",    val: `₹${totalAmount.toLocaleString()}`, sub: "collected" },
    { label: "Fully Paid",      val: String(fullyPaid),  sub: "invoices" },
    { label: "Partial / Unpaid",val: String(partial + unpaid), sub: "action required" },
  ];

  return (
    <div className={styles.page}>

      <motion.div className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Invoices</h1>
          <p className={styles.pageDesc}>Auto-generated invoices for all member payments.</p>
        </div>
        <div className={styles.headerActions}>
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
          <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />All Invoices</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search invoice or member…" />
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && <p style={{ padding: "1rem", color: "#555" }}>Loading invoices…</p>}
          {isError   && <p style={{ padding: "1rem", color: "#e63946" }}>Failed to load invoices.</p>}

          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th><th>Member</th><th>Items</th>
                  <th>Subtotal</th><th>Tax</th><th>Total</th>
                  <th>Status</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices?.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: "#444" }}>No invoices found.</td></tr>
                )}
                {invoices?.map((inv) => {
                  const member = getMember(inv);
                  const sub = typeof inv.subscriptionId === "object" ? inv.subscriptionId : null;
                  const payStatus = sub?.paymentStatus ?? "UNPAID";
                  return (
                    <tr key={inv._id}>
                      <td className={styles.cellId}>{inv.invoiceNumber}</td>
                      <td>
                        <div className={styles.cellName}>{member?.name ?? "—"}</div>
                        <div className={styles.cellEmail}>{member?.email ?? "—"}</div>
                      </td>
                      <td style={{ color: "#666", fontSize: "0.82rem" }}>
                        {inv.items.map(it => it.description).join(", ")}
                      </td>
                      <td className={styles.cellAmount}>₹{inv.subtotal.toLocaleString()}</td>
                      <td style={{ color: "#666" }}>{inv.taxPercentage > 0 ? `${inv.taxPercentage}%` : "—"}</td>
                      <td className={styles.cellAmount}>₹{inv.totalAmount.toLocaleString()}</td>
                      <td>
                        <span className={`${styles.badge} ${badgeClass(payStatus)}`}>
                          {payStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className={styles.cellMono}>
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Delete"
                            onClick={() => deleteInvoice(inv._id)}
                          >✕</button>
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
          <span className={styles.paginationInfo}>Showing {invoices?.length ?? 0} invoices</span>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn}>‹</button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
            <button className={styles.pageBtn}>›</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}