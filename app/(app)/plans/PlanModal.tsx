"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreatePlan, useUpdatePlan } from "@/services/plans/plans.hook";
import { Plan, CreatePlanPayload, UpdatePlanPayload } from "@/services/plans/plans.api";
import styles from "./PlanModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Plan | null;
}

const EMPTY: CreatePlanPayload = {
  name: "",
  duration: 1,
  durationType: "MONTHS",
  price: 0,
  description: "",
};

export default function PlanModal({ open, onClose, existing }: Props) {
  const isEdit = !!existing;

  const [form, setForm] = useState<CreatePlanPayload>(EMPTY);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { mutate: createPlan, isPending: creating } = useCreatePlan();
  const { mutate: updatePlan, isPending: updating } = useUpdatePlan();
  const isPending = creating || updating;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (existing) {
      setForm({
        name:         existing.name,
        duration:     existing.duration,
        durationType: existing.durationType,
        price:        existing.price,
        description:  existing.description ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [existing, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "duration" || name === "price" ? Number(value) : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.name)          { setError("Plan name is required."); return; }
    if (form.duration < 1)   { setError("Duration must be at least 1."); return; }
    if (form.price < 0)      { setError("Price cannot be negative."); return; }

    if (isEdit && existing) {
      updatePlan(
        { id: existing._id, payload: { ...form } },
        {
          onSuccess: () => onClose(),
          onError: (err: any) => {
            setError(err?.response?.data?.message ?? "Update failed.");
          },
        }
      );
    } else {
      createPlan(form, {
        onSuccess: () => onClose(),
        onError: (err: any) => {
          setError(err?.response?.data?.message ?? "Create failed.");
        },
      });
    }
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
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {isEdit ? "Edit Plan" : "New Subscription Plan"}
              </h2>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>Plan Name *</label>
                <input
                  className={styles.input}
                  name="name"
                  placeholder="e.g. Monthly Basic"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Duration *</label>
                  <input
                    className={styles.input}
                    name="duration"
                    type="number"
                    min={1}
                    value={form.duration}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Duration Type *</label>
                  <select
                    className={styles.input}
                    name="durationType"
                    value={form.durationType}
                    onChange={handleChange}
                  >
                    <option value="DAYS">Days</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Price (₹) *</label>
                <input
                  className={styles.input}
                  name="price"
                  type="number"
                  min={0}
                  placeholder="e.g. 1500"
                  value={form.price}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <input
                  className={styles.input}
                  name="description"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              {isEdit && (
                <div className={styles.field}>
                  <label className={styles.label}>Status</label>
                  <select
                    className={styles.input}
                    name="status"
                    value={(form as any).status ?? existing?.status}
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
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
                {isPending
                  ? isEdit ? "Saving…" : "Creating…"
                  : isEdit ? "Save Changes" : "Create Plan"}
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