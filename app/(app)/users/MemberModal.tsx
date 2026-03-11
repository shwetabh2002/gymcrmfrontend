"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreateMember,
  useUpdateMember,
} from "@/services/members/members.hook";
import { Member, CreateMemberPayload } from "@/services/members/members.api";
import { usePlans } from "@/services/plans/plans.hook";
import { useCreateMemberSubscription } from "../../../services/subscriptions/subscriptions.hook";
import styles from "./MemberModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Member | null;
}

const EMPTY_MEMBER: CreateMemberPayload = {
  name: "",
  email: "",
  phone: "",
  address: "",
  emergencyContact: "",
  memberStatus: "ACTIVE",
};

export default function MemberModal({ open, onClose, existing }: Props) {
  const isEdit = !!existing;

  const [form, setForm] = useState<CreateMemberPayload>(EMPTY_MEMBER);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [initialPayment, setInitialPayment] = useState<string>("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const { mutate: createMember, isPending: creating } = useCreateMember();
  const { mutate: updateMember, isPending: updating } = useUpdateMember();
  const { mutate: createSubscription, isPending: subscribing } = useCreateMemberSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();

  const isPending = creating || updating || subscribing;

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
      setForm(EMPTY_MEMBER);
      setSelectedPlanId("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setInitialPayment("");
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
      // Edit: just update member info (subscription managed separately)
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
      // Create member, then optionally assign subscription
      createMember(form, {
        onSuccess: (newMember) => {
          if (selectedPlanId) {
            createSubscription(
              {
                memberId: newMember._id,
                planId: selectedPlanId,
                startDate,
                initialPayment: initialPayment ? Number(initialPayment) : 0,
              },
              {
                onSuccess: () => onClose(),
                onError: (err: any) => {
                  // Member was created — warn but still close
                  setError(
                    `Member created but subscription failed: ${
                      err?.response?.data?.message ?? "Unknown error"
                    }`
                  );
                },
              }
            );
          } else {
            onClose();
          }
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message ?? "Create failed.");
        },
      });
    }
  };

  const activePlans = plans?.filter((p) => p.status === "ACTIVE") ?? [];
  const selectedPlan = activePlans.find((p) => p._id === selectedPlanId);

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

              {/* ── Member Info ── */}
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

              <div className={styles.row}>
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

              {/* ── Subscription (only on create) ── */}
              {!isEdit && (
                <>
                  <div className={styles.sectionDivider}>
                    <span className={styles.sectionLabel}>Subscription Plan (optional)</span>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>Plan</label>
                      <select
                        className={styles.input}
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        disabled={plansLoading}
                      >
                        <option value="">
                          {plansLoading ? "Loading plans…" : "No Plan (skip)"}
                        </option>
                        {activePlans.map((plan) => (
                          <option key={plan._id} value={plan._id}>
                            {plan.name} — {plan.duration} {plan.durationType.toLowerCase()} · ₹{plan.price}
                          </option>
                        ))}
                      </select>
                      {!plansLoading && activePlans.length === 0 && (
                        <span className={styles.planHint}>
                          No active plans. Create one in the Plans section.
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Start Date</label>
                      <input
                        className={styles.input}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={!selectedPlanId}
                      />
                    </div>
                  </div>

                  {selectedPlanId && (
                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label className={styles.label}>
                          Initial Payment
                          {selectedPlan ? ` (Plan price: ₹${selectedPlan.price})` : ""}
                        </label>
                        <input
                          className={styles.input}
                          type="number"
                          min="0"
                          max={selectedPlan?.price}
                          placeholder="0"
                          value={initialPayment}
                          onChange={(e) => setInitialPayment(e.target.value)}
                        />
                      </div>
                      {selectedPlan && initialPayment !== "" && (
                        <div className={styles.field}>
                          <label className={styles.label}>Pending Amount</label>
                          <input
                            className={`${styles.input} ${styles.inputReadonly}`}
                            readOnly
                            value={`₹${Math.max(0, selectedPlan.price - Number(initialPayment))}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Edit mode: show current subscription info */}
              {isEdit && existing?.currentSubscriptionId && (
                <div className={styles.subscriptionInfo}>
                  <span className={styles.subscriptionInfoIcon}>ℹ</span>
                  This member has an active subscription. Manage it from the Subscriptions section.
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
                  : isEdit ? "Save Changes" : "Add Member"}
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