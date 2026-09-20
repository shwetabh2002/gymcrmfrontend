"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDeletePlan } from "@/services/plans/plans.hook";
import { Plan } from "@/services/plans/plans.api";
import styles from "./PlanModal.module.css";
import { EASE_OUT_EXPO } from "@/config/motion";

interface Props {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
}

export default function DeletePlanDialog({ open, onClose, plan }: Props) {
  const { mutate: deletePlan, isPending } = useDeletePlan();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDelete = () => {
    if (!plan) return;
    deletePlan(plan._id, {
      onSuccess: () => onClose(),
    });
  };

  const content = (
    <AnimatePresence>
      {open && plan && (
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
            style={{ maxWidth: 420 }}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Archive Plan</h2>
              <button className={styles.closeBtn} onClick={onClose}>
                ✕
              </button>
            </div>

            <p className={styles.deleteMsg}>
              Archive <strong>{plan.name}</strong>? The plan stays in your list
              with status <strong>ARCHIVED</strong> — nothing else changes.
            </p>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>
                Cancel
              </button>
              <button
                className={styles.btnDanger}
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Archiving…" : "Yes, Archive"}
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
