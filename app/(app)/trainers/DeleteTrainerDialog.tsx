"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDeleteTrainer } from "@/services/trainers/trainers.hook";
import { Trainer } from "@/services/trainers/trainers.api";
import styles from "./DeleteTrainerDialog.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  trainer: Trainer | null;
}

export default function DeleteTrainerDialog({ open, onClose, trainer }: Props) {
  const { mutate: deleteTrainer, isPending } = useDeleteTrainer();

  if (!trainer) return null;

  const handleDelete = () => {
    deleteTrainer(trainer._id, {
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
            <h3 className={styles.title}>Delete Trainer?</h3>
            <p className={styles.message}>
              Are you sure you want to delete <strong>{trainer.name}</strong>? This action cannot be undone.
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
