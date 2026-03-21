"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateTrainingType, useUpdateTrainingType } from "@/services/training-types/training-types.hook";
import { TrainingType, CreateTrainingTypePayload } from "@/services/training-types/training-types.api";
import styles from "./TrainingTypeModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: TrainingType | null;
}

const EMPTY: CreateTrainingTypePayload = {
  name: "",
  description: "",
  maxMembersPerBatch: undefined,
  duration: undefined,
  price: undefined,
};

export default function TrainingTypeModal({ open, onClose, existing }: Props) {
  const isEdit = !!existing;
  const [form, setForm] = useState<CreateTrainingTypePayload>(EMPTY);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { mutate: createTrainingType, isPending: creating } = useCreateTrainingType();
  const { mutate: updateTrainingType, isPending: updating } = useUpdateTrainingType();
  const isPending = creating || updating;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        description: existing.description ?? "",
        maxMembersPerBatch: existing.maxMembersPerBatch,
        duration: existing.duration,
        price: existing.price,
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [existing, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ["maxMembersPerBatch", "duration", "price"].includes(name) && value ? Number(value) : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.name) {
      setError("Training type name is required.");
      return;
    }
    if (isEdit && existing) {
      updateTrainingType(
        { id: existing._id, payload: form },
        {
          onSuccess: () => onClose(),
          onError: (err: any) => setError(err?.response?.data?.message ?? "Update failed."),
        }
      );
    } else {
      createTrainingType(form, {
        onSuccess: () => onClose(),
        onError: (err: any) => setError(err?.response?.data?.message ?? "Create failed."),
      });
    }
  };

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
                <h2 className={styles.modalTitle}>{isEdit ? "Edit Training Type" : "Add New Training Type"}</h2>
                <p className={styles.modalSubtitle}>{isEdit ? `Editing ${existing?.name}` : "Fill in the training type details below."}</p>
              </div>
              <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.scrollBody}>
              {/* Section: Basic Info */}
              <div className={styles.sectionLabel}>Basic Information</div>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>Training Type Name *</label>
                  <input className={styles.input} name="name" placeholder="e.g. Personal Training, Group Yoga" value={form.name} onChange={handleChange} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Description</label>
                  <textarea className={styles.input} name="description" placeholder="Brief description..." value={form.description ?? ""} onChange={handleChange} style={{ minHeight: "80px", resize: "vertical" }} />
                </div>
              </div>

              {/* Section: Details */}
              <div className={styles.sectionLabel}>Program Details</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Duration (minutes)</label>
                    <input className={styles.input} name="duration" type="number" placeholder="0" value={form.duration ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Max Members Per Batch</label>
                    <input className={styles.input} name="maxMembersPerBatch" type="number" placeholder="0" value={form.maxMembersPerBatch ?? ""} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Price (₹)</label>
                  <input className={styles.input} name="price" type="number" placeholder="0" value={form.price ?? ""} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? (isEdit ? "Saving…" : "Creating…")
                  : (isEdit ? "Save Changes" : "Add Training Type")}
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
