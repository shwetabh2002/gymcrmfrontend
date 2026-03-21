"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDeleteTrainingType } from "@/services/training-types/training-types.hook";
import { TrainingType } from "@/services/training-types/training-types.api";
import styles from "./DeleteTrainingTypeDialog.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  trainingType: TrainingType | null;
}

export default function DeleteTrainingTypeDialog({ open, onClose, trainingType }: Props) {
  const { mutate: deleteTrainingType, isPending } = useDeleteTrainingType();

  if (!trainingType) return null;

  const handleDelete = () => {
    deleteTrainingType(trainingType._id, {
      onSuccess: () => onClose(),
      onError: (err: any) => console.error(err),
    });
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
            className={styles.dialog}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className={styles.title}>Delete Training Type?</h3>
            <p className={styles.message}>
              Are you sure you want to delete <strong>{trainingType.name}</strong>? This action cannot be undone.
            </p>
            <div className={styles.actions}>
              <button className={styles.btnCancel} onClick={onClose} disabled={isPending}>
                Cancel
              </button>
              <button className={styles.btnDelete} onClick={handleDelete} disabled={isPending}>
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
