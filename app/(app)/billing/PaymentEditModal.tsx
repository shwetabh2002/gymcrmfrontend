"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  useUpdatePayment,
  useUploadPaymentProof,
} from "@/services/payments/payments.hooks";
import { useMemberSubscriptions } from "@/services/subscriptions/subscriptions.hook";
import {
  Payment,
  PaymentMode,
  UpdatePaymentPayload,
} from "@/services/payments/payments.api";
import {
  UPLOAD_ACCEPT,
  resolveUploadLimits,
  validateImageFile,
} from "@/lib/upload";
import { formatAmountWithGstInline, resolveInvoiceTax } from "@/lib/tax";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import styles from "./Billing.module.css";

function memberName(p: Payment) {
  return typeof p.memberId === "object" && p.memberId
    ? p.memberId.name
    : "Member";
}

function subIdOf(p: Payment) {
  return typeof p.subscriptionId === "object" && p.subscriptionId
    ? p.subscriptionId._id
    : String(p.subscriptionId);
}

export function PaymentEditModal({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) {
  const { data: subs } = useMemberSubscriptions();
  const { data: gymSettings } = useGymSettings();
  const { taxPercentage, taxMode } = resolveInvoiceTax(gymSettings);
  const { mutateAsync: updatePay, isPending } = useUpdatePayment();
  const { mutateAsync: uploadProof, isPending: uploading } =
    useUploadPaymentProof();
  const uploadLimits = resolveUploadLimits();

  const [amount, setAmount] = useState<number>(payment.amount);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    payment.paymentMode,
  );
  const [paymentDate, setPaymentDate] = useState(
    payment.paymentDate?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(payment.notes ?? "");
  const [transactionId, setTransactionId] = useState(
    payment.transactionId ?? "",
  );
  const [error, setError] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const sub = useMemo(() => {
    const sid = subIdOf(payment);
    return (subs ?? []).find((s) => s._id === sid) ?? null;
  }, [subs, payment]);

  const maxAmount = useMemo(() => {
    if (!sub) return amount;
    // Can keep current amount, or increase up to pending headroom
    return payment.amount + Math.max(0, sub.pendingAmount);
  }, [sub, payment.amount, amount]);

  const busy = isPending || uploading;

  const onProofPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const errMsg = validateImageFile(file, uploadLimits);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setError("");
    setProofFile(file);
  };

  const handleSubmit = async () => {
    if (!(amount > 0)) {
      setError("Enter a valid amount.");
      return;
    }
    if (amount > maxAmount) {
      setError(
        `Amount cannot exceed ₹${maxAmount.toLocaleString("en-IN")} (paid + pending).`,
      );
      return;
    }
    if (!paymentDate) {
      setError("Payment date is required.");
      return;
    }
    setError("");
    try {
      const payload: UpdatePaymentPayload = {
        amount,
        paymentMode,
        paymentDate,
        notes: notes.trim() || undefined,
        transactionId: transactionId.trim() || undefined,
      };
      await updatePay({ id: payment._id, payload });
      if (proofFile) {
        await uploadProof({ id: payment._id, file: proofFile });
      }
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Update failed.");
    }
  };

  return createPortal(
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit payment</h2>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className={styles.fieldHint} style={{ margin: "0 0 8px" }}>
          {memberName(payment)}
          {taxPercentage > 0
            ? ` · ${formatAmountWithGstInline(amount, taxPercentage, taxMode)}`
            : ""}
        </p>

        {error ? <p className={styles.errorBanner}>⚠ {error}</p> : null}

        <div className={styles.formGrid}>
          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Amount (₹) *{sub ? ` · max ${maxAmount.toLocaleString("en-IN")}` : ""}
              </label>
              <input
                type="number"
                min={1}
                max={maxAmount}
                className={styles.input}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Payment date *</label>
              <input
                type="date"
                className={styles.input}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Payment mode</label>
              <select
                className={styles.select}
                value={paymentMode}
                onChange={(e) =>
                  setPaymentMode(e.target.value as PaymentMode)
                }
              >
                {(["CASH", "UPI", "CARD", "BANK_TRANSFER"] as PaymentMode[]).map(
                  (m) => (
                    <option key={m} value={m}>
                      {m.replace("_", " ")}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Txn / UPI ref</label>
              <input
                className={styles.input}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Notes</label>
            <input
              className={styles.input}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Replace screenshot (optional)
            </label>
            {payment.proofUrl ? (
              <a
                href={payment.proofUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.fieldHint}
                style={{ display: "block", marginBottom: 6 }}
              >
                Current proof
              </a>
            ) : null}
            <input
              type="file"
              accept={UPLOAD_ACCEPT}
              onChange={onProofPick}
              disabled={busy}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}
