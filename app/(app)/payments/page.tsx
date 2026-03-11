"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import styles from "./Payments.module.css";
import { usePayments, useCreatePayment } from "@/services/payments/payments.hooks";
import { useRevenueAnalytics } from "@/services/analytics/analytics.hooks";
import { useMemberSubscriptions } from "@/services/subscriptions/subscriptions.hook";
import { useMembers } from "@/services/members/members.hook";
import { Payment, PaymentMode, CreatePaymentPayload } from "@/services/payments/payments.api";

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

/* ─── Record Payment Modal ──────────────────────────────────── */
function RecordPaymentModal({ onClose }: { onClose: () => void }) {
  const { data: members } = useMembers();
  const { data: subs }    = useMemberSubscriptions();
  const { mutate: create, isPending } = useCreatePayment();

  const [form, setForm] = useState<Partial<CreatePaymentPayload>>({
    paymentMode: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    amount: undefined,
    memberId: "",
    subscriptionId: "",
  });
  const [error, setError] = useState("");

  // Members who currently have an active subscription
  const activeMembers = members?.filter(m => m.currentSubscriptionId) ?? [];

  // ✅ FIX: subs from useMemberSubscriptions() are populated — memberId is an object.
  // We must extract the _id from the object, not compare directly to the string form.memberId.
  const memberSubs = useMemo(() => {
    if (!subs || !form.memberId) return [];
    return subs.filter(s => {
      if (s.subscriptionStatus !== "ACTIVE") return false;
      // memberId can be either a plain string OR a populated object
      const id = typeof s.memberId === "object" ? (s.memberId as any)?._id : s.memberId;
      return id === form.memberId;
    });
  }, [subs, form.memberId]);

  const handleSubmit = () => {
    if (!form.memberId)       { setError("Select a member."); return; }
    if (!form.subscriptionId) { setError("Select a subscription."); return; }
    if (!form.amount || form.amount <= 0) { setError("Enter a valid amount."); return; }
    if (!form.paymentDate)    { setError("Payment date is required."); return; }

    create(form as CreatePaymentPayload, {
      onSuccess: onClose,
      onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to record payment."),
    });
  };

  const is = { background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:6, color:"#fff", fontSize:"0.9rem", padding:"0.6rem 0.85rem", outline:"none", width:"100%", boxSizing:"border-box" as const };
  const ls = { fontSize:"0.75rem", color:"#777", textTransform:"uppercase" as const, letterSpacing:"0.05em" };

  return createPortal(
    <AnimatePresence>
      <>
        <motion.div
          style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          onClick={onClose}
        >
          <motion.div
            style={{ background:"#111",border:"1px solid #2a2a2a",borderRadius:12,padding:"1.75rem",width:"100%",maxWidth:520,boxShadow:"0 24px 64px rgba(0,0,0,0.6)",position:"relative",zIndex:101 }}
            initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.97 }} transition={{ duration:0.25, ease:[0.16,1,0.3,1] as any }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem" }}>
              <h2 style={{ fontSize:"1.05rem",fontWeight:600,color:"#fff",margin:0 }}>Record Payment</h2>
              <button onClick={onClose} style={{ background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:"1rem" }}>✕</button>
            </div>

            {error && (
              <p style={{ fontSize:"0.83rem",color:"#e86d78",background:"rgba(230,57,70,0.07)",border:"1px solid rgba(230,57,70,0.18)",borderRadius:6,padding:"0.55rem 0.85rem",marginBottom:"1rem" }}>
                ⚠ {error}
              </p>
            )}

            <div style={{ display:"flex",flexDirection:"column",gap:"1rem",marginBottom:"1.5rem" }}>
              {/* Member + Subscription */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem" }}>
                <div style={{ display:"flex",flexDirection:"column",gap:"0.4rem" }}>
                  <label style={ls}>Member *</label>
                  <select value={form.memberId}
                    onChange={e => setForm(p => ({ ...p, memberId: e.target.value, subscriptionId: "" }))}
                    style={is}>
                    <option value="">Select member</option>
                    {activeMembers.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:"0.4rem" }}>
                  <label style={ls}>Subscription *</label>
                  <select value={form.subscriptionId}
                    onChange={e => setForm(p => ({ ...p, subscriptionId: e.target.value }))}
                    style={{ ...is, opacity: !form.memberId ? 0.45 : 1, cursor: !form.memberId ? "not-allowed" : "pointer" }}
                    disabled={!form.memberId}>
                    <option value="">
                      {!form.memberId ? "Select member first" : memberSubs.length === 0 ? "No active subscriptions" : "Select subscription"}
                    </option>
                    {memberSubs.map(s => {
                      const plan = typeof s.planId === "object" ? s.planId : null;
                      return (
                        <option key={s._id} value={s._id}>
                          {plan?.name ?? "—"} · pending ₹{s.pendingAmount.toLocaleString()}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Amount + Mode */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem" }}>
                <div style={{ display:"flex",flexDirection:"column",gap:"0.4rem" }}>
                  <label style={ls}>Amount (₹) *</label>
                  <input type="number" min="1" placeholder="0" value={form.amount ?? ""}
                    onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    style={is} />
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:"0.4rem" }}>
                  <label style={ls}>Payment Mode *</label>
                  <select value={form.paymentMode}
                    onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value as PaymentMode }))}
                    style={is}>
                    {(["CASH","CARD","ONLINE","UPI","BANK_TRANSFER"] as PaymentMode[]).map(m => (
                      <option key={m} value={m}>{m.replace("_"," ")}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date + Transaction ID */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem" }}>
                <div style={{ display:"flex",flexDirection:"column",gap:"0.4rem" }}>
                  <label style={ls}>Payment Date *</label>
                  <input type="date" value={form.paymentDate ?? ""}
                    onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))}
                    style={is} />
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:"0.4rem" }}>
                  <label style={ls}>Transaction ID</label>
                  <input type="text" placeholder="Optional" value={form.transactionId ?? ""}
                    onChange={e => setForm(p => ({ ...p, transactionId: e.target.value }))}
                    style={is} />
                </div>
              </div>

              {/* Notes */}
              <div style={{ display:"flex",flexDirection:"column",gap:"0.4rem" }}>
                <label style={ls}>Notes</label>
                <input type="text" placeholder="Optional notes" value={form.notes ?? ""}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  style={is} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display:"flex",justifyContent:"flex-end",gap:"0.75rem" }}>
              <button onClick={onClose}
                style={{ background:"#1e1e1e",color:"#ccc",border:"1px solid #2a2a2a",borderRadius:6,padding:"0.6rem 1.25rem",fontSize:"0.88rem",cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={isPending}
                style={{ background:"#e63946",color:"#fff",border:"none",borderRadius:6,padding:"0.6rem 1.25rem",fontSize:"0.88rem",fontWeight:600,cursor:"pointer",opacity:isPending?0.5:1 }}>
                {isPending ? "Recording…" : "Record Payment"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </>
    </AnimatePresence>,
    document.body
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function PaymentsPage() {
  const { data: payments, isLoading, isError } = usePayments();
  const { data: revenue } = useRevenueAnalytics();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch]       = useState("");
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
    { label: "Total Collected", val: revenue ? `₹${revenue.totalRevenue.toLocaleString()}`             : "—", sub: "all time" },
    { label: "This Month",      val: revenue ? `₹${revenue.currentMonth.revenue.toLocaleString()}`     : "—", sub: `${revenue?.currentMonth.payments ?? 0} payments` },
    { label: "Last Month",      val: revenue ? `₹${revenue.lastMonth.revenue.toLocaleString()}`        : "—", sub: `${revenue?.lastMonth.payments ?? 0} payments` },
    { label: "Pending Amount",  val: revenue ? `₹${revenue.pending.amount.toLocaleString()}`           : "—", sub: `${revenue?.pending.subscriptions ?? 0} subscriptions` },
  ];

  return (
    <div className={styles.page}>
      <AnimatePresence>
        {modalOpen && <RecordPaymentModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div className={styles.pageHeader}
        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.4, ease:[0.16,1,0.3,1] as any }}
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
              {["CASH","CARD","UPI","ONLINE","BANK_TRANSFER"].map(m => (
                <option key={m} value={m}>{m.replace("_"," ")}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && <p style={{ padding:"1.5rem",color:"#555" }}>Loading payments…</p>}
          {isError   && <p style={{ padding:"1.5rem",color:"#e63946" }}>Failed to load payments.</p>}
          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member</th><th>Amount</th><th>Mode</th>
                  <th>Transaction ID</th><th>Date</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ padding:"2rem",textAlign:"center",color:"#444",fontSize:"0.875rem" }}>
                    {payments?.length === 0 ? "No payments recorded yet." : "No payments match your filters."}
                  </td></tr>
                )}
                {filtered.map(p => {
                  const member = getPaymentMember(p);
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className={styles.cellName}>{member?.name ?? "—"}</div>
                        <div className={styles.cellMono} style={{ fontSize:"0.78rem",color:"#666" }}>{member?.email ?? "—"}</div>
                      </td>
                      <td className={styles.cellAmount}>₹{p.amount.toLocaleString()}</td>
                      <td><span className={`${styles.badge} ${styles.badgePaid}`}>{p.paymentMode.replace("_"," ")}</span></td>
                      <td className={styles.cellMono}>{p.transactionId ?? "—"}</td>
                      <td className={styles.cellMono}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td style={{ color:"#666",fontSize:"0.82rem" }}>{p.notes ?? "—"}</td>
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
          <div style={{ display:"flex",gap:"1rem",padding:"1.25rem",flexWrap:"wrap" }}>
            {revenue.paymentModeBreakdown.map(mode => (
              <div key={mode._id} style={{ background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:8,padding:"1rem 1.5rem",minWidth:140 }}>
                <div style={{ fontSize:"0.72rem",color:"#555",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"0.5rem" }}>{mode._id.replace("_"," ")}</div>
                <div style={{ fontSize:"1.25rem",fontWeight:700,color:"#fff" }}>₹{mode.total.toLocaleString()}</div>
                <div style={{ fontSize:"0.78rem",color:"#666",marginTop:"0.2rem" }}>{mode.count} payment{mode.count !== 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}