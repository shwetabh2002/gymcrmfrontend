"use client";

import { motion } from "framer-motion";
import styles from "./Plans.module.css";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

const plans = [
  { name: "Basic", price: "$19/mo", members: 412, color: "#888",         features: ["Gym Access", "Locker Room", "1 Group Class/wk"] },
  { name: "Pro",   price: "$49/mo", members: 358, color: "var(--red)",   features: ["All Basic", "Unlimited Classes", "1 PT Session/mo", "App Access"] },
  { name: "Elite", price: "$89/mo", members: 100, color: "#f0a44b",      features: ["All Pro", "4 PT Sessions/mo", "Nutrition Plan", "Priority Support"] },
];

const subs = [
  { id: "SUB-001", user: "Sarah Chen",   plan: "Pro",   status: "Active",   start: "Jan 12, 2025", next: "Feb 12, 2025", amount: "$49" },
  { id: "SUB-002", user: "Mark Torres",  plan: "Basic", status: "Inactive", start: "Nov 3, 2024",  next: "—",            amount: "$19" },
  { id: "SUB-003", user: "Lena Kovacs",  plan: "Elite", status: "Active",   start: "Feb 28, 2025", next: "Mar 28, 2025", amount: "$89" },
  { id: "SUB-004", user: "David Osei",   plan: "Basic", status: "Trialing", start: "Mar 1, 2025",  next: "Mar 15, 2025", amount: "$0"  },
  { id: "SUB-005", user: "Priya Sharma", plan: "Elite", status: "Active",   start: "Dec 15, 2024", next: "Apr 15, 2025", amount: "$89" },
];

const STATS = [
  { label: "Total Subscriptions", val: "870",   sub: "+12 this month"  },
  { label: "MRR",                 val: "$32.4k", sub: "+8.2% vs last mo"},
  { label: "Churn Rate",          val: "2.1%",  sub: "↓ from 3.4%"     },
  { label: "Trialing",            val: "24",    sub: "ends in 14 days"  },
];

function badgeClass(st: string) {
  if (st === "Active")   return styles.badgeActive;
  if (st === "Inactive") return styles.badgeInactive;
  if (st === "Trialing") return styles.badgeTrialing;
  return styles.badgePending;
}

export default function Plans() {
  return (
    <div className={styles.page}>

      <motion.div className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Subscription Plans</h1>
          <p className={styles.pageDesc}>Manage plans, pricing and member subscriptions.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>⬇ Export</button>
          <button className={styles.btnPrimary}>+ New Plan</button>
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

      <motion.div className={styles.plansGrid}
        custom={1} variants={fadeUp} initial="hidden" animate="visible"
      >
        {plans.map((plan) => (
          <div key={plan.name} className={styles.planCard}>
            <div className={styles.planAccent} style={{ background: `linear-gradient(90deg, ${plan.color}, transparent)` }} />
            <div className={styles.planBody}>
              <div className={styles.planTop}>
                <span className={styles.planName}>{plan.name}</span>
                <span className={styles.planPrice} style={{ color: plan.color }}>{plan.price}</span>
              </div>
              <div className={styles.planMembers}>{plan.members} active members</div>
              <div className={styles.planFeatures}>
                {plan.features.map((f) => (
                  <div key={f} className={styles.planFeature}>
                    <span className={styles.planFeatureCheck} style={{ color: plan.color }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className={styles.planActions}>
                <button className={styles.btnSecondary} style={{ flex: 1, justifyContent: "center" }}>Edit Plan</button>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div className={styles.card}
        custom={2} variants={fadeUp} initial="hidden" animate="visible"
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />Active Subscriptions</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search subscriptions…" />
            </div>
            <select className={styles.filterSelect}>
              <option>All Plans</option>
              <option>Basic</option><option>Pro</option><option>Elite</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sub ID</th><th>Member</th><th>Plan</th><th>Status</th>
                <th>Start Date</th><th>Next Billing</th><th>Amount</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => (
                <tr key={sub.id}>
                  <td className={styles.cellMono}>{sub.id}</td>
                  <td className={styles.cellName}>{sub.user}</td>
                  <td>{sub.plan}</td>
                  <td><span className={`${styles.badge} ${badgeClass(sub.status)}`}>{sub.status}</span></td>
                  <td className={styles.cellMono}>{sub.start}</td>
                  <td className={styles.cellMono}>{sub.next}</td>
                  <td className={styles.cellAmount}>{sub.amount}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.iconBtn}>◎</button>
                      <button className={styles.iconBtn}>✎</button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>Showing 1–5 of 870 subscriptions</span>
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