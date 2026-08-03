"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useMembers } from "@/services/members/members.hook";
import { usePlans } from "@/services/plans/plans.hook";
import {
  useMemberSubscriptions,
  useCreateMemberSubscription,
} from "@/services/subscriptions/subscriptions.hook";
import {
  useCreatePayment,
  useUploadPaymentProof,
} from "@/services/payments/payments.hooks";
import { Member } from "@/services/members/members.api";
import { PaymentMode } from "@/services/payments/payments.api";
import {
  UPLOAD_ACCEPT,
  resolveUploadLimits,
  validateImageFile,
} from "@/lib/upload";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import { resolveInvoiceTax, formatAmountWithGstInline } from "@/lib/tax";
import styles from "./Billing.module.css";

export type BillingMode = "sell" | "collect";

function highlight(text: string | undefined | null, query: string) {
  const safe = text ?? "";
  if (!query.trim()) return <>{safe}</>;
  const idx = safe.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{safe}</>;
  return (
    <>
      {safe.slice(0, idx)}
      <span className={styles.comboboxHighlight}>
        {safe.slice(idx, idx + query.length)}
      </span>
      {safe.slice(idx + query.length)}
    </>
  );
}

function MemberCombobox({
  members,
  value,
  onChange,
  placeholder = "Search and select a member…",
  emptyLabel = "No members match",
}: {
  members: Member[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = members.find((m) => m._id === value) ?? null;
  const filtered = query.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          (m.contactNumber ?? "").includes(query),
      )
    : members;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const handleSelect = useCallback(
    (m: Member) => {
      onChange(m._id);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  return (
    <div ref={wrapRef} className={styles.comboboxWrap}>
      <div
        role="button"
        tabIndex={0}
        className={`${styles.comboboxTrigger} ${open ? styles.comboboxTriggerOpen : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        {selected ? (
          <span className={styles.comboboxSelectedVal}>
            <span className={styles.comboboxSelectedName}>{selected.name}</span>
            <span className={styles.comboboxSelectedEmail}>
              {selected.contactNumber}
            </span>
          </span>
        ) : (
          <span className={styles.comboboxPlaceholder}>{placeholder}</span>
        )}
        <span className={styles.comboboxChevron}>▾</span>
      </div>
      {open && (
        <div className={styles.comboboxDropdown} role="listbox">
          <div className={styles.comboboxSearchWrap}>
            <input
              ref={searchRef}
              className={styles.comboboxSearchInput}
              placeholder="Search by name or contact…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className={styles.comboboxList}>
            {filtered.length === 0 ? (
              <div className={styles.comboboxEmpty}>{emptyLabel}</div>
            ) : (
              filtered.map((m) => (
                <div
                  key={m._id}
                  role="option"
                  className={`${styles.comboboxItem} ${m._id === value ? styles.comboboxItemActive : ""}`}
                  onClick={() => handleSelect(m)}
                >
                  <div className={styles.comboboxItemName}>
                    {highlight(m.name, query)}
                  </div>
                  <div className={styles.comboboxItemEmail}>
                    {highlight(m.contactNumber, query)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function BillingModal({
  onClose,
  initialMode = "sell",
  initialMemberId = "",
  initialSubscriptionId = "",
}: {
  onClose: () => void;
  initialMode?: BillingMode;
  initialMemberId?: string;
  initialSubscriptionId?: string;
}) {
  const { data: members } = useMembers();
  const { data: plans } = usePlans();
  const { data: subs } = useMemberSubscriptions();
  const { mutateAsync: createSub, isPending: creatingSub } =
    useCreateMemberSubscription();
  const { mutateAsync: createPay, isPending: creatingPay } = useCreatePayment();
  const { mutateAsync: uploadProof, isPending: uploadingProof } =
    useUploadPaymentProof();
  const { data: gymSettings } = useGymSettings();
  const { taxPercentage, taxMode } = resolveInvoiceTax(gymSettings);
  const uploadLimits = resolveUploadLimits();

  const [mode, setMode] = useState<BillingMode>(initialMode);
  const [memberId, setMemberId] = useState(initialMemberId);
  const [planId, setPlanId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState(initialSubscriptionId);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [replaceActive, setReplaceActive] = useState(true);
  const [error, setError] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const busy = creatingSub || creatingPay || uploadingProof;
  const allMembers = members ?? [];
  const activePlans = (plans ?? []).filter((p) => p.status === "ACTIVE");

  /** Member IDs that have at least one sub with pending dues */
  const memberIdsWithDues = useMemo(() => {
    const ids = new Set<string>();
    for (const s of subs ?? []) {
      if (s.pendingAmount > 0) {
        const id =
          typeof s.memberId === "object"
            ? (s.memberId as { _id?: string })?._id
            : s.memberId;
        if (id) ids.add(String(id));
      }
    }
    return ids;
  }, [subs]);

  const selectableMembers = useMemo(() => {
    if (mode !== "collect") return allMembers;
    return allMembers.filter((m) => memberIdsWithDues.has(m._id));
  }, [mode, allMembers, memberIdsWithDues]);

  const selectedPlan = activePlans.find((p) => p._id === planId);
  const selectedMember = selectableMembers.find((m) => m._id === memberId);

  const memberSubs = useMemo(() => {
    if (!subs || !memberId) return [];
    return subs.filter((s) => {
      const id =
        typeof s.memberId === "object"
          ? (s.memberId as { _id?: string })?._id
          : s.memberId;
      if (id !== memberId) return false;
      if (mode === "collect") {
        return s.pendingAmount > 0;
      }
      return s.subscriptionStatus === "ACTIVE";
    });
  }, [subs, memberId, mode]);

  const selectedSub = memberSubs.find((s) => s._id === subscriptionId);
  const hasActiveSub =
    mode === "sell" &&
    (subs ?? []).some((s) => {
      if (s.subscriptionStatus !== "ACTIVE") return false;
      const id =
        typeof s.memberId === "object"
          ? (s.memberId as { _id?: string })?._id
          : s.memberId;
      return id === memberId;
    });

  // Drop selection if member has no dues when switching to collect
  useEffect(() => {
    if (mode === "collect" && memberId && !memberIdsWithDues.has(memberId)) {
      setMemberId("");
      setSubscriptionId("");
      setAmount("");
    }
  }, [mode, memberId, memberIdsWithDues]);

  useEffect(() => {
    if (mode === "sell" && selectedPlan && amount === "") {
      setAmount(selectedPlan.price);
    }
  }, [selectedPlan, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === "collect" && memberSubs.length === 1) {
      setSubscriptionId(memberSubs[0]._id);
    }
  }, [mode, memberSubs]);

  const onProofPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const errMsg = validateImageFile(file, uploadLimits);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setError("");
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!memberId) {
      setError("Select a member.");
      return;
    }
    setError("");

    try {
      if (mode === "sell") {
        if (!planId) {
          setError("Select a plan.");
          return;
        }
        if (!startDate) {
          setError("Start date is required.");
          return;
        }
        const received = amount === "" ? 0 : Number(amount);
        if (received < 0) {
          setError("Amount cannot be negative.");
          return;
        }
        if (selectedPlan && received > selectedPlan.price) {
          setError(`Amount cannot exceed plan price ₹${selectedPlan.price}.`);
          return;
        }

        const created = await createSub({
          memberId,
          planId,
          startDate,
          initialPayment: received,
          paymentMode: received > 0 ? paymentMode : undefined,
          replaceActive: hasActiveSub ? replaceActive : undefined,
        });

        if (proofFile && created?.initialPaymentId) {
          await uploadProof({ id: created.initialPaymentId, file: proofFile });
        }
        onClose();
        return;
      }

      // collect dues
      if (!subscriptionId) {
        setError("Select a subscription.");
        return;
      }
      if (!amount || Number(amount) <= 0) {
        setError("Enter a valid amount.");
        return;
      }
      if (selectedSub && Number(amount) > selectedSub.pendingAmount) {
        setError(
          `Amount cannot exceed pending ₹${selectedSub.pendingAmount.toLocaleString()}.`,
        );
        return;
      }
      if (!paymentDate) {
        setError("Payment date is required.");
        return;
      }

      const created = await createPay({
        memberId,
        subscriptionId,
        amount: Number(amount),
        paymentMode,
        paymentDate,
      });
      if (proofFile && created?._id) {
        await uploadProof({ id: created._id, file: proofFile });
      }
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Save failed.");
    }
  };

  return createPortal(
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Memberships & Payments</h2>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.modeTabs}>
          <button
            type="button"
            className={`${styles.modeTab} ${mode === "sell" ? styles.modeTabOn : ""}`}
            onClick={() => {
              setMode("sell");
              setError("");
              setSubscriptionId("");
              setAmount("");
            }}
          >
            Sell / Renew plan
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${mode === "collect" ? styles.modeTabOn : ""}`}
            onClick={() => {
              setMode("collect");
              setError("");
              setPlanId("");
              setAmount("");
            }}
          >
            Collect dues
          </button>
        </div>

        {error ? <p className={styles.errorBanner}>⚠ {error}</p> : null}

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Member *</label>
            <MemberCombobox
              members={selectableMembers}
              value={memberId}
              onChange={(id) => {
                setMemberId(id);
                setSubscriptionId("");
                setError("");
              }}
              emptyLabel={
                mode === "collect"
                  ? "No members with pending dues"
                  : "No members match"
              }
              placeholder={
                mode === "collect"
                  ? "Search members with dues…"
                  : "Search and select a member…"
              }
            />
            {selectedMember?.currentSubscriptionId && mode === "sell" ? (
              <span className={styles.fieldHint}>
                Member has an active plan — renew will replace it if checked
                below.
              </span>
            ) : null}
          </div>

          {mode === "sell" ? (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Plan *</label>
                <select
                  className={styles.select}
                  value={planId}
                  onChange={(e) => {
                    setPlanId(e.target.value);
                    setAmount("");
                  }}
                >
                  <option value="">Select a plan…</option>
                  {activePlans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — {p.duration} {p.durationType.toLowerCase()} ·{" "}
                      {formatAmountWithGstInline(
                        p.price,
                        taxPercentage,
                        taxMode,
                      )}
                    </option>
                  ))}
                </select>
                {selectedPlan && taxPercentage > 0 ? (
                  <span className={styles.fieldHint}>
                    Plan price{" "}
                    {formatAmountWithGstInline(
                      selectedPlan.price,
                      taxPercentage,
                      taxMode,
                    )}
                  </span>
                ) : null}
              </div>

              <div className={styles.twoCol}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Start date *</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    Amount received (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={selectedPlan?.price}
                    className={styles.input}
                    placeholder={
                      selectedPlan
                        ? `0 – ${selectedPlan.price}`
                        : "0"
                    }
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    disabled={!planId}
                  />
                </div>
              </div>

              {hasActiveSub ? (
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={replaceActive}
                    onChange={(e) => setReplaceActive(e.target.checked)}
                  />
                  <span>
                    Cancel current active subscription and assign this plan
                  </span>
                </label>
              ) : null}
            </>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Subscription *</label>
                <select
                  className={styles.select}
                  value={subscriptionId}
                  disabled={!memberId}
                  onChange={(e) => setSubscriptionId(e.target.value)}
                >
                  <option value="">
                    {!memberId
                      ? "Select a member first…"
                      : memberSubs.length === 0
                        ? "No pending dues on subscriptions"
                        : "Select subscription…"}
                  </option>
                  {memberSubs.map((s) => {
                    const plan =
                      typeof s.planId === "object" ? s.planId : null;
                    return (
                      <option key={s._id} value={s._id}>
                        {plan?.name ?? "—"} · pending ₹
                        {s.pendingAmount.toLocaleString("en-IN")}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className={styles.twoCol}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    {selectedSub
                      ? `Amount ₹ (max ${selectedSub.pendingAmount.toLocaleString("en-IN")})`
                      : "Amount (₹) *"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedSub?.pendingAmount}
                    className={styles.input}
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    disabled={!subscriptionId}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Payment date *</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedSub ? (
                <div className={styles.paymentSummary}>
                  <div className={styles.paymentSummaryDetail}>
                    Total{" "}
                    {formatAmountWithGstInline(
                      selectedSub.planPrice,
                      taxPercentage,
                      taxMode,
                    )}{" "}
                    · Paid{" "}
                    {formatAmountWithGstInline(
                      selectedSub.totalPaid,
                      taxPercentage,
                      taxMode,
                    )}{" "}
                    · Pending{" "}
                    {formatAmountWithGstInline(
                      selectedSub.pendingAmount,
                      taxPercentage,
                      taxMode,
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}

          {(mode === "collect" || (mode === "sell" && Number(amount) > 0)) && (
            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Payment mode</label>
                <select
                  className={styles.select}
                  value={paymentMode}
                  onChange={(e) =>
                    setPaymentMode(e.target.value as PaymentMode)
                  }
                >
                  {(
                    ["CASH", "UPI", "CARD", "BANK_TRANSFER"] as PaymentMode[]
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Screenshot (optional)
                </label>
                {proofPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={proofPreview}
                    alt="Proof"
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 6,
                      marginBottom: 6,
                      display: "block",
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : null}
                <input
                  type="file"
                  accept={UPLOAD_ACCEPT}
                  onChange={onProofPick}
                  disabled={busy}
                />
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy
              ? "Saving…"
              : mode === "sell"
                ? "Assign & save"
                : "Record payment"}
          </button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}
