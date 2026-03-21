"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreatePayment } from "@/services/payments/payments.hooks";
import { CreatePaymentPayload } from "@/services/payments/payments.api";
import { MemberSubscription } from "@/services/subscriptions/subscriptions.api";
import styles from "./PaymentModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  subscription: MemberSubscription | null;
}

const EMPTY: Partial<CreatePaymentPayload> = {
  amount: undefined,
  paymentMode: "CASH",
  notes: "",
};

export default function PaymentModal({ open, onClose, subscription }: Props) {
  const [form, setForm] = useState<Partial<CreatePaymentPayload>>(EMPTY);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { mutate: createPayment, isPending } = useCreatePayment();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open && subscription) {
      setForm({
        subscriptionId: subscription._id,
        memberId: typeof subscription.memberId === "string" ? subscription.memberId : subscription.memberId._id,
        amount: undefined,
        paymentMode: "CASH",
        notes: "",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    }
    setError("");
  }, [open, subscription]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "amount" && value ? Number(value) : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.amount || form.amount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!form.paymentDate) {
      setError("Payment date is required.");
      return;
    }
    
    createPayment(form as CreatePaymentPayload, {
      onSuccess: () => {
        onClose();
        setForm(EMPTY);
      },
      onError: (err: any) => setError(err?.response?.data?.message ?? "Payment failed."),
    });
  };

  if (!subscription) return null;

  const memberName = typeof subscription.memberId === "string" ? "Member" : subscription.memberId.name;
  const planName = typeof subscription.planId === "string" ? "Plan" : subscription.planId.name;
  const pendingAmount = subscription.pendingAmount ?? 0;
  const planPrice = subscription.planPrice ?? 0;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Record Payment</h2>
                <p className={styles.modalSubtitle}>Add payment for {memberName}'s subscription</p>
              </div>
              <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.scrollBody}>
              {/* Subscription Summary */}
              <div className={styles.sectionLabel}>Subscription Details</div>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Member</span>
                  <span className={styles.summaryValue}>{memberName}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Plan</span>
                  <span className={styles.summaryValue}>{planName}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Plan Cost</span>
                  <span className={styles.summaryValue}>₹{planPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Already Paid</span>
                  <span className={styles.summaryValue}>₹{(planPrice - pendingAmount).toLocaleString("en-IN")}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Pending Amount</span>
                  <span className={styles.summaryValueHighlight}>₹{pendingAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className={styles.sectionLabel}>Payment Info</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Amount (₹) *</label>
                    <input 
                      className={styles.input} 
                      name="amount" 
                      type="number" 
                      placeholder="0" 
                      value={form.amount ?? ""} 
                      onChange={handleChange}
                      max={pendingAmount}
                    />
                    {pendingAmount > 0 && <p className={styles.hint}>Max: ₹{pendingAmount.toLocaleString("en-IN")}</p>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Payment Date *</label>
                    <input 
                      className={styles.input} 
                      name="paymentDate" 
                      type="date" 
                      value={form.paymentDate ?? ""} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Payment Mode</label>
                  <select className={styles.input} name="paymentMode" value={form.paymentMode ?? "CASH"} onChange={handleChange}>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Transaction ID (Optional)</label>
                  <input 
                    className={styles.input} 
                    name="transactionId" 
                    placeholder="e.g., TXN12345678" 
                    value={form.transactionId ?? ""} 
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Notes</label>
                  <textarea 
                    className={styles.input} 
                    name="notes" 
                    placeholder="Any additional notes..." 
                    value={form.notes ?? ""} 
                    onChange={handleChange}
                    style={{ minHeight: "60px", resize: "vertical" }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Recording…" : "Record Payment"}
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
