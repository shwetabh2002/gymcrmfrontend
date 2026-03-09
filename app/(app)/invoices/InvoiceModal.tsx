"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./InvoiceModal.module.css";

export interface Invoice {
  id: string;
  user: string;
  email: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed" | "Refunded";
  issued: string;
  due: string;
  plan: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Invoice | null;
  onSave: (invoice: Invoice) => void;
}

const EMPTY: Invoice = {
  id: "",
  user: "",
  email: "",
  amount: "",
  status: "Pending",
  issued: "",
  due: "",
  plan: "",
};

function generateId(existing: Invoice[]) {
  const nums = existing.map((i) => parseInt(i.id.replace("#", ""))).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 5000;
  return `#${next}`;
}

export default function InvoiceModal({ open, onClose, existing, onSave }: Props) {
  const isEdit = !!existing;

  const [form, setForm] = useState<Invoice>(EMPTY);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (existing) {
      setForm(existing);
    } else {
      const today = new Date().toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });
      const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });
      setForm({ ...EMPTY, issued: today, due });
    }
    setError("");
  }, [existing, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.user)   { setError("Member name is required."); return; }
    if (!form.email)  { setError("Email is required."); return; }
    if (!form.amount) { setError("Amount is required."); return; }
    if (!form.plan)   { setError("Plan is required."); return; }

    onSave({ ...form });
    onClose();
  };

  const content = (
    <AnimatePresence>
      {open && (
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
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {isEdit ? "Edit Invoice" : "New Invoice"}
              </h2>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.fields}>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Member Name *</label>
                  <input
                    className={styles.input}
                    name="user"
                    placeholder="Sarah Chen"
                    value={form.user}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email *</label>
                  <input
                    className={styles.input}
                    name="email"
                    type="email"
                    placeholder="sarah@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Plan *</label>
                  <select
                    className={styles.input}
                    name="plan"
                    value={form.plan}
                    onChange={handleChange}
                  >
                    <option value="">Select a plan</option>
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Amount *</label>
                  <input
                    className={styles.input}
                    name="amount"
                    placeholder="$49.00"
                    value={form.amount}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Issued Date</label>
                  <input
                    className={styles.input}
                    name="issued"
                    placeholder="Mar 1, 2025"
                    value={form.issued}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Due Date</label>
                  <input
                    className={styles.input}
                    name="due"
                    placeholder="Mar 8, 2025"
                    value={form.due}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <div className={styles.statusRow}>
                  {(["Paid", "Pending", "Failed", "Refunded"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.statusChip} ${form.status === s ? styles[`chip${s}`] : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, status: s }))}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>
                Cancel
              </button>
              <button className={styles.btnPrimary} onClick={handleSubmit}>
                {isEdit ? "Save Changes" : "Create Invoice"}
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