"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Member } from "@/services/members/members.api";
import { useAddPayment } from "@/services/members/members.hook";
import styles from "./MemberModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  member: Member | null;
}

function toYmd(v?: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function addMonths(startYmd: string, months: number): string {
  if (!startYmd || !months || months < 1) return startYmd;
  const [y, m, d] = startYmd.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setMonth(dt.getMonth() + months);
  return dt.toISOString().split("T")[0];
}

export default function RenewalModal({ open, onClose, member }: Props) {
  const { mutate: addPayment, isPending } = useAddPayment();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    amount: 0,
    received: 0,
    pending: 0,
    pendingDueDate: "",
    mop: "cash",
    paymentDate: new Date().toISOString().split("T")[0],
    transactionId: "",
    notes: "",
    renewalMonths: 1,
    renewalStartDate: "",
    newExpiryDate: "",
    packageName: "",
    trainingType: "GT",
    trainer: "",
    salesPerson: "",
    memberType: "Renewal",
  });

  const activeMembership = useMemo(
    () => member?.memberships?.find((m) => m.status === "ACTIVE") || null,
    [member],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !member) return;
    const prevStart = toYmd(activeMembership?.startDate || member.startingDate);
    const prevExpiry = toYmd(activeMembership?.expiryDate || member.expiryDate);
    const months = activeMembership?.months || member.membershipMonths || 1;
    const amount = activeMembership?.totalAmount || member.membershipAmount || member.amount || 0;
    const start = prevExpiry ? toYmd(new Date(new Date(prevExpiry).getTime() + 24 * 60 * 60 * 1000).toISOString()) : new Date().toISOString().split("T")[0];
    const expiry = addMonths(start, months);
    const pkg = activeMembership?.package || `${months} MONTH`;

    setForm({
      amount,
      received: amount,
      pending: 0,
      pendingDueDate: "",
      mop: "cash",
      paymentDate: new Date().toISOString().split("T")[0],
      transactionId: "",
      notes: "Membership renewal",
      renewalMonths: months,
      renewalStartDate: start,
      newExpiryDate: expiry,
      packageName: pkg,
      trainingType: activeMembership?.trainingType || member.trainingType || "GT",
      trainer: activeMembership?.trainer || member.trainer || "",
      salesPerson: activeMembership?.salesPerson || member.salesPerson || "",
      memberType: "Renewal",
    });
    setError("");
  }, [open, member, activeMembership]);

  const prevStartDate = toYmd(activeMembership?.startDate || member?.startingDate);
  const prevExpiryDate = toYmd(activeMembership?.expiryDate || member?.expiryDate);

  const onField = (name: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value } as typeof prev;
      if (name === "amount" || name === "received" || name === "renewalMonths") {
        const amount = name === "amount" ? Number(value || 0) : Number(next.amount || 0);
        const received = name === "received" ? Number(value || 0) : Number(next.received || 0);
        const months = name === "renewalMonths" ? Number(value || 0) : Number(next.renewalMonths || 0);
        next.amount = amount;
        next.received = received;
        next.pending = Math.max(0, amount - received);
        if (name === "renewalMonths" && months > 0 && next.renewalStartDate) {
          next.newExpiryDate = addMonths(next.renewalStartDate, months);
        }
      }
      if (name === "renewalStartDate" && value) {
        next.newExpiryDate = addMonths(value, Number(next.renewalMonths || 0));
      }
      return next;
    });
  };

  const submit = () => {
    if (!member) return;
    if (!form.renewalStartDate || !form.newExpiryDate) {
      setError("Start date and expiry date are required.");
      return;
    }
    if (form.amount <= 0) {
      setError("Amount should be greater than 0.");
      return;
    }
    if (form.received < 0 || form.received > form.amount) {
      setError("Received must be between 0 and total amount.");
      return;
    }
    if (form.renewalMonths < 1) {
      setError("Renewal months should be at least 1.");
      return;
    }

    addPayment(
      {
        memberId: member._id,
        amount: form.amount,
        received: form.received,
        pending: form.pending,
        pendingDueDate: form.pending > 0 ? form.pendingDueDate || undefined : undefined,
        mop: form.mop,
        paymentDate: form.paymentDate,
        transactionId: form.transactionId || undefined,
        notes: form.notes || "Membership renewal",
        renewalMonths: form.renewalMonths,
        renewalStartDate: form.renewalStartDate,
        newExpiryDate: form.newExpiryDate,
        packageName: form.packageName || undefined,
        trainingType: form.trainingType || undefined,
        trainer: form.trainer || undefined,
        salesPerson: form.salesPerson || undefined,
        memberType: form.memberType || "Renewal",
      },
      {
        onSuccess: () => onClose(),
        onError: (err: any) =>
          setError(err?.response?.data?.message ?? "Failed to renew membership."),
      },
    );
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && member && (
        <>
          <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Renewal</h2>
                <p className={styles.modalSubtitle}>Renew membership for {member.name}</p>
              </div>
              <button className={styles.modalClose} onClick={onClose}>✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.scrollBody}>
              <div className={styles.sectionLabel}>Previous Membership (Reference)</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Previous Start</label>
                    <input className={styles.input} value={prevStartDate} disabled />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Previous Expiry</label>
                    <input className={styles.input} value={prevExpiryDate} disabled />
                  </div>
                </div>
              </div>

              <div className={styles.sectionLabel}>Renewal Details (Editable)</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Package</label>
                    <input className={styles.input} value={form.packageName} onChange={(e) => onField("packageName", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Months</label>
                    <input className={styles.input} type="number" min={1} value={form.renewalMonths} onChange={(e) => onField("renewalMonths", e.target.value)} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Renewal Start Date</label>
                    <input className={styles.input} type="date" value={form.renewalStartDate} onChange={(e) => onField("renewalStartDate", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Renewal Expiry Date</label>
                    <input className={styles.input} type="date" value={form.newExpiryDate} onChange={(e) => onField("newExpiryDate", e.target.value)} />
                  </div>
                </div>

                <div className={styles.row3}>
                  <div className={styles.field}>
                    <label className={styles.label}>Amount</label>
                    <input className={styles.input} type="number" value={form.amount} onChange={(e) => onField("amount", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Received</label>
                    <input className={styles.input} type="number" value={form.received} onChange={(e) => onField("received", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Pending</label>
                    <input className={styles.input} type="number" value={form.pending} disabled />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Pending Due Date</label>
                    <input className={styles.input} type="date" value={form.pendingDueDate} onChange={(e) => onField("pendingDueDate", e.target.value)} disabled={form.pending <= 0} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Payment Date</label>
                    <input className={styles.input} type="date" value={form.paymentDate} onChange={(e) => onField("paymentDate", e.target.value)} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Mode</label>
                    <select className={styles.input} value={form.mop} onChange={(e) => onField("mop", e.target.value)}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Transaction ID</label>
                    <input className={styles.input} value={form.transactionId} onChange={(e) => onField("transactionId", e.target.value)} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Training Type</label>
                    <select className={styles.input} value={form.trainingType} onChange={(e) => onField("trainingType", e.target.value)}>
                      <option value="GT">GT</option>
                      <option value="PT">PT</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Member Type</label>
                    <input className={styles.input} value={form.memberType} onChange={(e) => onField("memberType", e.target.value)} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Trainer</label>
                    <input className={styles.input} value={form.trainer} onChange={(e) => onField("trainer", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Sales Person</label>
                    <input className={styles.input} value={form.salesPerson} onChange={(e) => onField("salesPerson", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={submit} disabled={isPending}>
                {isPending ? "Renewing..." : "Renew"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

