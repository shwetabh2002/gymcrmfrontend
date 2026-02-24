"use client";

import { motion } from "framer-motion";
import styles from "./Payments.module.css";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

const payments = [
  { id: "PAY-4821", user: "Sarah Chen",     amount: "$49.00",  method: "Visa ···4242",       status: "Paid",     date: "Feb 12, 2025", type: "Subscription" },
  { id: "PAY-4820", user: "Priya Sharma",   amount: "$89.00",  method: "Mastercard ···1234", status: "Paid",     date: "Feb 10, 2025", type: "Subscription" },
  { id: "PAY-4819", user: "David Osei",     amount: "$19.00",  method: "PayPal",             status: "Pending",  date: "Mar 1, 2025",  type: "Subscription" },
  { id: "PAY-4818", user: "Mark Torres",    amount: "$19.00",  method: "Visa ···8811",       status: "Failed",   date: "Jan 30, 2025", type: "Subscription" },
  { id: "PAY-4817", user: "Lena Kovacs",    amount: "$89.00",  method: "Visa ···5566",       status: "Paid",     date: "Jan 28, 2025", type: "Subscription" },
  { id: "PAY-4809", user: "James Whitfield",amount: "$49.00",  method: "Amex ···0001",       status: "Refunded", date: "Jan 15, 2025", type: "Adjustment"   },
  { id: "PAY-4800", user: "Aiko Tanaka",    amount: "$49.00",  method: "Visa ···7723",       status: "Paid",     date: "Jan 10, 2025", type: "Subscription" },
];

const STATS = [
  { label: "Total Collected", val: "$24.5k", sub: "this month"      },
  { label: "Pending",         val: "$342",   sub: "12 payments"     },
  { label: "Failed",          val: "$114",   sub: "6 transactions"  },
  { label: "Refunded",        val: "$247",   sub: "3 refunds"       },
];

function badgeClass(st: string) {
  if (st === "Paid")     return styles.badgePaid;
  if (st === "Failed")   return styles.badgeFailed;
  if (st === "Refunded") return styles.badgeRefunded;
  return styles.badgePending;
}

export default function PaymentsPage() {
  return (
    <div className={styles.page}>

      <motion.div className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Payments</h1>
          <p className={styles.pageDesc}>Track all transactions, refunds and payment history.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>⬇ Export CSV</button>
          <button className={styles.btnPrimary}>+ Record Payment</button>
        </div>
      </motion.div>

      <motion.div className={styles.statStrip}
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
      >
        {STATS.map((st) => (
          <div key={st.label} className={styles.statCell}>
            <span className={styles.statLabel}><span className={styles.statLabelDot} />{st.label}</span>
            <span className={styles.statVal}>{st.val}</span>
            <span className={styles.statSub}>{st.sub}</span>
          </div>
        ))}
      </motion.div>

      <motion.div className={styles.card}
        custom={1} variants={fadeUp} initial="hidden" animate="visible"
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />Transaction History</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search by ID or member…" />
            </div>
            <select className={styles.filterSelect}>
              <option>All Status</option>
              <option>Paid</option><option>Pending</option><option>Failed</option><option>Refunded</option>
            </select>
            <select className={styles.filterSelect}>
              <option>This Month</option><option>Last Month</option><option>Last 3 Months</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Payment ID</th><th>Member</th><th>Amount</th>
                <th>Method</th><th>Type</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className={styles.cellId}>{p.id}</td>
                  <td className={styles.cellName}>{p.user}</td>
                  <td className={styles.cellAmount}>{p.amount}</td>
                  <td className={styles.cellMono}>{p.method}</td>
                  <td>{p.type}</td>
                  <td><span className={`${styles.badge} ${badgeClass(p.status)}`}>{p.status}</span></td>
                  <td className={styles.cellMono}>{p.date}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.iconBtn} title="View Receipt">◎</button>
                      <button className={styles.iconBtn} title="Refund">↩</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>Showing 1–7 of 438 transactions</span>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn}>‹</button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
            <button className={styles.pageBtn}>2</button>
            <button className={styles.pageBtn}>3</button>
            <button className={styles.pageBtn}>›</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}