"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateMember, useUpdateMember } from "@/services/members/members.hook";
import { Member, CreateMemberPayload, RegisterMemberPayload } from "@/services/members/members.api";
import styles from "./MemberModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Member | null;
}

const EMPTY: CreateMemberPayload = {
  idNo: "",
  date: new Date().toISOString().split('T')[0],
  name: "",
  contactNumber: "",
  phone: "",
  email: "",
  dob: "",
  instagramHandle: "",
  membershipPlan: "",
  membershipMonths: 1,
  amount: 0,
  membershipAmount: 0,
  received: 0,
  pending: 0,
  mop: "cash",
  transactionId: "",
  salesPerson: "",
  trainingType: "GT",
  trainer: "",
  memberType: "New",
  startingDate: new Date().toISOString().split('T')[0],
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  memberStatus: "ACTIVE",
  address: "",
  emergencyContact: "",
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
        idNo:             existing.idNo ?? "",
        date:             existing.date ? existing.date.slice(0, 10) : "",
        name:             existing.name,
        contactNumber:    existing.contactNumber,
        dob:              existing.dob ? existing.dob.slice(0, 10) : "",
        instagramHandle:  existing.instagramHandle ?? "",
        email:            existing.email ?? "",
        phone:            existing.phone ?? existing.contactNumber ?? "",
        membershipPlan:   existing.membershipPlan ?? "",
        membershipMonths: existing.membershipMonths ? Number(existing.membershipMonths) : 1,
        amount:           existing.amount ?? existing.membershipAmount,
        membershipAmount: existing.membershipAmount ?? existing.amount,
        received:         existing.received ?? 0,
        pending:          existing.pending ?? Math.max(0, (existing.amount ?? existing.membershipAmount ?? 0) - (existing.received ?? 0)),
        mop:              existing.mop ?? "",
        transactionId:    (existing as any).transactionId ?? "",
        salesPerson:      existing.salesPerson ?? "",
        trainingType:     existing.trainingType ?? "GT",
        trainer:          existing.trainer ?? "",
        memberType:       existing.memberType ?? "New",
        startingDate:     existing.startingDate ? existing.startingDate.slice(0, 10) : "",
        expiryDate:       existing.expiryDate ? existing.expiryDate.slice(0, 10) : "",
        memberStatus:     existing.memberStatus ?? "ACTIVE",
        address:          existing.address ?? "",
        emergencyContact: existing.emergencyContact ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [existing, open]);

  // FIX: added "membershipMonths" and "membershipAmount" to the numeric fields list
  // so they are cast to Number instead of being sent as strings to the API.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ["amount", "received", "pending", "membershipMonths", "membershipAmount"].includes(name)
        ? value === "" ? undefined : Number(value)
        : value,
    }));
  };

  const getRegisterPayload = (): RegisterMemberPayload => {
    const contactNumber = form.contactNumber || form.phone || "";
    const amount = form.amount ?? form.membershipAmount ?? 0;
    const received = form.received ?? 0;
    const membershipMonths = Math.max(1, Number(form.membershipMonths) || 1);
    const pending = form.pending ?? Math.max(0, amount - received);

    return {
      date: form.date || new Date().toISOString().split('T')[0],
      name: form.name,
      contactNumber,
      membershipMonths,
      amount,
      received,
      mop: form.mop ?? "cash",
      startingDate: form.startingDate || new Date().toISOString().split('T')[0],
      expiryDate: form.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      idNo: form.idNo || undefined,
      dob: form.dob || undefined,
      instagramHandle: form.instagramHandle || undefined,
      pending,
      transactionId: form.transactionId || undefined,
      salesPerson: form.salesPerson || undefined,
      trainingType: form.trainingType ?? "GT",
      trainer: form.trainer || undefined,
      memberType: form.memberType ?? "New",
      memberStatus: form.memberStatus ?? "ACTIVE",
      address: form.address || undefined,
      emergencyContact: form.emergencyContact || undefined,
    };
  };

  const getUpdatePayload = (): CreateMemberPayload => {
    const contactNumber = form.contactNumber || form.phone || "";
    const amount = form.amount ?? form.membershipAmount ?? 0;
    const received = form.received ?? 0;
    const pending = form.pending ?? Math.max(0, amount - received);

    return {
      ...form,
      contactNumber,
      amount,
      received,
      pending,
    };
  };

  const handleSubmit = () => {
    if (!form.name || !(form.contactNumber || form.phone)) {
      setError("Name and contact number are required.");
      return;
    }
    if (typeof form.membershipMonths !== 'number' || form.membershipMonths < 1) {
      setError("Membership months must be a number and at least 1.");
      return;
    }
    if (form.amount === undefined || form.amount < 0) {
      setError("Amount must be 0 or greater.");
      return;
    }
    if (form.received === undefined || form.received < 0) {
      setError("Received amount must be 0 or greater.");
      return;
    }
    if (!form.mop) {
      setError("Mode of payment is required.");
      return;
    }
    if (!form.startingDate) {
      setError("Starting date is required.");
      return;
    }
    if (!form.expiryDate) {
      setError("Expiry date is required.");
      return;
    }

    if (isEdit && existing) {
      const updatePayload = getUpdatePayload();
      updateMember(
        { id: existing._id, payload: updatePayload },
        {
          onSuccess: () => onClose(),
          onError: (err: any) => setError(err?.response?.data?.message ?? "Update failed."),
        }
      );
    } else {
      const registerPayload = getRegisterPayload();
      createMember(registerPayload, {
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
              {/* Section: Personal Info */}
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
                    <input className={styles.input} name="memberType" placeholder="e.g. New, Old, Renewal" value={form.memberType ?? ""} onChange={handleChange} />
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
                    <label className={styles.label}>Email</label>
                    <input className={styles.input} name="email" type="email" placeholder="member@gym.com" value={form.email ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Address</label>
                    <input className={styles.input} name="address" placeholder="123 Main St" value={form.address ?? ""} onChange={handleChange} />
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

              {/* Section: Membership & Payment */}
              <div className={styles.sectionLabel}>Membership & Payment</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Membership Plan</label>
                    <input className={styles.input} name="membershipPlan" placeholder="e.g. 1 month, Annual" value={form.membershipPlan ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Mode of Payment</label>
                    <input className={styles.input} name="mop" placeholder="e.g. Cash, UPI, Card" value={form.mop ?? ""} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label className={styles.label}>Membership Months</label>
                    <input className={styles.input} name="membershipMonths" type="number" placeholder="0" value={form.membershipMonths ?? ""} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Membership Amount (₹)</label>
                    <input className={styles.input} name="membershipAmount" type="number" placeholder="0" value={form.membershipAmount ?? ""} onChange={handleChange} />
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

              {/* Section: Training Details */}
              <div className={styles.sectionLabel}>Training Details</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Training Type</label>
                    <input className={styles.input} name="trainingType" placeholder="e.g. PT, GT" value={form.trainingType ?? ""} onChange={handleChange} />
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
                    <input className={styles.input} name="memberStatus" placeholder="e.g. ACTIVE, INACTIVE, EXPIRED" value={form.memberStatus ?? ""} onChange={handleChange} />
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