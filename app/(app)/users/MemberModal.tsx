"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateMember, useUpdateMember, useUploadMemberPhoto } from "@/services/members/members.hook";
import { Member, CreateMemberPayload, PaymentMode } from "@/services/members/members.api";
import { useUploadPaymentProof } from "@/services/payments/payments.hooks";
import {
  checkoutApi,
  CheckoutSession,
} from "@/services/payments/provider.api";
import { usePlans } from "@/services/plans/plans.hook";
import { useEmployees } from "@/services/employees/employees.hooks";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import { locationsApi, LocationRow } from "@/services/locations/locations.api";
import { useAuth } from "@/lib/context/AuthContext";
import { Plan } from "@/services/plans/plans.api";
import {
  resolveUploadLimits,
  validateImageFile,
  UPLOAD_ACCEPT,
} from "@/lib/upload";
import { resolveInvoiceTax, formatAmountWithGstInline } from "@/lib/tax";
import styles from "./MemberModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Member | null;
}

type FormState = {
  name: string;
  phone: string;
  registrationDate: string;
  dob: string;
  instagramHandle: string;
  planId: string;
  paymentMode: PaymentMode | "";
  amount: number | "";
  received: number | "";
  pending: number | "";
  startingDate: string;
  expiryDate: string;
  trainingType: "GT" | "PT" | "OTHER";
  trainerId: string;
  salesPersonId: string;
  memberStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  locationId: string;
  enableAutopay: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

function computeExpiry(start: string, plan?: Plan | null) {
  if (!start || !plan) return "";
  const d = new Date(start);
  if (isNaN(d.getTime())) return "";
  switch (plan.durationType) {
    case "DAYS":
      d.setDate(d.getDate() + plan.duration);
      break;
    case "MONTHS":
      d.setMonth(d.getMonth() + plan.duration);
      break;
    case "YEARS":
      d.setFullYear(d.getFullYear() + plan.duration);
      break;
  }
  return d.toISOString().slice(0, 10);
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  registrationDate: today(),
  dob: "",
  instagramHandle: "",
  planId: "",
  paymentMode: "",
  amount: "",
  received: "",
  pending: "",
  startingDate: today(),
  expiryDate: "",
  trainingType: "GT",
  trainerId: "",
  salesPersonId: "",
  memberStatus: "ACTIVE",
  locationId: "",
  enableAutopay: false,
};

/** Opens WhatsApp with pre-filled payment message (staff taps Send). */
function openWhatsAppShare(url: string | null | undefined) {
  if (!url || typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function MemberModal({ open, onClose, existing }: Props) {
  const isEdit = !!existing;
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<CheckoutSession | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const { data: plans } = usePlans();
  const { data: trainers } = useEmployees({ type: "TRAINER", status: "ACTIVE" });
  const { data: salesPeople } = useEmployees({ type: "SALES", status: "ACTIVE" });
  const { data: settings } = useGymSettings();
  const companyAutopayOn = settings?.autopayEnabled === true;
  const uploadLimits = resolveUploadLimits(settings?.upload);
  const { taxPercentage, taxMode } = resolveInvoiceTax(settings);

  const { mutateAsync: createMember, isPending: creating } = useCreateMember();
  const { mutateAsync: updateMember, isPending: updating } = useUpdateMember();
  const { mutateAsync: uploadPhoto, isPending: uploadingPhoto } =
    useUploadMemberPhoto();
  const { mutateAsync: uploadProof, isPending: uploadingProof } =
    useUploadPaymentProof();
  const isPending =
    creating || updating || uploadingPhoto || uploadingProof || checkoutBusy;

  const activePlans = useMemo(
    () => (plans ?? []).filter((p) => p.status === "ACTIVE"),
    [plans],
  );

  const activeLocations = useMemo(
    () => locations.filter((l) => l.status === "ACTIVE"),
    [locations],
  );

  const idPreview = `${(settings?.memberIdPrefix || "GYM").toUpperCase()}-####`;

  // Poll checkout session until paid / failed / expired
  useEffect(() => {
    if (!checkoutStep || !checkout?.sessionId) return;
    if (["PAID", "FAILED", "EXPIRED", "CANCELLED"].includes(checkout.status)) {
      return;
    }
    const t = setInterval(async () => {
      try {
        const s = await checkoutApi.get(checkout.sessionId);
        setCheckout(s);
        if (s.status === "PAID") {
          clearInterval(t);
          onClose();
        }
      } catch {
        /* ignore transient poll errors */
      }
    }, 2500);
    return () => clearInterval(t);
  }, [checkoutStep, checkout?.sessionId, checkout?.status, onClose]);

  useEffect(() => {
    if (!open) {
      setCheckout(null);
      setCheckoutStep(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    locationsApi
      .list()
      .then(setLocations)
      .catch(() => setLocations([]));
  }, [open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? "",
        phone: existing.contactNumber || existing.phone || "",
        registrationDate: existing.registrationDate
          ? String(existing.registrationDate).slice(0, 10)
          : existing.date
            ? String(existing.date).slice(0, 10)
            : today(),
        dob: existing.dob ? String(existing.dob).slice(0, 10) : "",
        instagramHandle: existing.instagramHandle ?? "",
        planId: existing.planId ?? "",
        paymentMode: "",
        amount: existing.amount ?? "",
        received: existing.received ?? "",
        pending: existing.pending ?? "",
        startingDate: existing.startingDate
          ? String(existing.startingDate).slice(0, 10)
          : today(),
        expiryDate: existing.expiryDate
          ? String(existing.expiryDate).slice(0, 10)
          : "",
        trainingType: (existing.trainingType as FormState["trainingType"]) || "GT",
        trainerId: existing.trainerId ?? "",
        salesPersonId: existing.salesPersonId ?? "",
        memberStatus:
          existing.memberStatus === "EXPIRED"
            ? "INACTIVE"
            : (existing.memberStatus as FormState["memberStatus"]) || "ACTIVE",
        locationId: existing.locationId ?? "",
        enableAutopay: false,
      });
    } else {
      const defaultLoc =
        user?.locationId ||
        locations.find((l) => l.isDefault)?.id ||
        locations[0]?.id ||
        "";
      setForm({
        ...EMPTY,
        registrationDate: today(),
        startingDate: today(),
        locationId: defaultLoc,
        enableAutopay: settings?.autopayEnabled === true,
      });
    }
    setError("");
    setPhotoFile(null);
    setPhotoPreview(existing?.photoUrl ?? null);
    setProofFile(null);
    setProofPreview(null);
    setLinkCopied(false);
  }, [existing, open, user?.locationId, locations, settings?.autopayEnabled]);

  const onPhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const errMsg = validateImageFile(file, uploadLimits);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

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

  const applyPlan = (planId: string, startingDate?: string) => {
    const plan = activePlans.find((p) => p._id === planId);
    const start = startingDate ?? (form.startingDate || today());
    setForm((prev) => {
      const amount = plan?.price ?? prev.amount;
      const received = prev.received === "" ? 0 : Number(prev.received);
      const pending =
        amount === "" || amount == null
          ? prev.pending
          : Math.max(Number(amount) - received, 0);
      return {
        ...prev,
        planId,
        startingDate: start,
        expiryDate: computeExpiry(start, plan),
        amount: amount === undefined ? prev.amount : amount,
        pending,
      };
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "planId") {
      applyPlan(value);
      return;
    }

    if (name === "startingDate") {
      const plan = activePlans.find((p) => p._id === form.planId);
      setForm((prev) => ({
        ...prev,
        startingDate: value,
        expiryDate: plan ? computeExpiry(value, plan) : prev.expiryDate,
      }));
      return;
    }

    if (name === "received" || name === "amount") {
      const num = value === "" ? "" : Number(value);
      setForm((prev) => {
        const amount = name === "amount" ? num : prev.amount;
        const received = name === "received" ? num : prev.received;
        const pending =
          amount === "" || received === ""
            ? prev.pending
            : Math.max(Number(amount) - Number(received), 0);
        return { ...prev, [name]: num, pending };
      });
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and contact number are required.");
      return;
    }

    try {
      if (isEdit && existing) {
        await updateMember({
          id: existing._id,
          payload: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            registrationDate: form.registrationDate || undefined,
            dob: form.dob || undefined,
            instagramHandle: form.instagramHandle || undefined,
            trainingType: form.trainingType,
            trainerId: form.trainerId || undefined,
            salesPersonId: form.salesPersonId || undefined,
            memberStatus: form.memberStatus,
          },
        });
        if (photoFile) {
          await uploadPhoto({ id: existing._id, file: photoFile });
        }
        onClose();
        return;
      }

      if (!form.planId) {
        setError("Please select a membership plan.");
        return;
      }
      if (!form.locationId) {
        setError("Please select a location / branch.");
        return;
      }

      // Online / UPI Autopay → checkout session (QR + link + poll)
      if (form.paymentMode === "ONLINE") {
        const received =
          form.received === "" ? Number(form.amount) || 0 : Number(form.received);
        if (!(received > 0)) {
          setError("Received amount must be greater than 0 for online checkout.");
          return;
        }
        setCheckoutBusy(true);
        try {
          const session = await checkoutApi.create({
            name: form.name.trim(),
            phone: form.phone.trim(),
            planId: form.planId,
            locationId: form.locationId,
            amount: form.amount === "" ? received : Number(form.amount),
            received,
            startingDate: form.startingDate || today(),
            expiryDate: form.expiryDate || undefined,
            registrationDate: form.registrationDate || undefined,
            dob: form.dob || undefined,
            trainingType: form.trainingType,
            trainerId: form.trainerId || undefined,
            salesPersonId: form.salesPersonId || undefined,
            enableAutopay: companyAutopayOn && form.enableAutopay,
            idempotencyKey: `${form.phone.trim()}-${form.planId}-${Date.now()}`,
          });
          setCheckout(session);
          setCheckoutStep(true);
          // Auto-send is done by backend to member phone.
          // Only open wa.me if auto-send failed (rare).
          if (
            session.whatsappUrl &&
            !session.whatsappSent &&
            session.whatsappMode === "wa_me"
          ) {
            openWhatsAppShare(session.whatsappUrl);
          }
        } finally {
          setCheckoutBusy(false);
        }
        return;
      }

      const payload: CreateMemberPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        registrationDate: form.registrationDate || undefined,
        dob: form.dob || undefined,
        instagramHandle: form.instagramHandle || undefined,
        trainingType: form.trainingType,
        trainerId: form.trainerId || undefined,
        salesPersonId: form.salesPersonId || undefined,
        memberStatus: form.memberStatus,
        planId: form.planId,
        startingDate: form.startingDate || undefined,
        expiryDate: form.expiryDate || undefined,
        amount: form.amount === "" ? undefined : Number(form.amount),
        received: form.received === "" ? 0 : Number(form.received),
        paymentMode: (form.paymentMode || "CASH") as PaymentMode,
        locationId: form.locationId,
      };

      const created = await createMember(payload);
      if (photoFile && created?._id) {
        await uploadPhoto({ id: created._id, file: photoFile });
      }
      if (proofFile && created?.initialPaymentId) {
        await uploadProof({ id: created.initialPaymentId, file: proofFile });
      }
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          (isEdit ? "Update failed." : "Create failed."),
      );
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
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>
                  {isEdit ? "Edit Member" : "Add New Member"}
                </h2>
                <p className={styles.modalSubtitle}>
                  {isEdit
                    ? `Editing ${existing?.name}`
                    : "Fill in the member details below."}
                </p>
              </div>
              <button
                className={styles.modalClose}
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            {checkoutStep && checkout ? (
              <>
                <div className={styles.scrollBody}>
                  <div className={styles.sectionLabel}>Waiting for payment</div>
                  <div className={styles.fields}>
                    <p className={styles.modalSubtitle}>
                      Status: <strong>{checkout.status}</strong>
                      {checkout.enableAutopay
                        ? " · UPI Autopay mandate"
                        : " · One-time"}
                    </p>
                    <p className={styles.hint} style={{ marginBottom: 12 }}>
                      {checkout.whatsappSent
                        ? `Payment link AUTO-SENT to WhatsApp ${
                            checkout.whatsappToPhone
                              ? checkout.whatsappToPhone.startsWith("91") &&
                                checkout.whatsappToPhone.length === 12
                                ? `+91 ${checkout.whatsappToPhone.slice(2)}`
                                : `+${checkout.whatsappToPhone}`
                              : "member number"
                          }. Member pay kare — status yahan update hoga.`
                        : "Auto-send fail hua. Niche Open WhatsApp se manually bhejo."}
                    </p>
                    {checkout.qrData ? (
                      <div style={{ textAlign: "center", margin: "16px 0" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkout.qrData)}`}
                          alt="Payment QR"
                          width={200}
                          height={200}
                          style={{
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "#fff",
                          }}
                        />
                        <p className={styles.hint} style={{ marginTop: 8 }}>
                          Scan with UPI app or open the link on the member&apos;s
                          phone
                        </p>
                      </div>
                    ) : null}
                    {checkout.shareUrl ? (
                      <div className={styles.field}>
                        <label className={styles.label}>Payment link</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            className={styles.input}
                            readOnly
                            value={checkout.shareUrl}
                            onFocus={(e) => e.target.select()}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  checkout.shareUrl || "",
                                );
                                setLinkCopied(true);
                                setTimeout(() => setLinkCopied(false), 2000);
                              } catch {
                                /* ignore */
                              }
                            }}
                          >
                            {linkCopied ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {checkout.failureReason ? (
                      <p className={styles.errorMsg}>{checkout.failureReason}</p>
                    ) : null}
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button
                    className={styles.btnSecondary}
                    onClick={async () => {
                      try {
                        await checkoutApi.cancel(checkout.sessionId);
                      } catch {
                        /* ignore */
                      }
                      setCheckoutStep(false);
                      setCheckout(null);
                    }}
                  >
                    Cancel checkout
                  </button>
                  <button
                    className={styles.btnSecondary}
                    onClick={async () => {
                      setCheckoutBusy(true);
                      try {
                        const s = await checkoutApi.resend(checkout.sessionId);
                        setCheckout(s);
                        if (
                          s.whatsappUrl &&
                          !s.whatsappSent &&
                          s.whatsappMode === "wa_me"
                        ) {
                          openWhatsAppShare(s.whatsappUrl);
                        }
                      } catch (e: any) {
                        setError(
                          e?.response?.data?.message || "Resend failed",
                        );
                      } finally {
                        setCheckoutBusy(false);
                      }
                    }}
                    disabled={isPending}
                  >
                    Resend link
                  </button>
                  {checkout.whatsappUrl && !checkout.whatsappSent ? (
                    <a
                      className={styles.btnPrimary}
                      href={checkout.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        openWhatsAppShare(checkout.whatsappUrl);
                      }}
                    >
                      Open WhatsApp
                    </a>
                  ) : null}
                  {checkout.whatsappSent ? (
                    <span
                      className={styles.btnPrimary}
                      style={{ opacity: 0.85, pointerEvents: "none" }}
                    >
                      Sent on WhatsApp
                    </span>
                  ) : null}
                </div>
              </>
            ) : (
              <>
            <div className={styles.scrollBody}>
              <div className={styles.sectionLabel}>Personal Info</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      Photo <span style={{ opacity: 0.55 }}>(optional)</span>
                    </label>
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoPreview}
                        alt="Member"
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: "cover",
                          borderRadius: 6,
                          marginBottom: 8,
                          display: "block",
                          border: "1px solid var(--border)",
                        }}
                      />
                    ) : null}
                    <input
                      type="file"
                      accept={UPLOAD_ACCEPT}
                      onChange={onPhotoPick}
                      disabled={isPending}
                    />
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                      Max {uploadLimits.maxFileMb}MB
                    </span>
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Member ID</label>
                    <input
                      className={styles.input}
                      value={isEdit ? existing?.idNo || "—" : idPreview}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Registration Date</label>
                    <input
                      className={styles.input}
                      name="registrationDate"
                      type="date"
                      value={form.registrationDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Name *</label>
                    <input
                      className={styles.input}
                      name="name"
                      placeholder="e.g. Daksh Sharma"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Contact Number *</label>
                    <input
                      className={styles.input}
                      name="phone"
                      placeholder="e.g. 9876543210"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Date of Birth</label>
                    <input
                      className={styles.input}
                      name="dob"
                      type="date"
                      value={form.dob}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Instagram Handle</label>
                    <input
                      className={styles.input}
                      name="instagramHandle"
                      placeholder="@handle"
                      value={form.instagramHandle}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {!isEdit && (
                <>
                  <div className={styles.sectionLabel}>Membership & Payment</div>
                  <div className={styles.fields}>
                    <div className={styles.field}>
                      <label className={styles.label}>Location / Branch *</label>
                      <select
                        className={styles.input}
                        name="locationId"
                        value={form.locationId}
                        onChange={handleChange}
                      >
                        <option value="">Select location</option>
                        {activeLocations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                            {l.isDefault ? " (default)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label className={styles.label}>Membership Plan *</label>
                        <select
                          className={styles.input}
                          name="planId"
                          value={form.planId}
                          onChange={handleChange}
                        >
                          <option value="">— Select plan —</option>
                          {activePlans.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} · {p.duration} {p.durationType.toLowerCase()} · ₹
                              {p.price.toLocaleString("en-IN")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Mode of Payment</label>
                        <select
                          className={styles.input}
                          name="paymentMode"
                          value={form.paymentMode}
                          onChange={handleChange}
                        >
                          <option value="">— Select —</option>
                          <option value="CASH">Cash</option>
                          <option value="UPI">UPI (manual)</option>
                          <option value="ONLINE">
                            {companyAutopayOn
                              ? "Online / UPI Autopay"
                              : "Online / UPI (one-time)"}
                          </option>
                          <option value="CARD">Card</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                        </select>
                      </div>
                    </div>

                    {form.paymentMode === "ONLINE" && companyAutopayOn ? (
                      <div className={styles.field}>
                        <label
                          className={styles.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.enableAutopay}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                enableAutopay: e.target.checked,
                              }))
                            }
                          />
                          Enable UPI Autopay (auto-renew next cycle)
                        </label>
                        <span className={styles.hint}>
                          Member ke WhatsApp (form wala number) pe payment /
                          Autopay link automatic jayega.
                        </span>
                      </div>
                    ) : form.paymentMode === "ONLINE" ? (
                      <div className={styles.field}>
                        <span className={styles.hint}>
                          One-time online payment. Autopay is off for this gym
                          (Settings → UPI Autopay).
                        </span>
                      </div>
                    ) : null}

                    <div className={styles.row3}>
                      <div className={styles.field}>
                        <label className={styles.label}>Total Amount (₹)</label>
                        <input
                          className={styles.input}
                          name="amount"
                          type="number"
                          placeholder="0"
                          value={form.amount}
                          onChange={handleChange}
                        />
                        {form.amount !== "" && taxPercentage > 0 ? (
                          <span className={styles.hint}>
                            {formatAmountWithGstInline(
                              Number(form.amount),
                              taxPercentage,
                              taxMode,
                            )}
                          </span>
                        ) : null}
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Received (₹)</label>
                        <input
                          className={styles.input}
                          name="received"
                          type="number"
                          placeholder="0"
                          value={form.received}
                          onChange={handleChange}
                        />
                        {form.received !== "" &&
                        Number(form.received) > 0 &&
                        taxPercentage > 0 ? (
                          <span className={styles.hint}>
                            {formatAmountWithGstInline(
                              Number(form.received),
                              taxPercentage,
                              taxMode,
                            )}
                          </span>
                        ) : null}
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Pending (₹)</label>
                        <input
                          className={styles.input}
                          name="pending"
                          type="number"
                          value={form.pending}
                          readOnly
                          disabled
                        />
                        {form.pending !== "" &&
                        Number(form.pending) > 0 &&
                        taxPercentage > 0 ? (
                          <span className={styles.hint}>
                            {formatAmountWithGstInline(
                              Number(form.pending),
                              taxPercentage,
                              taxMode,
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label className={styles.label}>
                          Payment screenshot{" "}
                          <span style={{ opacity: 0.55 }}>(optional)</span>
                        </label>
                        {proofPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={proofPreview}
                            alt="Payment proof"
                            style={{
                              width: 72,
                              height: 72,
                              objectFit: "cover",
                              borderRadius: 6,
                              marginBottom: 8,
                              display: "block",
                              border: "1px solid var(--border)",
                            }}
                          />
                        ) : null}
                        <input
                          type="file"
                          accept={UPLOAD_ACCEPT}
                          onChange={onProofPick}
                          disabled={isPending}
                        />
                        <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                          UPI / transfer receipt — max {uploadLimits.maxFileMb}MB.
                          Used when Received &gt; 0.
                        </span>
                      </div>
                    </div>

                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label className={styles.label}>Starting Date</label>
                        <input
                          className={styles.input}
                          name="startingDate"
                          type="date"
                          value={form.startingDate}
                          onChange={handleChange}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Expiry Date</label>
                        <input
                          className={styles.input}
                          name="expiryDate"
                          type="date"
                          value={form.expiryDate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className={styles.sectionLabel}>Training Details</div>
              <div className={styles.fields}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Training Type</label>
                    <select
                      className={styles.input}
                      name="trainingType"
                      value={form.trainingType}
                      onChange={handleChange}
                    >
                      <option value="GT">GT — Group Training</option>
                      <option value="PT">PT — Personal Training</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Trainer</label>
                    <select
                      className={styles.input}
                      name="trainerId"
                      value={form.trainerId}
                      onChange={handleChange}
                    >
                      <option value="">— Select trainer —</option>
                      {(trainers ?? []).map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Sales Person</label>
                    <select
                      className={styles.input}
                      name="salesPersonId"
                      value={form.salesPersonId}
                      onChange={handleChange}
                    >
                      <option value="">— Select sales person —</option>
                      {(salesPeople ?? []).map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Member Status</label>
                    <select
                      className={styles.input}
                      name="memberStatus"
                      value={form.memberStatus}
                      onChange={handleChange}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending
                  ? isEdit
                    ? "Saving…"
                    : form.paymentMode === "ONLINE"
                      ? "Starting checkout…"
                      : "Creating…"
                  : isEdit
                    ? "Save Changes"
                    : form.paymentMode === "ONLINE"
                      ? "Generate QR / Link"
                      : "Add Member"}
              </button>
            </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
