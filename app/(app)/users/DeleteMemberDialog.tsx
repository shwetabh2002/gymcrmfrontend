"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDeleteMember } from "@/services/members/members.hook";
import { Member } from "@/services/members/members.api";
import styles from "./MemberModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  member: Member | null;
}

export default function DeleteMemberDialog({ open, onClose, member }: Props) {
  const { mutate: deleteMember, isPending } = useDeleteMember();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleDelete = () => {
    if (!member) return;
    deleteMember(member._id, {
      onSuccess: () => onClose(),
    });
  };

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
            style={{ maxWidth: 420 }}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Delete Member</h2>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            <p className={styles.deleteMsg}>
              Are you sure you want to delete{" "}
              <strong>{member.name}</strong>? This action cannot be undone.
            </p>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button
                className={styles.btnDanger}
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting…" : "Yes, Delete"}
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