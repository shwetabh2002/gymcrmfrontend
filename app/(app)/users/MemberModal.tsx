"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreateMember,
  useUpdateMember,
} from "@/services/members/members.hook";
import { Member, CreateMemberPayload, UpdateMemberPayload } from "@/services/members/members.api";
import styles from "./MemberModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Member | null;
}

const EMPTY: CreateMemberPayload = {
  name: "",
  email: "",
  phone: "",
  address: "",
  emergencyContact: "",
  memberStatus: "ACTIVE",
};

export default function MemberModal({ open, onClose, existing }: Props) {
  const isEdit = !!existing;

  const [form, setForm] = useState<CreateMemberPayload>(EMPTY);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { mutate: createMember, isPending: creating } = useCreateMember();
  const { mutate: updateMember, isPending: updating } = useUpdateMember();
  const isPending = creating || updating;

  // ✅ Portal mount guard
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (existing) {
      setForm({
        name:             existing.name,
        email:            existing.email,
        phone:            existing.phone,
        address:          existing.address ?? "",
        emergencyContact: existing.emergencyContact ?? "",
        memberStatus:     existing.memberStatus,
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [existing, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.phone) {
      setError("Name, email and phone are required.");
      return;
    }

    if (isEdit && existing) {
      updateMember(
        { id: existing._id, payload: { ...form } },
        {
          onSuccess: () => onClose(),
          onError: (err: any) => {
            setError(err?.response?.data?.message ?? "Update failed.");
          },
        }
      );
    } else {
      createMember(form, {
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
                {isEdit ? "Edit Member" : "Add New Member"}
              </h2>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.fields}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name *</label>
                  <input
                    className={styles.input}
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email *</label>
                  <input
                    className={styles.input}
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Phone *</label>
                  <input
                    className={styles.input}
                    name="phone"
                    placeholder="+1234567890"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Emergency Contact</label>
                  <input
                    className={styles.input}
                    name="emergencyContact"
                    placeholder="+1987654321"
                    value={form.emergencyContact}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Address</label>
                <input
                  className={styles.input}
                  name="address"
                  placeholder="123 Main St, New York"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <select
                  className={styles.input}
                  name="memberStatus"
                  value={form.memberStatus}
                  onChange={handleChange}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
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
                  : isEdit ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // ✅ Render into document.body to escape stacking context
  if (!mounted) return null;
  return createPortal(content, document.body);
}