"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateMember, useUpdateMember } from "@/services/members/members.hook";
import { Member, CreateMemberPayload } from "@/services/members/members.api";
import styles from "./MemberModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Member | null;
}

const EMPTY: CreateMemberPayload = {
  idNo: "",
  date: "",
  name: "",
  contactNumber: "",
  dob: "",
  instagramHandle: "",
  membershipPlan: "",
  amount: undefined,
  received: undefined,
  pending: undefined,
  mop: "",
  salesPerson: "",
  trainingType: "GT",
  trainer: "",
  memberType: "New",
  startingDate: "",
  expiryDate: "",
  memberStatus: "ACTIVE",
};

export default function MemberModal({ open, onClose, existing }: Props) {
  const isEdit = !!existing;
  const [form, setForm]   = useState<CreateMemberPayload>(EMPTY);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { mutate: createMember, isPending: creating } = useCreateMember();
  const { mutate: updateMember, isPending: updating } = useUpdateMember();
  const isPending = creating || updating;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (existing) {
      setForm({
        idNo:           existing.idNo ?? "",
        date:           existing.date ? existing.date.slice(0, 10) : "",
        name:           existing.name,
        contactNumber:  existing.contactNumber,
        dob:            existing.dob ? existing.dob.slice(0, 10) : "",
        instagramHandle: existing.instagramHandle ?? "",
        membershipPlan: existing.membershipPlan ?? "",
        amount:         existing.amount,
        received:       existing.received,
        pending:        existing.pending,
        mop:            existing.mop ?? "",
        salesPerson:    existing.salesPerson ?? "",
        trainingType:   existing.trainingType ?? "GT",
        trainer:        existing.trainer ?? "",
        memberType:     existing.memberType ?? "New",
        startingDate:   existing.startingDate ? existing.startingDate.slice(0, 10) : "",
        expiryDate:     existing.expiryDate ? existing.expiryDate.slice(0, 10) : "",
        memberStatus:   existing.memberStatus ?? "ACTIVE",
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [existing, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ["amount", "received", "pending"].includes(name)
        ? value === "" ? undefined : Number(value)
        : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.contactNumber) {
      setError("Name and contact number are required.");
      return;
    }
    if (isEdit && existing) {
      updateMember(
        { id: existing._id, payload: { ...form } },
        {
          onSuccess: () => onClose(),
          onError: (err: any) => setError(err?.response?.data?.message ?? "Update failed."),
        }
      );
    } else {
      createMember(form, {
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
                <h2 className={styles.modalTitle}>{isEdit ? "Edit Member" : "Add New Member"}</h2>
                <p className={styles.modalSubtitle}>{isEdit ? `Editing ${existing?.name}` : "Fill in the member details below."}</p>
              </div>
              <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.scrollBody}>
              {/* Section: Identity */}
              <div className={styles.sectionLabel}>Personal Info</div>
              <div className={styles.fields}>
                <div className={styles.row3}>
                  <div className={styles.field}>
                    <label className={styles.label}>Member ID</label>
                    <input className={styles.input} name="idNo" placeholder="e.g. 4819" value={form.idNo ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Registration Date</label>
                    <input className={styles.input} name="date" type="date" value={form.date ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Member Type</label>
                    <select className={styles.input} name="memberType" value={form.memberType ?? "New"} onChange={handleChange}>
                      <option value="New">New</option>
                      <option value="Old">Old</option>
                      <option value="Renewal">Renewal</option>
                    </select>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Name *</label>
                    <input className={styles.input} name="name" placeholder="e.g. Daksh Sharma" value={form.name} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Contact Number *</label>
                    <input className={styles.input} name="contactNumber" placeholder="e.g. 9876543210" value={form.contactNumber} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Date of Birth</label>
                    <input className={styles.input} name="dob" type="date" value={form.dob ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Instagram Handle</label>
                    <input className={styles.input} name="instagramHandle" placeholder="@handle" value={form.instagramHandle ?? ""} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Section: Membership */}
              <div className={styles.sectionLabel}>Membership & Payment</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Membership Plan</label>
                    <input className={styles.input} name="membershipPlan" placeholder="e.g. 1 month, Annual" value={form.membershipPlan ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Mode of Payment</label>
                    <select className={styles.input} name="mop" value={form.mop ?? ""} onChange={handleChange}>
                      <option value="">— Select —</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className={styles.row3}>
                  <div className={styles.field}>
                    <label className={styles.label}>Total Amount (₹)</label>
                    <input className={styles.input} name="amount" type="number" placeholder="0" value={form.amount ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Received (₹)</label>
                    <input className={styles.input} name="received" type="number" placeholder="0" value={form.received ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Pending (₹)</label>
                    <input className={styles.input} name="pending" type="number" placeholder="0" value={form.pending ?? ""} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Starting Date</label>
                    <input className={styles.input} name="startingDate" type="date" value={form.startingDate ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Expiry Date</label>
                    <input className={styles.input} name="expiryDate" type="date" value={form.expiryDate ?? ""} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Section: Training */}
              <div className={styles.sectionLabel}>Training Details</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Training Type</label>
                    <select className={styles.input} name="trainingType" value={form.trainingType ?? "GT"} onChange={handleChange}>
                      <option value="GT">GT — Group Training</option>
                      <option value="PT">PT — Personal Training</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Trainer</label>
                    <input className={styles.input} name="trainer" placeholder="Trainer name" value={form.trainer ?? ""} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Sales Person</label>
                    <input className={styles.input} name="salesPerson" placeholder="Sales person name" value={form.salesPerson ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Member Status</label>
                    <select className={styles.input} name="memberStatus" value={form.memberStatus ?? "ACTIVE"} onChange={handleChange}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? (isEdit ? "Saving…" : "Creating…")
                  : (isEdit ? "Save Changes" : "Add Member")}
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
