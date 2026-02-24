"use client";

import { motion } from "framer-motion";
import styles from "./Invoices.module.css";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

const invoices = [
  { id: "#4822", user: "Lena Kovacs",     email: "lena.k@gymmail.com",      amount: "$149.00", status: "Paid",     issued: "Mar 1, 2025",  due: "Mar 8, 2025",  plan: "Elite" },
  { id: "#4821", user: "Sarah Chen",      email: "sarah.chen@example.com",  amount: "$49.00",  status: "Paid",     issued: "Feb 12, 2025", due: "Feb 19, 2025", plan: "Pro"   },
  { id: "#4820", user: "Priya Sharma",    email: "priya.s@example.com",     amount: "$89.00",  status: "Paid",     issued: "Feb 10, 2025", due: "Feb 17, 2025", plan: "Elite" },
  { id: "#4819", user: "David Osei",      email: "d.osei@fitness.net",      amount: "$19.00",  status: "Pending",  issued: "Mar 1, 2025",  due: "Mar 8, 2025",  plan: "Basic" },
  { id: "#4818", user: "Mark Torres",     email: "mark.t@domain.io",        amount: "$19.00",  status: "Failed",   issued: "Jan 30, 2025", due: "Feb 6, 2025",  plan: "Basic" },
  { id: "#4817", user: "James Whitfield", email: "jw@example.com",          amount: "$89.00",  status: "Paid",     issued: "Jan 28, 2025", due: "Feb 4, 2025",  plan: "Elite" },
  { id: "#4809", user: "Aiko Tanaka",     email: "aiko.t@domain.jp",        amount: "$49.00",  status: "Refunded", issued: "Jan 15, 2025", due: "Jan 22, 2025", plan: "Pro"   },
];

const STATS = [
  { label: "Total Invoices",  val: "438",  sub: "all time"              },
  { label: "Paid",            val: "412",  sub: "94.1% collection rate" },
  { label: "Outstanding",     val: "$342", sub: "12 invoices"           },
  { label: "Overdue",         val: "6",    sub: "action required"       },
];

function badgeClass(st: string) {
  if (st === "Paid")     return styles.badgePaid;
  if (st === "Failed")   return styles.badgeFailed;
  if (st === "Refunded") return styles.badgeRefunded;
  return styles.badgePending;
}

export default function InvoicesPage() {
  return (
    <div className={styles.page}>

      <motion.div className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Invoices</h1>
          <p className={styles.pageDesc}>Generate, send and track member invoices.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>⬇ Export PDF</button>
          <button className={styles.btnPrimary}>+ New Invoice</button>
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
          <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />All Invoices</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search invoice or member…" />
            </div>
            <select className={styles.filterSelect}>
              <option>All Status</option>
              <option>Paid</option><option>Pending</option><option>Failed</option><option>Refunded</option>
            </select>
            <select className={styles.filterSelect}>
              <option>This Month</option><option>Last Month</option><option>All Time</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice</th><th>Member</th><th>Plan</th><th>Amount</th>
                <th>Status</th><th>Issued</th><th>Due</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className={styles.cellId}>{inv.id}</td>
                  <td>
                    <div className={styles.cellName}>{inv.user}</div>
                    <div className={styles.cellEmail}>{inv.email}</div>
                  </td>
                  <td>{inv.plan}</td>
                  <td className={styles.cellAmount}>{inv.amount}</td>
                  <td><span className={`${styles.badge} ${badgeClass(inv.status)}`}>{inv.status}</span></td>
                  <td className={styles.cellMono}>{inv.issued}</td>
                  <td className={styles.cellMono}>{inv.due}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.iconBtn} title="Preview">◎</button>
                      <button className={styles.iconBtn} title="Download">⬇</button>
                      <button className={styles.iconBtn} title="Send">✉</button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>Showing 1–7 of 438 invoices</span>
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