"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemberSubscriptions, useUpdateMemberSubscription } from "@/services/subscriptions/subscriptions.hook";
import { MemberSubscription } from "@/services/subscriptions/subscriptions.api";
import { CreateSubscriptionModal, DeleteSubDialog, getMember, getPlan } from "./SubscriptionModals";
import PaymentModal from "./PaymentModal";
import styles from "./subscriptions.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function subStatusClass(s: string) {
  if (s === "ACTIVE")    return styles.badgeActive;
  if (s === "EXPIRED")   return styles.badgeExpired;
  if (s === "CANCELLED") return styles.badgeCancelled;
  return "";
}

function payStatusClass(s: string) {
  if (s === "FULLY_PAID")     return styles.badgeFullyPaid;
  if (s === "PARTIALLY_PAID") return styles.badgePartiallyPaid;
  return styles.badgeUnpaid;
}

function CancelPopover({ onConfirm, onDismiss, isPending }: {
  onConfirm: () => void; onDismiss: () => void; isPending: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute", right: 0, top: "calc(100% + 6px)",
        background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8,
        padding: "12px 14px", zIndex: 50, width: 200,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <p style={{ fontSize: "0.78rem", color: "#aaa", margin: "0 0 10px", lineHeight: 1.5 }}>
        Cancel this subscription?
      </p>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onDismiss}
          style={{ flex: 1, background: "#1e1e1e", color: "#ccc", border: "1px solid #2a2a2a", borderRadius: 5, padding: "5px 0", fontSize: "0.78rem", cursor: "pointer" }}>
          No
        </button>
        <button onClick={onConfirm} disabled={isPending}
          style={{ flex: 1, background: "transparent", color: "#f0a44b", border: "1px solid rgba(240,164,75,0.4)", borderRadius: 5, padding: "5px 0", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", opacity: isPending ? 0.5 : 1 }}>
          {isPending ? "…" : "Yes"}
        </button>
      </div>
    </motion.div>
  );
}

export default function SubscriptionsPage() {
  const { data: subs, isLoading, isError } = useMemberSubscriptions();
  const { mutate: updateSub, isPending: isUpdating } = useUpdateMemberSubscription();

  const [createOpen,    setCreateOpen]    = useState(false);
  const [paymentOpen,   setPaymentOpen]   = useState(false);
  const [delTarget,     setDelTarget]     = useState<MemberSubscription | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<MemberSubscription | null>(null);
  const [cancelTarget,  setCancelTarget]  = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [payFilter,     setPayFilter]     = useState("ALL");

  const total     = subs?.length ?? 0;
  const active    = subs?.filter(s => s.subscriptionStatus === "ACTIVE").length ?? 0;
  const expired   = subs?.filter(s => s.subscriptionStatus === "EXPIRED").length ?? 0;
  const totalPending = subs?.reduce((acc, s) => acc + (s.pendingAmount ?? 0), 0) ?? 0;

  const filtered = useMemo(() => {
    if (!subs) return [];
    return subs.filter(sub => {
      const member = getMember(sub);
      const plan   = getPlan(sub);
      const q = search.toLowerCase();
      const matchSearch = !q ||
        member?.name.toLowerCase().includes(q) ||
        (member?.contactNumber ?? "").includes(q) ||
        plan?.name.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || sub.subscriptionStatus === statusFilter;
      const matchPay    = payFilter    === "ALL" || sub.paymentStatus === payFilter;
      return matchSearch && matchStatus && matchPay;
    });
  }, [subs, search, statusFilter, payFilter]);

  const handleCancel = (id: string) => {
    updateSub(
      { id, payload: { subscriptionStatus: "CANCELLED" } },
      { onSuccess: () => setCancelTarget(null) }
    );
  };

  return (
    <div className={styles.page}>
      <AnimatePresence>
        {createOpen && <CreateSubscriptionModal onClose={() => setCreateOpen(false)} />}
        {paymentOpen && <PaymentModal open={paymentOpen} onClose={() => { setPaymentOpen(false); setPaymentTarget(null); }} subscription={paymentTarget} />}
        {delTarget  && <DeleteSubDialog sub={delTarget} onClose={() => setDelTarget(null)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div className={styles.header}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.headerLabel}><span className={styles.headerLabelLine} />Admin Panel</p>
          <h1 className={styles.headerTitle}>Subscriptions</h1>
          <p className={styles.headerSub}>Manage member subscriptions and payment status.</p>
        </div>
        <button className={styles.assignBtn} onClick={() => setCreateOpen(true)}>
          + Assign Subscription
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div className={styles.statsGrid} custom={0} variants={fadeUp} initial="hidden" animate="visible">
        {[
          { label: "Total",    val: total },
          { label: "Active",   val: active },
          { label: "Expired",  val: expired },
          { label: "Pending ₹", val: `₹${totalPending.toLocaleString("en-IN")}` },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statLabel}><span className={styles.statDot} />{s.label}</span>
            <span className={styles.statValue}>{isLoading ? "…" : s.val}</span>
          </div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div className={styles.tableCard} custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}><span className={styles.tableTitleAccent} />All Subscriptions</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search member, plan…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select className={styles.filterSelect} value={payFilter} onChange={e => setPayFilter(e.target.value)}>
              <option value="ALL">All Payment</option>
              <option value="FULLY_PAID">Fully Paid</option>
              <option value="PARTIALLY_PAID">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && <p className={styles.stateLoading}>Loading subscriptions…</p>}
          {isError   && <p className={styles.stateError}>Failed to load subscriptions. Please refresh.</p>}

          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  {["Member", "Contact", "Plan", "Start", "Expiry", "Plan Price", "Paid", "Pending", "Pay Status", "Status", "Actions"].map(h => (
                    <th key={h} className={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className={styles.stateEmpty}>
                    {total === 0 ? "No subscriptions yet. Assign one to get started." : "No subscriptions match your filters."}
                  </td></tr>
                )}
                {filtered.map(sub => {
                  const member = getMember(sub);
                  const plan   = getPlan(sub);
                  const isCancelTarget = cancelTarget === sub._id;
                  return (
                    <tr key={sub._id} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.memberName}>{member?.name ?? "—"}</div>
                        {member?.instagramHandle && <div className={styles.memberEmail}>{member.instagramHandle}</div>}
                      </td>
                      <td className={`${styles.td} ${styles.tdMono}`}>{member?.contactNumber ?? "—"}</td>
                      <td className={`${styles.td} ${styles.tdPlanName}`}>{plan?.name ?? "—"}</td>
                      <td className={`${styles.td} ${styles.tdMono}`}>{new Date(sub.startDate).toLocaleDateString("en-IN")}</td>
                      <td className={`${styles.td} ${styles.tdMono}`}>{new Date(sub.expiryDate).toLocaleDateString("en-IN")}</td>
                      <td className={`${styles.td} ${styles.tdPrice}`}>₹{sub.planPrice?.toLocaleString("en-IN") ?? "—"}</td>
                      <td className={`${styles.td} ${styles.tdPaid}`}>₹{sub.totalPaid?.toLocaleString("en-IN") ?? "0"}</td>
                      <td className={`${styles.td} ${sub.pendingAmount > 0 ? styles.tdPendingPositive : styles.tdPendingClear}`}>
                        {sub.pendingAmount > 0 ? `₹${sub.pendingAmount.toLocaleString("en-IN")}` : "Nil"}
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.badge} ${payStatusClass(sub.paymentStatus)}`}>
                          {sub.paymentStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.badge} ${subStatusClass(sub.subscriptionStatus)}`}>{sub.subscriptionStatus}</span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actionGroup}>
                          {sub.subscriptionStatus === "ACTIVE" && sub.pendingAmount > 0 && (
                            <button className={`${styles.actionBtn} ${styles.actionBtnPay}`}
                              onClick={() => { setPaymentTarget(sub); setPaymentOpen(true); }} title="Record Payment">₹</button>
                          )}
                          {sub.subscriptionStatus === "ACTIVE" && (
                            <>
                              <button className={`${styles.actionBtn} ${styles.actionBtnCancel}`}
                                onClick={() => setCancelTarget(isCancelTarget ? null : sub._id)} title="Cancel">⊘</button>
                              <AnimatePresence>
                                {isCancelTarget && (
                                  <CancelPopover
                                    onConfirm={() => handleCancel(sub._id)}
                                    onDismiss={() => setCancelTarget(null)}
                                    isPending={isUpdating}
                                  />
                                )}
                              </AnimatePresence>
                            </>
                          )}
                          <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            onClick={() => setDelTarget(sub)} title="Delete">✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.tableFooter}>
          <span className={styles.tableCount}>
            {filtered.length !== total
              ? `Showing ${filtered.length} of ${total} subscriptions`
              : `${total} subscription${total !== 1 ? "s" : ""}`}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
