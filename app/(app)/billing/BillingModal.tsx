"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  useMembersPaged,
  useMemberById,
} from "@/services/members/members.hook";
import { usePlans } from "@/services/plans/plans.hook";
import {
  useMemberSubscriptionsByMember,
  useCreateMemberSubscription,
} from "@/services/subscriptions/subscriptions.hook";
import { useDebouncedValue } from "@/lib/use-debounced-value";
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
import { EASE_OUT_EXPO } from "@/config/motion";

export type BillingMode = "sell" | "collect";

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toYmd(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeExpiry(
  start: string,
  plan?: { duration: number; durationType: string } | null,
) {
  if (!start || !plan) return "";
  const d = new Date(start + "T12:00:00");
  if (isNaN(d.getTime())) return "";
  const units = Number(plan.duration) > 0 ? Number(plan.duration) : 1;
  switch (plan.durationType) {
    case "DAYS":
      d.setDate(d.getDate() + units);
      break;
    case "YEARS":
      d.setFullYear(d.getFullYear() + units);
      break;
    case "MONTHS":
    default:
      d.setMonth(d.getMonth() + units);
      break;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(ymd: string) {
  if (!ymd) return "—";
  const d = new Date(ymd + "T12:00:00");
  if (isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
  onQueryChange,
  placeholder = "Search and select a member…",
  emptyLabel = "No members match",
}: {
  members: Member[];
  value: string;
  onChange: (id: string) => void;
  onQueryChange?: (q: string) => void;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = members.find((m) => m._id === value) ?? null;
  const filtered = members;

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
              onChange={(e) => {
                setQuery(e.target.value);
                onQueryChange?.(e.target.value);
              }}
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
  const { data: plans } = usePlans();
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
  const [memberSearch, setMemberSearch] = useState("");
  const debouncedMemberSearch = useDebouncedValue(memberSearch, 250);
  const [planId, setPlanId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState(initialSubscriptionId);
  const [startDate, setStartDate] = useState(todayYmd());
  const [expiryDate, setExpiryDate] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [paymentDate, setPaymentDate] = useState(todayYmd());
  const [replaceActive, setReplaceActive] = useState(true);
  const [dueReminderDate, setDueReminderDate] = useState("");
  const [error, setError] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const busy = creatingSub || creatingPay || uploadingProof;
  const activePlans = (plans ?? []).filter((p) => p.status === "ACTIVE");

  const { data: membersPage } = useMembersPaged({
    page: 1,
    limit: 40,
    search: debouncedMemberSearch || undefined,
    hasPending: mode === "collect" ? "true" : undefined,
    status: mode === "sell" ? "ACTIVE" : undefined,
  });
  const { data: selectedMemberDetail } = useMemberById(memberId);
  const { data: memberSubsRaw } = useMemberSubscriptionsByMember(memberId);

  const selectableMembers = useMemo(() => {
    const items = membersPage?.items ?? [];
    if (
      selectedMemberDetail &&
      !items.some((m) => m._id === selectedMemberDetail._id)
    ) {
      return [selectedMemberDetail, ...items];
    }
    return items;
  }, [membersPage?.items, selectedMemberDetail]);

  const selectedPlan = activePlans.find((p) => p._id === planId);
  const selectedMember =
    selectableMembers.find((m) => m._id === memberId) ??
    selectedMemberDetail ??
    null;

  const allMemberSubs = memberSubsRaw ?? [];
  const memberSubs = useMemo(() => {
    if (!memberId) return [];
    if (mode === "collect") {
      return allMemberSubs.filter((s) => s.pendingAmount > 0);
    }
    return allMemberSubs.filter((s) => s.subscriptionStatus === "ACTIVE");
  }, [allMemberSubs, memberId, mode]);

  const selectedSub = memberSubs.find((s) => s._id === subscriptionId);
  const hasActiveSub =
    mode === "sell" &&
    allMemberSubs.some((s) => s.subscriptionStatus === "ACTIVE");

  /** Latest plan for this member (any status) — renew starts from its end date. */
  const priorSub = useMemo(() => {
    if (!memberId || !allMemberSubs.length) return null;
    return [...allMemberSubs].sort(
      (a, b) =>
        new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime(),
    )[0];
  }, [allMemberSubs, memberId]);

  const priorEndYmd = priorSub ? toYmd(priorSub.expiryDate) : "";

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

  // Renew default: start = previous end date (past or future). First plan → today.
  useEffect(() => {
    if (mode !== "sell") return;
    const nextStart = priorEndYmd || todayYmd();
    setStartDate(nextStart);
    if (selectedPlan) {
      setExpiryDate(computeExpiry(nextStart, selectedPlan));
    } else {
      setExpiryDate("");
    }
  }, [mode, memberId, priorEndYmd]); // eslint-disable-line react-hooks/exhaustive-deps

  // Plan change → recompute end from current start
  useEffect(() => {
    if (mode !== "sell" || !selectedPlan || !startDate) return;
    setExpiryDate(computeExpiry(startDate, selectedPlan));
  }, [planId, selectedPlan, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const sellPending =
    mode === "sell" && selectedPlan
      ? Math.max(
          selectedPlan.price - (amount === "" ? 0 : Number(amount)),
          0,
        )
      : 0;

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
        if (priorEndYmd && startDate < priorEndYmd) {
          setError(
            `Renew start cannot be before previous end (${formatDisplayDate(priorEndYmd)}).`,
          );
          return;
        }
        if (!expiryDate) {
          setError("End date is required.");
          return;
        }
        if (expiryDate <= startDate) {
          setError("End date must be after start date.");
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
        const pending = selectedPlan
          ? Math.max(selectedPlan.price - received, 0)
          : 0;
        if (pending > 0 && !dueReminderDate) {
          setError(
            "Due reminder date is required when renew / assign is partial.",
          );
          return;
        }

        const created = await createSub({
          memberId,
          planId,
          startDate,
          expiryDate,
          initialPayment: received,
          paymentMode: received > 0 ? paymentMode : undefined,
          replaceActive: hasActiveSub ? replaceActive : undefined,
          dueReminderDate: pending > 0 ? dueReminderDate : undefined,
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
        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
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
              onQueryChange={setMemberSearch}
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
                Member has an active plan — renew will end it if checked
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
                    min={priorEndYmd || undefined}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (priorEndYmd && v && v < priorEndYmd) {
                        v = priorEndYmd;
                      }
                      setStartDate(v);
                      if (selectedPlan) {
                        setExpiryDate(computeExpiry(v, selectedPlan));
                      }
                    }}
                  />
                  {priorEndYmd ? (
                    <span className={styles.fieldHint}>
                      Cannot start before previous end{" "}
                      {formatDisplayDate(priorEndYmd)} — later dates OK
                    </span>
                  ) : null}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>End date *</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    min={startDate || undefined}
                  />
                  {selectedPlan ? (
                    <span className={styles.fieldHint}>
                      Default from plan ({selectedPlan.duration}{" "}
                      {selectedPlan.durationType.toLowerCase()}) — editable
                    </span>
                  ) : (
                    <span className={styles.fieldHint}>
                      Select a plan to auto-fill end date
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.twoCol}>
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
                      selectedPlan ? `0 – ${selectedPlan.price}` : "0"
                    }
                    value={amount}
                    onChange={(e) => {
                      setAmount(
                        e.target.value === "" ? "" : Number(e.target.value),
                      );
                      if (
                        selectedPlan &&
                        e.target.value !== "" &&
                        Number(e.target.value) >= selectedPlan.price
                      ) {
                        setDueReminderDate("");
                      }
                    }}
                    disabled={!planId}
                  />
                  {selectedPlan ? (
                    <span className={styles.fieldHint}>
                      Plan{" "}
                      {formatAmountWithGstInline(
                        selectedPlan.price,
                        taxPercentage,
                        taxMode,
                      )}{" "}
                      · Pending{" "}
                      {formatAmountWithGstInline(
                        sellPending,
                        taxPercentage,
                        taxMode,
                      )}
                    </span>
                  ) : null}
                </div>
                {sellPending > 0 ? (
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      Due reminder date *
                    </label>
                    <input
                      type="date"
                      className={styles.input}
                      value={dueReminderDate}
                      min={todayYmd()}
                      onChange={(e) => setDueReminderDate(e.target.value)}
                    />
                    <span className={styles.fieldHint}>
                      Required for partial renew — shows on Partial dues
                    </span>
                  </div>
                ) : (
                  <div className={styles.field} />
                )}
              </div>

              {hasActiveSub ? (
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={replaceActive}
                    onChange={(e) => setReplaceActive(e.target.checked)}
                  />
                  <span>
                    Cancel current plan (marks it Ended) and assign this one
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
                    const plan = typeof s.planId === "object" ? s.planId : null;
                    const start = s.startDate
                      ? new Date(s.startDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";
                    const end = s.expiryDate
                      ? new Date(s.expiryDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";
                    return (
                      <option key={s._id} value={s._id}>
                        {plan?.name ?? "—"} · {start} → {end} · pending ₹
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
                    Plan from{" "}
                    {selectedSub.startDate
                      ? new Date(selectedSub.startDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "—"}{" "}
                    → valid till{" "}
                    {selectedSub.expiryDate
                      ? new Date(selectedSub.expiryDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "—"}
                  </div>
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
