"use client";

import { motion, useReducedMotion } from "framer-motion";
import styles from "./FeatureMoments.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

const MOMENTS = [
  {
    n: "01",
    title: "Renewals don’t ghost you",
    body: "Expiry queue shows who is due, who promised, and who vanished — so your desk calls the right person first.",
    flip: false,
    visual: "renewals" as const,
  },
  {
    n: "02",
    title: "Money with a name on it",
    body: "Cash, UPI, card. Every payment linked to a member and the staffer who took it. Dues stay visible until cleared.",
    flip: true,
    visual: "money" as const,
  },
  {
    n: "03",
    title: "Staff that can’t break the books",
    body: "Trainers sell. Desk collects. Owners see all. Permissions keep curiosity out of your ledger.",
    flip: false,
    visual: "roles" as const,
  },
] as const;

function RenewalsPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <span>Expiry queue</span>
        <span className={styles.badgeWarn}>3 at risk</span>
      </div>
      <div className={styles.queueRow}>
        <span className={styles.avatar}>RM</span>
        <div>
          <strong>Rohan Kulkarni</strong>
          <em>Expires today</em>
        </div>
        <span className={styles.pillDanger}>At risk</span>
      </div>
      <div className={styles.queueRow}>
        <span className={styles.avatar}>PS</span>
        <div>
          <strong>Priya Shah</strong>
          <em>In 4 days</em>
        </div>
        <span className={styles.pill}>Follow up</span>
      </div>
      <div className={styles.queueRow}>
        <span className={styles.avatar}>AM</span>
        <div>
          <strong>Aarav Mehta</strong>
          <em>Promised ₹4,999</em>
        </div>
        <span className={styles.pillOk}>Promised</span>
      </div>
    </div>
  );
}

function MoneyPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <span>Today’s collections</span>
        <span className={styles.amount}>₹48,200</span>
      </div>
      <div className={styles.payRow}>
        <div>
          <strong>Neha Iyer</strong>
          <em>UPI · Desk · Ananya</em>
        </div>
        <span className={styles.money}>₹2,999</span>
      </div>
      <div className={styles.payRow}>
        <div>
          <strong>Vikram Rao</strong>
          <em>Cash · Trainer · Kabir</em>
        </div>
        <span className={styles.money}>₹4,999</span>
      </div>
      <div className={styles.payRowMuted}>
        <div>
          <strong>Due · Sana Kapoor</strong>
          <em>Plan expired · 2 days</em>
        </div>
        <span className={styles.due}>₹3,499</span>
      </div>
    </div>
  );
}

function RolesPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <span>Roles</span>
        <span className={styles.badgeOk}>Locked down</span>
      </div>
      <div className={styles.roleRow}>
        <span className={styles.roleName}>Owner</span>
        <span className={styles.rolePerms}>All modules · Ledger · Staff</span>
      </div>
      <div className={styles.roleRow}>
        <span className={styles.roleName}>Desk</span>
        <span className={styles.rolePerms}>Members · Collect · Renewals</span>
      </div>
      <div className={styles.roleRowDim}>
        <span className={styles.roleName}>Trainer</span>
        <span className={styles.rolePerms}>Sell plans · No ledger access</span>
      </div>
    </div>
  );
}

function Panel({ kind }: { kind: (typeof MOMENTS)[number]["visual"] }) {
  if (kind === "renewals") return <RenewalsPanel />;
  if (kind === "money") return <MoneyPanel />;
  return <RolesPanel />;
}

/** Mini CRM fragments — visual proof under the desk. */
export default function FeatureMoments() {
  const reduce = useReducedMotion();

  return (
    <div className={styles.wrap}>
      {MOMENTS.map((m) => {
        const fromCopy = m.flip ? 28 : -28;
        const fromPanel = m.flip ? -36 : 36;

        return (
          <motion.article
            key={m.n}
            className={m.flip ? `${styles.row} ${styles.rowFlip}` : styles.row}
            initial={reduce ? false : { opacity: 0, y: 36 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease }}
          >
            <motion.div
              className={styles.copy}
              initial={reduce ? false : { opacity: 0, x: fromCopy }}
              whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.65, delay: 0.08, ease }}
            >
              <span className={styles.n}>{m.n}</span>
              <h3 className={styles.title}>{m.title}</h3>
              <p className={styles.body}>{m.body}</p>
            </motion.div>

            <motion.div
              className={styles.visual}
              aria-hidden
              initial={reduce ? false : { opacity: 0, x: fromPanel, scale: 0.96 }}
              whileInView={reduce ? undefined : { opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.75, delay: 0.14, ease }}
              whileHover={reduce ? undefined : { y: -4, transition: { duration: 0.25 } }}
            >
              <Panel kind={m.visual} />
            </motion.div>
          </motion.article>
        );
      })}
    </div>
  );
}
