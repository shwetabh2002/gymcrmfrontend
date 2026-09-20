"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Member } from "@/services/members/members.api";
import { useMemberSubscriptionsByMember } from "@/services/subscriptions/subscriptions.hook";
import { usePaymentsByMember } from "@/services/payments/payments.hooks";
import { MemberSubscription } from "@/services/subscriptions/subscriptions.api";
import { Payment } from "@/services/payments/payments.api";
import styles from "./MemberModal.module.css";
import { EASE_OUT_EXPO } from "@/config/motion";

interface Props {
  open: boolean;
  onClose: () => void;
  member: Member | null;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function money(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function planName(sub: MemberSubscription) {
  return typeof sub.planId === "object" && sub.planId
    ? sub.planId.name
    : "Plan";
}

type TimelineEvent = {
  id: string;
  at: number;
  kind: "joined" | "subscription" | "payment";
  title: string;
  detail: string;
};

export default function MemberLifecycleModal({
  open,
  onClose,
  member,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const memberId = member?._id ?? "";
  const { data: subs, isLoading: loadingSubs } =
    useMemberSubscriptionsByMember(memberId);
  const { data: payments, isLoading: loadingPay } =
    usePaymentsByMember(memberId);

  useEffect(() => setMounted(true), []);

  const sortedSubs = useMemo(() => {
    const list = [...(subs ?? [])];
    list.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    return list;
  }, [subs]);

  const sortedPayments = useMemo(() => {
    const list = [...(payments ?? [])];
    list.sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
    );
    return list;
  }, [payments]);

  const timeline = useMemo(() => {
    if (!member) return [];
    const events: TimelineEvent[] = [];
    const joined =
      member.registrationDate || member.date || member.createdAt || null;
    if (joined) {
      events.push({
        id: "joined",
        at: new Date(joined).getTime(),
        kind: "joined",
        title: "Joined gym",
        detail: `Member ID ${member.idNo || "—"} · ${formatDate(joined)}`,
      });
    }
    for (const s of sortedSubs) {
      events.push({
        id: `sub-${s._id}`,
        at: new Date(s.startDate).getTime(),
        kind: "subscription",
        title: `Subscription · ${planName(s)}`,
        detail: `${formatDate(s.startDate)} → ${formatDate(s.expiryDate)} · ${s.subscriptionStatus} · ${money(s.totalPaid)} / ${money(s.planPrice)}${s.pendingAmount > 0 ? ` · pending ${money(s.pendingAmount)}` : ""}`,
      });
    }
    for (const p of sortedPayments) {
      events.push({
        id: `pay-${p._id}`,
        at: new Date(p.paymentDate).getTime(),
        kind: "payment",
        title: `Payment · ${money(p.amount)}`,
        detail: `${formatDate(p.paymentDate)} · ${p.paymentMode}${p.notes ? ` · ${p.notes}` : ""}`,
      });
    }
    events.sort((a, b) => a.at - b.at);
    return events;
  }, [member, sortedSubs, sortedPayments]);

  const firstSub = sortedSubs[0];
  const loading = loadingSubs || loadingPay;

  const content = (
    <AnimatePresence>
      {open && member && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modal}
            style={{ width: 720, maxWidth: "calc(100vw - 2rem)" }}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Member lifecycle</h2>
                <p className={styles.modalSubtitle}>
                  {member.name}
                  {member.idNo ? ` · ${member.idNo}` : ""} ·{" "}
                  {member.countryCode || "+91"}{" "}
                  {member.contactNumber || member.phone || "—"}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles.scrollBody}>
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Snapshot</p>
                <div className={styles.hint} style={{ lineHeight: 1.7 }}>
                  Joined {formatDate(member.registrationDate || member.date)}
                  {" · "}
                  First plan{" "}
                  {firstSub
                    ? `${planName(firstSub)} (${formatDate(firstSub.startDate)})`
                    : "—"}
                  {" · "}
                  Current expiry {formatDate(member.expiryDate)}
                  {" · "}
                  Status {member.memberStatus}
                  {(member.pending ?? 0) > 0
                    ? ` · Pending ${money(member.pending ?? 0)}`
                    : ""}
                </div>
              </div>

              <div className={styles.section}>
                <p className={styles.sectionLabel}>Timeline</p>
                {loading ? (
                  <p className={styles.hint}>Loading history…</p>
                ) : timeline.length === 0 ? (
                  <p className={styles.hint}>No history yet.</p>
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {timeline.map((ev) => (
                      <li
                        key={ev.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "14px 1fr",
                          gap: 12,
                          alignItems: "start",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            marginTop: 6,
                            background:
                              ev.kind === "payment"
                                ? "#3d9a6a"
                                : ev.kind === "subscription"
                                  ? "#5b8def"
                                  : "#888",
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#e8e8e8",
                            }}
                          >
                            {ev.title}
                          </div>
                          <div className={styles.hint}>{ev.detail}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.section}>
                <p className={styles.sectionLabel}>All subscriptions</p>
                {sortedSubs.length === 0 && !loading ? (
                  <p className={styles.hint}>No subscriptions.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sortedSubs.map((s) => (
                      <div
                        key={s._id}
                        style={{
                          border: "1px solid #242424",
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontSize: 12,
                          color: "#bbb",
                        }}
                      >
                        <div style={{ color: "#e8e8e8", fontWeight: 600 }}>
                          {planName(s)} · {s.subscriptionStatus}
                        </div>
                        <div>
                          {formatDate(s.startDate)} → {formatDate(s.expiryDate)}
                        </div>
                        <div>
                          {money(s.totalPaid)} paid of {money(s.planPrice)}
                          {s.pendingAmount > 0
                            ? ` · pending ${money(s.pendingAmount)}`
                            : ""}
                          {s.paymentStatus ? ` · ${s.paymentStatus}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.section}>
                <p className={styles.sectionLabel}>Payments</p>
                {sortedPayments.length === 0 && !loading ? (
                  <p className={styles.hint}>No payments recorded.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sortedPayments.map((p: Payment) => (
                      <div
                        key={p._id}
                        style={{
                          border: "1px solid #242424",
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontSize: 12,
                          color: "#bbb",
                        }}
                      >
                        <div style={{ color: "#e8e8e8", fontWeight: 600 }}>
                          {money(p.amount)} · {p.paymentMode}
                        </div>
                        <div>
                          {formatDate(p.paymentDate)}
                          {p.notes ? ` · ${p.notes}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
