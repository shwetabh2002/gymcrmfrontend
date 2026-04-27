"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Member, membersApi } from "@/services/members/members.api";
import { paymentsApi } from "@/services/payments/payments.api";
import styles from "./MemberHistoryModal.module.css";

interface Props {
  open: boolean;
  member: Member | null;
  onClose: () => void;
}

type HistoryPayment = {
  id: string;
  paymentDate: string;
  amount: number;
  mode: string;
  transactionId?: string;
  notes?: string;
};

function fmtDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(v?: number) {
  if (v == null) return "—";
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function MemberHistoryModal({ open, member, onClose }: Props) {
  const memberId = member?._id;

  const memberQuery = useQuery({
    queryKey: ["member-history", "member", memberId],
    enabled: open && !!memberId,
    queryFn: async () => {
      const res = await membersApi.getMemberById(memberId!);
      return (res as unknown as Member) ?? member!;
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["member-history", "payments", memberId],
    enabled: open && !!memberId,
    queryFn: async () => {
      const [recorded, generic] = await Promise.allSettled([
        membersApi.getMemberPayments(memberId!),
        paymentsApi.getPaymentsByMember(memberId!),
      ]);

      const recordedRows =
        recorded.status === "fulfilled"
          ? (Array.isArray(recorded.value) ? recorded.value : []).map((p) => ({
              id: `mp-${p._id}`,
              paymentDate: p.paymentDate,
              amount: p.received ?? p.amount,
              mode: p.mop,
              transactionId: p.transactionId ?? undefined,
              notes: p.notes ?? undefined,
            }) as HistoryPayment)
          : [];

      const genericRows =
        generic.status === "fulfilled"
          ? (Array.isArray(generic.value) ? generic.value : []).map((p) => ({
              id: `p-${p._id}`,
              paymentDate: p.paymentDate,
              amount: p.amount,
              mode: p.paymentMode,
              transactionId: p.transactionId ?? undefined,
              notes: p.notes ?? undefined,
            }) as HistoryPayment)
          : [];

      const all = [...recordedRows, ...genericRows];
      all.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      return all;
    },
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !member) return null;

  const fullMember = memberQuery.data ?? member;
  const memberships = [...(fullMember.memberships ?? [])].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const payments = paymentsQuery.data ?? [];

  const isLoading = memberQuery.isLoading || paymentsQuery.isLoading;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{fullMember.name}</h2>
            <p className={styles.subtitle}>
              {fullMember.contactNumber || fullMember.phone || "—"} · {fullMember.email || "No email"}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {isLoading && <p className={styles.loading}>Loading member history…</p>}

        {!isLoading && (
          <div className={styles.body}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Overview</h3>
              <div className={styles.grid}>
                <div>
                  <span className={styles.k}>Member ID</span>
                  <span className={styles.v}>{fullMember.idNo || "—"}</span>
                </div>
                <div>
                  <span className={styles.k}>Status</span>
                  <span className={styles.v}>{fullMember.memberStatus || "—"}</span>
                </div>
                <div>
                  <span className={styles.k}>Training</span>
                  <span className={styles.v}>{fullMember.trainingType || "—"}</span>
                </div>
                <div>
                  <span className={styles.k}>Member Type</span>
                  <span className={styles.v}>{fullMember.memberType || "—"}</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Plan History</h3>
              {memberships.length === 0 ? (
                <p className={styles.empty}>No plan history found.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Start</th>
                      <th>Expiry</th>
                      <th>Months</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberships.map((s) => (
                      <tr key={s._id}>
                        <td>{fmtDate(s.startDate)}</td>
                        <td>{fmtDate(s.expiryDate)}</td>
                        <td>{s.months}</td>
                        <td>{money(s.totalAmount)}</td>
                        <td>{money(s.amountPaid)}</td>
                        <td>{money(s.pendingAmount)}</td>
                        <td>{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Payment History</h3>
              {payments.length === 0 ? (
                <p className={styles.empty}>No payments found.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Transaction ID</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{fmtDateTime(p.paymentDate)}</td>
                        <td>{money(p.amount)}</td>
                        <td>{p.mode}</td>
                        <td>{p.transactionId || "—"}</td>
                        <td>{p.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

