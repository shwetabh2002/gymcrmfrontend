"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useCreatePayment } from "@/services/payments/payments.hooks";
import { useMemberSubscriptions } from "@/services/subscriptions/subscriptions.hook";
import { useMembers } from "@/services/members/members.hook";
import { PaymentMode, CreatePaymentPayload } from "@/services/payments/payments.api";
import { Member } from "@/services/members/members.api";
import styles from "./Payments.module.css";

/* ─── Member Combobox ─────────────────────────────────────────── */
interface MemberComboboxProps {
  members: Member[];
  value: string;
  onChange: (id: string) => void;
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className={styles.comboboxHighlight}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function MemberCombobox({ members, value, onChange }: MemberComboboxProps) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef           = useRef<HTMLDivElement>(null);
  const searchRef         = useRef<HTMLInputElement>(null);

  const selected = members.find(m => m._id === value) ?? null;
  const filtered = query.trim()
    ? members.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.email.toLowerCase().includes(query.toLowerCase())
      )
    : members;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const handleSelect = useCallback((m: Member) => {
    onChange(m._id); setOpen(false); setQuery("");
  }, [onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); onChange(""); setQuery("");
  };

  return (
    <div ref={wrapRef} className={styles.comboboxWrap}>
      <div
        role="button" tabIndex={0} aria-haspopup="listbox" aria-expanded={open}
        className={`${styles.comboboxTrigger} ${open ? styles.comboboxTriggerOpen : ""}`}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(v => !v); } }}
      >
        {selected ? (
          <span className={styles.comboboxSelectedVal}>
            <span className={styles.comboboxSelectedName}>{selected.name}</span>
            <span className={styles.comboboxSelectedEmail}>{selected.email}</span>
          </span>
        ) : (
          <span className={styles.comboboxPlaceholder}>Search and select a member…</span>
        )}
        <span className={styles.comboboxSuffix}>
          {selected ? (
            <span role="button" tabIndex={0} aria-label="Clear" className={styles.comboboxClearBtn}
              onClick={handleClear} onKeyDown={e => { if (e.key === "Enter") handleClear(e as any); }}>
              ✕
            </span>
          ) : (
            <span className={`${styles.comboboxChevron} ${open ? styles.comboboxChevronOpen : ""}`}>▾</span>
          )}
        </span>
      </div>

      {open && (
        <div className={styles.comboboxDropdown} role="listbox">
          <div className={styles.comboboxSearchWrap}>
            <span className={styles.comboboxSearchIcon}>⌕</span>
            <input ref={searchRef} className={styles.comboboxSearchInput}
              placeholder={`Search ${members.length} members…`} value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") { setOpen(false); setQuery(""); } }}
            />
          </div>
          <div className={styles.comboboxList}>
            {filtered.length === 0 ? (
              <div className={styles.comboboxEmpty}>No members match "{query}"</div>
            ) : filtered.map(m => (
              <div key={m._id} role="option" aria-selected={m._id === value}
                className={`${styles.comboboxItem} ${m._id === value ? styles.comboboxItemActive : ""}`}
                onClick={() => handleSelect(m)}>
                <div className={styles.comboboxItemName}>{highlight(m.name, query)}</div>
                <div className={styles.comboboxItemEmail}>{highlight(m.email, query)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shared Modal Shell ──────────────────────────────────────── */
function ModalShell({ title, onClose, width = 520, children }: {
  title: string; onClose: () => void; width?: number; children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <>
      <motion.div className={styles.backdrop}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div className={styles.modal}
        style={{ maxWidth: "calc(100vw - 2rem)" }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </motion.div>
    </>,
    document.body
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return <p className={styles.errorBanner}>⚠ {message}</p>;
}

function ModalFooter({ onClose, onConfirm, isPending, confirmLabel, pendingLabel }: {
  onClose: () => void; onConfirm: () => void; isPending: boolean;
  confirmLabel: string; pendingLabel: string;
}) {
  return (
    <div className={styles.modalFooter}>
      <button onClick={onClose} className={styles.btnSecondary} disabled={isPending}>Cancel</button>
      <button onClick={onConfirm} disabled={isPending} className={styles.btnPrimary}>
        {isPending ? pendingLabel : confirmLabel}
      </button>
    </div>
  );
}

/* ─── Record Payment Modal ────────────────────────────────────── */
export function RecordPaymentModal({ onClose }: { onClose: () => void }) {
  const { data: members } = useMembers();
  const { data: subs }    = useMemberSubscriptions();
  const { mutate: create, isPending } = useCreatePayment();

  const [form, setForm] = useState<Partial<CreatePaymentPayload>>({
    paymentMode: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    amount: undefined,
    memberId: "",
    subscriptionId: "",
  });
  const [error, setError] = useState("");

  const activeMembers = members ?? [];

  const memberSubs = useMemo(() => {
    if (!subs || !form.memberId) return [];
    return subs.filter(s => {
      if (s.subscriptionStatus !== "ACTIVE") return false;
      const id = typeof s.memberId === "object" ? (s.memberId as any)?._id : s.memberId;
      return id === form.memberId;
    });
  }, [subs, form.memberId]);

  // Selected sub's pending amount for validation
  const selectedSub = memberSubs.find(s => s._id === form.subscriptionId);

  const handleSubmit = () => {
    if (!form.memberId)       { setError("Select a member."); return; }
    if (!form.subscriptionId) { setError("Select a subscription."); return; }
    if (!form.amount || form.amount <= 0) { setError("Enter a valid amount."); return; }
    if (selectedSub && form.amount > selectedSub.pendingAmount) {
      setError(`Amount cannot exceed pending ₹${selectedSub.pendingAmount.toLocaleString()}.`); return;
    }
    if (!form.paymentDate) { setError("Payment date is required."); return; }
    setError("");
    create(form as CreatePaymentPayload, {
      onSuccess: onClose,
      onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to record payment."),
    });
  };

  return (
    <ModalShell title="Record Payment" onClose={onClose}>
      {error && <ErrorBanner message={error} />}

      <div className={styles.formGrid}>
        {/* Member */}
        <Field label={`Member * (${activeMembers.length} with active subscription)`}>
          <MemberCombobox
            members={activeMembers}
            value={form.memberId ?? ""}
            onChange={id => { setForm(p => ({ ...p, memberId: id, subscriptionId: "" })); setError(""); }}
          />
        </Field>

        {/* Subscription */}
        <Field label="Subscription *">
          <select value={form.subscriptionId}
            onChange={e => { setForm(p => ({ ...p, subscriptionId: e.target.value })); setError(""); }}
            className={styles.select}
            disabled={!form.memberId}>
            <option value="">
              {!form.memberId
                ? "Select a member first…"
                : memberSubs.length === 0
                  ? "No active subscriptions found"
                  : "Select subscription…"}
            </option>
            {memberSubs.map(s => {
              const plan = typeof s.planId === "object" ? s.planId : null;
              return (
                <option key={s._id} value={s._id}>
                  {plan?.name ?? "—"} · pending ₹{s.pendingAmount.toLocaleString()}
                </option>
              );
            })}
          </select>
        </Field>

        {/* Amount + Mode */}
        <div className={styles.twoCol}>
          <Field label={selectedSub ? `Amount ₹ (max ₹${selectedSub.pendingAmount.toLocaleString()})` : "Amount (₹) *"}>
            <input type="number" min="1" max={selectedSub?.pendingAmount}
              placeholder="0" value={form.amount ?? ""}
              onChange={e => { setForm(p => ({ ...p, amount: Number(e.target.value) })); setError(""); }}
              className={styles.input}
              disabled={!form.subscriptionId}
            />
          </Field>
          <Field label="Payment Mode *">
            <select value={form.paymentMode}
              onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value as PaymentMode }))}
              className={styles.select}>
              {(["CASH", "CARD", "UPI", "ONLINE", "BANK_TRANSFER"] as PaymentMode[]).map(m => (
                <option key={m} value={m}>{m.replace("_", " ")}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Date + Transaction ID */}
        <div className={styles.twoCol}>
          <Field label="Payment Date *">
            <input type="date" value={form.paymentDate ?? ""}
              onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))}
              className={styles.input}
            />
          </Field>
          <Field label="Transaction ID">
            <input type="text" placeholder="Optional"
              value={form.transactionId ?? ""}
              onChange={e => setForm(p => ({ ...p, transactionId: e.target.value }))}
              className={styles.input}
            />
          </Field>
        </div>

        {/* Notes */}
        <Field label="Notes">
          <input type="text" placeholder="Optional notes"
            value={form.notes ?? ""}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className={styles.input}
          />
        </Field>

        {/* Pending summary */}
        {selectedSub && (
          <div className={styles.paymentSummary}>
            <div className={styles.paymentSummaryDetail}>
              Total:{" "}<strong style={{ color: "#ccc" }}>₹{selectedSub.planPrice.toLocaleString()}</strong>
              {" · "}Paid:{" "}<span className={styles.textSuccess}>₹{selectedSub.totalPaid.toLocaleString()}</span>
              {" · "}Pending:{" "}<span className={styles.textWarning}>₹{selectedSub.pendingAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <ModalFooter onClose={onClose} onConfirm={handleSubmit}
        isPending={isPending} confirmLabel="Record Payment" pendingLabel="Recording…" />
    </ModalShell>
  );
}