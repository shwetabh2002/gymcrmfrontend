"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  useCreateMemberSubscription,
  useDeleteMemberSubscription,
} from "@/services/subscriptions/subscriptions.hook";
import { useMembers } from "@/services/members/members.hook";
import { usePlans } from "@/services/plans/plans.hook";
import { MemberSubscription } from "@/services/subscriptions/subscriptions.api";
import { Member } from "@/services/members/members.api";
import styles from "./subscriptions.module.css";

/* ─── Helpers ─────────────────────────────────────────────────── */
export function getPlan(sub: MemberSubscription) {
  return typeof sub.planId === "object" ? sub.planId : null;
}
export function getMember(sub: MemberSubscription) {
  return typeof sub.memberId === "object" ? sub.memberId : null;
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

/* ─── Searchable Member Combobox ──────────────────────────────── */
interface MemberComboboxProps {
  members: Member[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

function MemberCombobox({ members, value, onChange, disabled }: MemberComboboxProps) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef           = useRef<HTMLDivElement>(null);
  const searchRef         = useRef<HTMLInputElement>(null);

  const selected = members.find(m => m._id === value) ?? null;
  const filtered = query.trim()
    ? members.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        (m.contactNumber ?? "").includes(query)
      )
    : members;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery("");
      }
    }
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
        role="button" tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox" aria-expanded={open}
        className={`${styles.comboboxTrigger} ${open ? styles.comboboxTriggerOpen : ""}`}
        onClick={() => { if (!disabled) setOpen(v => !v); }}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!disabled) setOpen(v => !v); } }}
      >
        {selected ? (
          <span className={styles.comboboxSelectedVal}>
            <span className={styles.comboboxSelectedName}>{selected.name}</span>
            <span className={styles.comboboxSelectedEmail}>{selected.contactNumber}</span>
          </span>
        ) : (
          <span className={styles.comboboxPlaceholder}>Search and select a member…</span>
        )}
        <span className={styles.comboboxSuffix}>
          {selected ? (
            <span role="button" tabIndex={0} aria-label="Clear selection" className={styles.comboboxClearBtn}
              onClick={handleClear} onKeyDown={e => { if (e.key === "Enter") handleClear(e as any); }}>✕</span>
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
            ) : (
              filtered.map(m => (
                <div key={m._id} role="option" aria-selected={m._id === value}
                  className={`${styles.comboboxItem} ${m._id === value ? styles.comboboxItemActive : ""}`}
                  onClick={() => handleSelect(m)}>
                  <div className={styles.comboboxItemName}>{highlight(m.name, query)}</div>
                  <div className={styles.comboboxItemEmail}>{m.contactNumber} {m.instagramHandle ? `· ${m.instagramHandle}` : ""}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shared Modal Shell ──────────────────────────────────────── */
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
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

function ErrorBanner({ message }: { message: string }) {
  return <p className={styles.errorBanner}>⚠ {message}</p>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {hint && <p className={styles.warnInline}>{hint}</p>}
    </div>
  );
}

function ModalFooter({ onClose, onConfirm, isPending, confirmLabel, pendingLabel, danger }: {
  onClose: () => void; onConfirm: () => void; isPending: boolean;
  confirmLabel: string; pendingLabel: string; danger?: boolean;
}) {
  return (
    <div className={styles.modalFooter}>
      <button onClick={onClose} className={styles.btnSecondary} disabled={isPending}>Cancel</button>
      <button onClick={onConfirm} disabled={isPending} className={danger ? styles.btnDanger : styles.btnPrimary}>
        {isPending ? pendingLabel : confirmLabel}
      </button>
    </div>
  );
}

/* ─── Create Subscription Modal ───────────────────────────────── */
export function CreateSubscriptionModal({ onClose }: { onClose: () => void }) {
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: plans,   isLoading: plansLoading }   = usePlans();
  const { mutate: create, isPending } = useCreateMemberSubscription();

  const [form, setForm] = useState({
    memberId: "", planId: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");

  const selectedMember    = members?.find(m => m._id === form.memberId);
  const assignableMembers = members?.filter(m => m.memberStatus === "ACTIVE") ?? [];
  const activePlans       = plans?.filter(p => p.status === "ACTIVE") ?? [];
  const memberHasActiveSub = !!selectedMember?.currentSubscriptionId;

  const handleSubmit = () => {
    if (!form.memberId)  { setError("Please select a member."); return; }
    if (!form.planId)    { setError("Please select a plan."); return; }
    if (!form.startDate) { setError("Start date is required."); return; }
    setError("");
    create(
      { memberId: form.memberId, planId: form.planId, startDate: form.startDate, initialPayment: 0 },
      { onSuccess: onClose, onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to assign subscription.") }
    );
  };

  return (
    <ModalShell title="Assign Subscription" onClose={onClose}>
      {error && <ErrorBanner message={error} />}
      {(membersLoading || plansLoading) ? (
        <p className={styles.stateLoading}>Loading…</p>
      ) : (
        <div className={styles.formGrid}>
          <Field
            label={`Member * (${assignableMembers.length} active)`}
            hint={memberHasActiveSub ? "⚠ This member already has an active subscription." : undefined}
          >
            <MemberCombobox members={assignableMembers} value={form.memberId}
              onChange={id => { setForm(p => ({ ...p, memberId: id })); setError(""); }}
            />
          </Field>

          <Field label="Plan *">
            <select value={form.planId}
              onChange={e => { setForm(p => ({ ...p, planId: e.target.value })); setError(""); }}
              className={styles.select}>
              <option value="">Select a plan…</option>
              {activePlans.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.duration} {p.durationType.toLowerCase()} · ₹{p.price.toLocaleString()}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Start Date *">
            <input type="date" value={form.startDate}
              onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
              className={styles.input}
            />
          </Field>
        </div>
      )}
      <ModalFooter onClose={onClose} onConfirm={handleSubmit} isPending={isPending}
        confirmLabel="Assign Subscription" pendingLabel="Assigning…" />
    </ModalShell>
  );
}

/* ─── Delete Confirm Modal ────────────────────────────────────── */
export function DeleteSubDialog({ sub, onClose }: { sub: MemberSubscription; onClose: () => void }) {
  const { mutate: del, isPending } = useDeleteMemberSubscription();
  return (
    <ModalShell title="Delete Subscription" onClose={onClose}>
      <p className={styles.deleteBody}>
        Are you sure you want to permanently delete the subscription for{" "}
        <strong className={styles.deleteHighlight}>{getMember(sub)?.name ?? "this member"}</strong>?{" "}
        This action cannot be undone.
      </p>
      <ModalFooter onClose={onClose} onConfirm={() => del(sub._id, { onSuccess: onClose })}
        isPending={isPending} confirmLabel="Yes, Delete" pendingLabel="Deleting…" danger />
    </ModalShell>
  );
}
