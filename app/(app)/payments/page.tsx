"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Payments.module.css";
import { usePayments } from "@/services/payments/payments.hooks";
import { useRevenueAnalytics } from "@/services/analytics/analytics.hooks";
import { Payment } from "@/services/payments/payments.api";
import { RecordPaymentModal } from "./PaymentModals";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function getPaymentMember(p: Payment) {
  return typeof p.memberId === "object" && p.memberId !== null ? p.memberId : null;
}

export default function PaymentsPage() {
  const { data: payments, isLoading, isError } = usePayments();
  const { data: revenue } = useRevenueAnalytics();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [search,     setSearch]     = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (!payments) return [];
    return payments.filter(p => {
      const member = getPaymentMember(p);
      const q = search.toLowerCase();
      const matchSearch = !q ||
        member?.name.toLowerCase().includes(q) ||
        member?.email.toLowerCase().includes(q);
      const matchMode = modeFilter === "ALL" || p.paymentMode === modeFilter;
      return matchSearch && matchMode;
    });
  }, [payments, search, modeFilter]);

  const STATS = [
    { label: "Total Collected", val: revenue ? `₹${revenue.totalRevenue.toLocaleString()}`         : "—", sub: "all time" },
    { label: "This Month",      val: revenue ? `₹${revenue.currentMonth.revenue.toLocaleString()}` : "—", sub: `${revenue?.currentMonth.payments ?? 0} payments` },
    { label: "Last Month",      val: revenue ? `₹${revenue.lastMonth.revenue.toLocaleString()}`    : "—", sub: `${revenue?.lastMonth.payments ?? 0} payments` },
    { label: "Pending Amount",  val: revenue ? `₹${revenue.pending.amount.toLocaleString()}`       : "—", sub: `${revenue?.pending.subscriptions ?? 0} subscriptions` },
  ];

  return (
    <div className={styles.page}>
      <AnimatePresence>
        {modalOpen && <RecordPaymentModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Payments</h1>
          <p className={styles.pageDesc}>Track all transactions and payment history.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={() => setModalOpen(true)}>+ Record Payment</button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div className={styles.statStrip} custom={0} variants={fadeUp} initial="hidden" animate="visible">
        {STATS.map(st => (
          <div key={st.label} className={styles.statCell}>
            <span className={styles.statLabel}><span className={styles.statLabelDot} />{st.label}</span>
            <span className={styles.statVal}>{st.val}</span>
            <span className={styles.statSub}>{st.sub}</span>
          </div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div className={styles.card} custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />Transaction History</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search by member…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className={styles.filterSelect} value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
              <option value="ALL">All Modes</option>
              {["CASH", "CARD", "UPI", "ONLINE", "BANK_TRANSFER"].map(m => (
                <option key={m} value={m}>{m.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && <p style={{ padding: "1.5rem", color: "#555" }}>Loading payments…</p>}
          {isError   && <p style={{ padding: "1.5rem", color: "#e63946" }}>Failed to load payments.</p>}
          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "#444", fontSize: "0.875rem" }}>
                      {payments?.length === 0
                        ? "No payments recorded yet."
                        : "No payments match your filters."}
                    </td>
                  </tr>
                )}
                {filtered.map(p => {
                  const member = getPaymentMember(p);
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className={styles.cellName}>{member?.name ?? "—"}</div>
                        <div className={styles.cellMono} style={{ fontSize: "0.78rem", color: "#666" }}>{member?.email ?? "—"}</div>
                      </td>
                      <td className={styles.cellAmount}>₹{p.amount.toLocaleString()}</td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgePaid}`}>
                          {p.paymentMode.replace("_", " ")}
                        </span>
                      </td>
                      <td className={styles.cellMono}>{p.transactionId ?? "—"}</td>
                      <td className={styles.cellMono}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td style={{ color: "#666", fontSize: "0.82rem" }}>{p.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {filtered.length !== (payments?.length ?? 0)
              ? `Showing ${filtered.length} of ${payments?.length ?? 0} payments`
              : `${payments?.length ?? 0} payment${(payments?.length ?? 0) !== 1 ? "s" : ""}`}
          </span>
        </div>
      </motion.div>

      {/* Payment mode breakdown */}
      {revenue?.paymentModeBreakdown && revenue.paymentModeBreakdown.length > 0 && (
        <motion.div className={styles.card} custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />Payment Mode Breakdown</h2>
          </div>
          <div style={{ display: "flex", gap: "1rem", padding: "1.25rem", flexWrap: "wrap" }}>
            {revenue.paymentModeBreakdown.map(mode => (
              <div key={mode._id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "1rem 1.5rem", minWidth: 140 }}>
                <div style={{ fontSize: "0.72rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                  {mode._id.replace("_", " ")}
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>₹{mode.total.toLocaleString()}</div>
                <div style={{ fontSize: "0.78rem", color: "#666", marginTop: "0.2rem" }}>
                  {mode.count} payment{mode.count !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}