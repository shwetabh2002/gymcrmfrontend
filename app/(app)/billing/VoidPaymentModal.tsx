"use client";

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useDeletePayment } from "@/services/payments/payments.hooks";
import { Payment } from "@/services/payments/payments.api";
import { formatAmountWithGstInline, resolveInvoiceTax } from "@/lib/tax";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import toast from "react-hot-toast";
import styles from "./Billing.module.css";

function getMember(p: Payment) {
  return typeof p.memberId === "object" && p.memberId !== null
    ? p.memberId
    : null;
}

export function VoidPaymentModal({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) {
  const { mutateAsync: voidPayment, isPending } = useDeletePayment();
  const { data: gymSettings } = useGymSettings();
  const { taxPercentage, taxMode } = resolveInvoiceTax(gymSettings);
  const member = getMember(payment);

  const handleVoid = async () => {
    try {
      await voidPayment(payment._id);
      toast.success("Payment voided");
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Void failed");
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
        style={{ width: 420 }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Void payment</h2>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.formGrid} style={{ marginTop: 12 }}>
          <p className={styles.confirmLead}>
            Review details, then confirm void.
          </p>

          <dl className={styles.confirmDetails}>
            <div>
              <dt>Member</dt>
              <dd>
                {member?.name ?? "—"}
                {member?.phone ? (
                  <span className={styles.confirmMuted}> · {member.phone}</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>
                {formatAmountWithGstInline(
                  payment.amount,
                  taxPercentage,
                  taxMode,
                )}
              </dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{payment.paymentMode.replace("_", " ")}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>
                {new Date(payment.paymentDate).toLocaleDateString("en-IN")}
              </dd>
            </div>
            {payment.notes ? (
              <div>
                <dt>Notes</dt>
                <dd>{payment.notes}</dd>
              </div>
            ) : null}
          </dl>

          <p className={styles.confirmWarn}>
            Dues increase by this amount and the linked invoice is voided.
            Re-record if you need the payment again.
          </p>
        </div>

        <div className={styles.modalFooter} style={{ marginTop: 16 }}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={isPending}
          >
            Keep
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={handleVoid}
            disabled={isPending}
          >
            {isPending ? "Voiding…" : "Void payment"}
          </button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}
