"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateTrainer, useUpdateTrainer } from "@/services/trainers/trainers.hook";
import { Trainer, CreateTrainerPayload } from "@/services/trainers/trainers.api";
import styles from "./TrainerModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Trainer | null;
}

const EMPTY: CreateTrainerPayload = {
  name: "",
  email: "",
  contactNumber: "",
  specialization: "",
  bio: "",
  experience: undefined,
  certification: "",
};

export default function TrainerModal({ open, onClose, existing }: Props) {
  const isEdit = !!existing;
  const [form, setForm] = useState<CreateTrainerPayload>(EMPTY);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { mutate: createTrainer, isPending: creating } = useCreateTrainer();
  const { mutate: updateTrainer, isPending: updating } = useUpdateTrainer();
  const isPending = creating || updating;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        email: existing.email ?? "",
        contactNumber: existing.contactNumber ?? "",
        specialization: existing.specialization ?? "",
        bio: existing.bio ?? "",
        experience: existing.experience,
        certification: existing.certification ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [existing, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "experience" && value ? Number(value) : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.name) {
      setError("Name is required.");
      return;
    }
    if (isEdit && existing) {
      updateTrainer(
        { id: existing._id, payload: form },
        {
          onSuccess: () => onClose(),
          onError: (err: any) => setError(err?.response?.data?.message ?? "Update failed."),
        }
      );
    } else {
      createTrainer(form, {
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
                <h2 className={styles.modalTitle}>{isEdit ? "Edit Trainer" : "Add New Trainer"}</h2>
                <p className={styles.modalSubtitle}>{isEdit ? `Editing ${existing?.name}` : "Fill in the trainer details below."}</p>
              </div>
              <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.scrollBody}>
              {/* Section: Basic Info */}
              <div className={styles.sectionLabel}>Basic Information</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Name *</label>
                    <input className={styles.input} name="name" placeholder="e.g. Rohit Kumar" value={form.name} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Specialization</label>
                    <input className={styles.input} name="specialization" placeholder="e.g. Strength & Conditioning" value={form.specialization ?? ""} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input className={styles.input} name="email" type="email" placeholder="trainer@example.com" value={form.email ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Contact Number</label>
                    <input className={styles.input} name="contactNumber" placeholder="9876543210" value={form.contactNumber ?? ""} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Section: Experience & Certification */}
              <div className={styles.sectionLabel}>Experience & Certification</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Experience (Years)</label>
                    <input className={styles.input} name="experience" type="number" placeholder="0" value={form.experience ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Certification</label>
                    <input className={styles.input} name="certification" placeholder="e.g. ISSA CFT, ACE" value={form.certification ?? ""} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Bio</label>
                    <textarea className={styles.input} name="bio" placeholder="Brief bio about the trainer..." value={form.bio ?? ""} onChange={handleChange} style={{ minHeight: "80px", resize: "vertical" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? (isEdit ? "Saving…" : "Creating…")
                  : (isEdit ? "Save Changes" : "Add Trainer")}
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
