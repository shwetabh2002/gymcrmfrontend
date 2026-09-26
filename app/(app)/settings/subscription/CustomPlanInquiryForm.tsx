"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  subscriptionApi,
  type CustomInquiryPayload,
} from "@/services/subscription/subscription.api";
import styles from "../profile/Profile.module.css";

const NEED_OPTIONS = [
  { id: "multi_branch", label: "Multiple branches" },
  { id: "autopay", label: "UPI Autopay" },
  { id: "whatsapp", label: "WhatsApp payments" },
  { id: "staff", label: "Staff roles & permissions" },
  { id: "custom", label: "Custom integrations / other" },
];

type Props = {
  canEdit: boolean;
  onDone?: () => void;
};

/**
 * Sales-led Custom plan — gym answers a few questions; SUPER_ADMIN sees the lead.
 */
export default function CustomPlanInquiryForm({ canEdit, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    branchCount: "2",
    approxMembers: "",
    currentSoftware: "",
    message: "",
    needs: [] as string[],
  });

  const toggleNeed = (id: string) => {
    setForm((f) => ({
      ...f,
      needs: f.needs.includes(id)
        ? f.needs.filter((n) => n !== id)
        : [...f.needs, id],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const branches = Number(form.branchCount);
    if (!form.contactName.trim() || !form.contactPhone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    if (!Number.isFinite(branches) || branches < 1) {
      toast.error("Enter how many branches you operate");
      return;
    }
    setBusy(true);
    try {
      const payload: CustomInquiryPayload = {
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim() || undefined,
        branchCount: Math.round(branches),
        approxMembers: form.approxMembers
          ? Number(form.approxMembers)
          : undefined,
        needs: form.needs,
        currentSoftware: form.currentSoftware.trim() || undefined,
        message: form.message.trim() || undefined,
      };
      await subscriptionApi.submitCustomInquiry(payload);
      setSent(true);
      toast.success("Request sent — we will reach out shortly");
      onDone?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not submit request");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <p style={{ margin: 0, color: "var(--text-1)", fontSize: "0.9rem" }}>
        Thanks — your Custom plan request is with our team. We will contact you
        on the number you shared.
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-2)" }}>
        Answer a few questions. We will review and reach out with a tailored
        quote — no self-serve payment for Custom.
      </p>

      <div className={styles.formGrid} style={{ padding: 0 }}>
        <div>
          <label className={styles.formLabel}>Your name *</label>
          <input
            className={styles.formInput}
            value={form.contactName}
            disabled={!canEdit || busy}
            onChange={(e) =>
              setForm((f) => ({ ...f, contactName: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className={styles.formLabel}>Phone / WhatsApp *</label>
          <input
            className={styles.formInput}
            value={form.contactPhone}
            disabled={!canEdit || busy}
            onChange={(e) =>
              setForm((f) => ({ ...f, contactPhone: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className={styles.formLabel}>Email</label>
          <input
            className={styles.formInput}
            type="email"
            value={form.contactEmail}
            disabled={!canEdit || busy}
            onChange={(e) =>
              setForm((f) => ({ ...f, contactEmail: e.target.value }))
            }
          />
        </div>
        <div>
          <label className={styles.formLabel}>Branches / locations *</label>
          <input
            className={styles.formInput}
            type="number"
            min={1}
            value={form.branchCount}
            disabled={!canEdit || busy}
            onChange={(e) =>
              setForm((f) => ({ ...f, branchCount: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className={styles.formLabel}>Approx. members</label>
          <input
            className={styles.formInput}
            type="number"
            min={0}
            value={form.approxMembers}
            disabled={!canEdit || busy}
            onChange={(e) =>
              setForm((f) => ({ ...f, approxMembers: e.target.value }))
            }
          />
        </div>
        <div>
          <label className={styles.formLabel}>Current software (if any)</label>
          <input
            className={styles.formInput}
            value={form.currentSoftware}
            disabled={!canEdit || busy}
            onChange={(e) =>
              setForm((f) => ({ ...f, currentSoftware: e.target.value }))
            }
            placeholder="Excel / other CRM / none"
          />
        </div>
      </div>

      <div>
        <label className={styles.formLabel}>What do you need?</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 6,
          }}
        >
          {NEED_OPTIONS.map((opt) => {
            const on = form.needs.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={!canEdit || busy}
                onClick={() => toggleNeed(opt.id)}
                className={on ? styles.btnPrimary : styles.btnSecondary}
                style={{ fontSize: "0.8rem", padding: "6px 10px" }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={styles.formLabel}>Anything else?</label>
        <textarea
          className={styles.formInput}
          rows={3}
          value={form.message}
          disabled={!canEdit || busy}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Timeline, must-haves, budget range…"
        />
      </div>

      <button
        type="submit"
        className={styles.btnPrimary}
        disabled={!canEdit || busy}
        style={{ justifySelf: "start" }}
      >
        {busy ? "Sending…" : "Request Custom plan"}
      </button>
    </form>
  );
}
