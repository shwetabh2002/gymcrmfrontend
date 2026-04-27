"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Member } from "@/services/members/members.api";
import { useAddPayment } from "@/services/members/members.hook";
import styles from "./MemberModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  member: Member | null;
}

export default function AddPaymentModal({ open, onClose, member }: Props) {
  const [form, setForm] = useState({
    amount: 0,
    received: 0,
    mop: "cash",
    paymentDate: new Date().toISOString().split('T')[0],
    pendingDueDate: "",
    transactionId: "",
    notes: "",
    clearPending: false, // Flag to indicate if this is clearing old pending
  });
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { mutate: addPayment, isPending } = useAddPayment();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (member && open) {
      // Get active membership's pending amount
      const activeMembership = member.memberships?.find(m => m.status === "ACTIVE");
      const pendingAmount = activeMembership?.pendingAmount ?? member.paymentSummary?.totalPending ?? 0;
      const pendingDueDate = (activeMembership as { pendingDueDate?: string | null } | undefined)?.pendingDueDate
        ?? member.pendingDueDate
        ?? "";

      setForm({
        amount: pendingAmount > 0 ? 0 : 0, // Set to 0 for pending clearance
        received: pendingAmount,
        mop: "cash",
        paymentDate: new Date().toISOString().split('T')[0],
        pendingDueDate: pendingDueDate ? pendingDueDate.slice(0, 10) : "",
        transactionId: "",
        notes: pendingAmount > 0 ? "Pending balance payment" : "Additional payment",
        clearPending: pendingAmount > 0, // Mark as clearing pending
      });
    }
    setError("");
  }, [member, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ["amount", "received"].includes(name)
        ? value === "" ? 0 : Number(value)
        : value,
    }));
  };

  const handleSubmit = () => {
    if (!member) return;

    // Allow amount = 0 if clearPending is true
    if (form.amount <= 0 && !form.clearPending) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (form.received < 0) {
      setError("Received amount must be 0 or greater.");
      return;
    }
    if (!form.clearPending && form.received > form.amount) {
      setError("Received amount cannot exceed total amount.");
      return;
    }
    if (!form.mop) {
      setError("Mode of payment is required.");
      return;
    }
    if (!form.paymentDate) {
      setError("Payment date is required.");
      return;
    }

    const pending = Math.max(0, form.amount - form.received);

    addPayment(
      {
        memberId: member._id,
        amount: form.amount,
        received: form.received,
        pending,
        mop: form.mop,
        paymentDate: form.paymentDate,
        transactionId: form.transactionId || undefined,
        notes: form.notes || undefined,
        pendingDueDate: pending > 0 ? form.pendingDueDate || undefined : undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message ?? "Failed to add payment.");
        },
      }
    );
  };

  const pending = form.amount - form.received;
  const activeMembership = member?.memberships?.find(m => m.status === "ACTIVE");
  const totalPending = activeMembership?.pendingAmount ?? member?.paymentSummary?.totalPending ?? 0;

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
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Add Payment</h2>
                <p className={styles.modalSubtitle}>
                  Recording payment for {member.name}
                  {totalPending > 0 && (
                    <span style={{
                      marginLeft: '8px',
                      color: '#dc2626',
                      fontWeight: 600
                    }}>
                      (₹{totalPending} pending)
                    </span>
                  )}
                </p>
              </div>
              <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.scrollBody}>
              {member.discount && member.discount > 0 && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '12px 16px',
                  backgroundColor: '#dcfce7',
                  borderLeft: '3px solid #10b981',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#065f46'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    💰 Discount Applied
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Original Amount:</span>
                      <span style={{ fontWeight: 600, marginLeft: '6px' }}>₹{member.amount?.toLocaleString() ?? 0}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Discount:</span>
                      <span style={{ fontWeight: 600, marginLeft: '6px', color: '#10b981' }}>{member.discount}%</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Discount Amount:</span>
                      <span style={{ fontWeight: 600, marginLeft: '6px', color: '#10b981' }}>
                        -₹{(((member.amount ?? 0) * (member.discount ?? 0)) / 100).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Final Amount:</span>
                      <span style={{ fontWeight: 600, marginLeft: '6px' }}>
                        ₹{((member.amount ?? 0) - ((member.amount ?? 0) * (member.discount ?? 0)) / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {member.discountApprovedBy && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                      Approved by: <span style={{ fontWeight: 500, color: '#065f46' }}>{member.discountApprovedBy}</span>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.sectionLabel}>Payment Details</div>

              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Payment Date *</label>
                    <input
                      className={styles.input}
                      name="paymentDate"
                      type="date"
                      value={form.paymentDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Mode of Payment *</label>
                    <select
                      className={styles.input}
                      name="mop"
                      value={form.mop}
                      onChange={handleChange}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div className={styles.row3}>
                  <div className={styles.field}>
                    <label className={styles.label}>Total Amount (₹) *</label>
                    <input
                      className={styles.input}
                      name="amount"
                      type="number"
                      placeholder="0"
                      value={form.amount || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Received (₹) *</label>
                    <input
                      className={styles.input}
                      name="received"
                      type="number"
                      placeholder="0"
                      value={form.received || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Pending (₹)</label>
                    <input
                      className={styles.input}
                      type="number"
                      value={pending}
                      disabled
                      style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Pending Due Date</label>
                  <input
                    className={styles.input}
                    name="pendingDueDate"
                    type="date"
                    value={form.pendingDueDate}
                    onChange={handleChange}
                    disabled={pending <= 0}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Transaction ID</label>
                  <input
                    className={styles.input}
                    name="transactionId"
                    placeholder="e.g. UPI123456"
                    value={form.transactionId}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Notes</label>
                  <textarea
                    className={styles.input}
                    name="notes"
                    placeholder="Payment notes..."
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {totalPending > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '12px 16px',
                  backgroundColor: form.clearPending ? '#dcfce7' : '#fef3c7',
                  borderLeft: `3px solid ${form.clearPending ? '#16a34a' : '#f59e0b'}`,
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: form.clearPending ? '#15803d' : '#92400e'
                }}>
                  {form.clearPending ? (
                    <>
                      <strong>✓ Clearing Pending Balance</strong>
                      <div style={{ marginTop: '6px' }}>
                        This payment of ₹{form.received} will be applied to clear the pending balance of ₹{totalPending}.
                        <br />
                        The old payment record(s) will be updated to reduce/clear their pending amounts.
                      </div>
                    </>
                  ) : (
                    <>
                      <strong>Note:</strong> Member currently has ₹{totalPending} pending from previous payments.
                      {form.received === totalPending && form.amount === 0 && (
                        <span style={{ display: 'block', marginTop: '4px', color: '#15803d', fontWeight: 600 }}>
                          ✓ This payment will clear the pending balance!
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button
                className={styles.btnPrimary}
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? "Adding Payment..." : "Add Payment"}
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
