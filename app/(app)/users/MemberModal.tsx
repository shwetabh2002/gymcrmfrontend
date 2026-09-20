"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreateMember,
  useUpdateMember,
  useUploadMemberPhoto,
} from "@/services/members/members.hook";
import {
  Member,
  CreateMemberPayload,
  PaymentMode,
} from "@/services/members/members.api";
import { useUploadPaymentProof } from "@/services/payments/payments.hooks";
import { checkoutApi, CheckoutSession } from "@/services/payments/provider.api";
import { usePlans, useCreatePlan } from "@/services/plans/plans.hook";
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
import { EASE_OUT_EXPO } from "@/config/motion";
import PaymentQr from "@/components/PaymentQr";
import {
  COLLECTION_MODE_OPTIONS,
  CollectionMode,
  ledgerModeFor,
} from "@/config/collection-modes";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Member | null;
}

type FormState = {
  name: string;
  phone: string;
  countryCode: string;
  email: string;
  registrationDate: string;
  dob: string;
  instagramHandle: string;
  planId: string;
  paymentMode: CollectionMode | "";
  amount: number | "";
  received: number | "";
  pending: number | "";
  dueReminderDate: string;
  startingDate: string;
  expiryDate: string;
  trainingType: "GT" | "PT" | "NONE" | "OTHER";
  trainerId: string;
  salesPersonId: string;
  memberStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  locationId: string;
  /** Both default on; staff may untick either. */
  sendWhatsApp: boolean;
  sendEmail: boolean;
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
  countryCode: "+91",
  email: "",
  registrationDate: today(),
  dob: "",
  instagramHandle: "",
  planId: "",
  paymentMode: "",
  amount: "",
  received: "",
  pending: "",
  dueReminderDate: "",
  startingDate: today(),
  expiryDate: "",
  trainingType: "GT",
  trainerId: "",
  salesPersonId: "",
  memberStatus: "ACTIVE",
  locationId: "",
  sendWhatsApp: false,
  sendEmail: true,
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
  const createPlan = useCreatePlan();
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    duration: 1,
    durationType: "MONTHS" as "DAYS" | "MONTHS" | "YEARS",
    price: "",
  });
  const { data: trainers } = useEmployees({
    type: "TRAINER",
    status: "ACTIVE",
  });
  const { data: salesPeople } = useEmployees({
    type: "SALES",
    status: "ACTIVE",
  });
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
        phone: (() => {
          const raw = String(
            existing.contactNumber || existing.phone || "",
          ).replace(/\D/g, "");
          const dial = String(existing.countryCode || "+91").replace(/\D/g, "");
          if (dial && raw.startsWith(dial) && raw.length === dial.length + 10) {
            return raw.slice(dial.length);
          }
          if (raw.length > 10) return raw.slice(-10);
          return raw;
        })(),
        countryCode: existing.countryCode || "+91",
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
        dueReminderDate: existing.dueReminderDate
          ? String(existing.dueReminderDate).slice(0, 10)
          : "",
        startingDate: existing.startingDate
          ? String(existing.startingDate).slice(0, 10)
          : today(),
        expiryDate: existing.expiryDate
          ? String(existing.expiryDate).slice(0, 10)
          : "",
        trainingType:
          (existing.trainingType as FormState["trainingType"]) || "GT",
        trainerId: existing.trainerId ?? "",
        salesPersonId: existing.salesPersonId ?? "",
        memberStatus:
          existing.memberStatus === "EXPIRED"
            ? "INACTIVE"
            : (existing.memberStatus as FormState["memberStatus"]) || "ACTIVE",
        locationId: existing.locationId ?? "",
        email: existing.email ?? "",
        sendWhatsApp: false,
        sendEmail: true,
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
    if (!plan && !planId) {
      setForm((prev) => ({ ...prev, planId: "" }));
      return;
    }
    if (!plan) {
      setForm((prev) => ({ ...prev, planId }));
      return;
    }
    const start = startingDate ?? (form.startingDate || today());
    setForm((prev) => {
      const amount: number | "" =
        typeof plan?.price === "number" ? plan.price : prev.amount;
      const received = prev.received === "" ? 0 : Number(prev.received);
      const pending =
        amount === ""
          ? prev.pending
          : Math.max(Number(amount) - received, 0);
      return {
        ...prev,
        planId,
        startingDate: start,
        expiryDate: computeExpiry(start, plan),
        amount,
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

    if (name === "trainingType") {
      setForm((prev) => ({
        ...prev,
        trainingType: value as FormState["trainingType"],
        trainerId: value === "NONE" ? "" : prev.trainerId,
      }));
      return;
    }

    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, phone: digits }));
      return;
    }

    if (name === "countryCode") {
      let code = value.trim();
      if (code && !code.startsWith("+")) code = `+${code.replace(/\D/g, "")}`;
      else code = `+${code.slice(1).replace(/\D/g, "").slice(0, 4)}`;
      setForm((prev) => ({ ...prev, countryCode: code || "+91" }));
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
        return {
          ...prev,
          [name]: num,
          pending,
          dueReminderDate:
            typeof pending === "number" && pending <= 0
              ? ""
              : prev.dueReminderDate,
        };
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
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError("Contact number must be exactly 10 digits.");
      return;
    }
    const countryCode = form.countryCode?.trim() || "+91";
    if (!/^\+\d{1,4}$/.test(countryCode)) {
      setError("Country code must look like +91.");
      return;
    }
    if (
      !isEdit &&
      form.pending !== "" &&
      Number(form.pending) > 0 &&
      !form.dueReminderDate
    ) {
      setError(
        "Due reminder date is required when there is a pending balance.",
      );
      return;
    }

    try {
      if (isEdit && existing) {
        await updateMember({
          id: existing._id,
          payload: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            countryCode,
            registrationDate: form.registrationDate || undefined,
            dob: form.dob || undefined,
            instagramHandle: form.instagramHandle || undefined,
            trainingType: form.trainingType,
            trainerId:
              form.trainingType === "NONE"
                ? undefined
                : form.trainerId || undefined,
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

      // Autopay → mandate registration (link + QR + poll). Cash/Online are
      // manual-fill and fall through to the normal member create below.
      if (form.paymentMode === "AUTOPAY") {
        const received =
          form.received === ""
            ? Number(form.amount) || 0
            : Number(form.received);
        if (!(received > 0)) {
          setError(
            "Received amount must be greater than 0 for online checkout.",
          );
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
            trainerId:
              form.trainingType === "NONE"
                ? undefined
                : form.trainerId || undefined,
            salesPersonId: form.salesPersonId || undefined,
            email: form.email.trim() || undefined,
            enableAutopay: true,
            sendWhatsApp: false,
            sendEmail: form.sendEmail && !!form.email.trim(),
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
        countryCode,
        registrationDate: form.registrationDate || undefined,
        dob: form.dob || undefined,
        instagramHandle: form.instagramHandle || undefined,
        trainingType: form.trainingType,
        trainerId:
          form.trainingType === "NONE" ? undefined : form.trainerId || undefined,
        salesPersonId: form.salesPersonId || undefined,
        memberStatus: form.memberStatus,
        planId: form.planId,
        startingDate: form.startingDate || undefined,
        expiryDate: form.expiryDate || undefined,
        amount: form.amount === "" ? undefined : Number(form.amount),
        received: form.received === "" ? 0 : Number(form.received),
        dueReminderDate:
          form.pending !== "" &&
          Number(form.pending) > 0 &&
          form.dueReminderDate
            ? form.dueReminderDate
            : undefined,
        paymentMode: ledgerModeFor(
          (form.paymentMode || "CASH") as CollectionMode,
        ) as PaymentMode,
        sendWhatsApp: form.sendWhatsApp,
        sendEmail: form.sendEmail && !!form.email.trim(),
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
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
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
                      {checkout.enableAutopay
                        ? "Member ko QR scan karwao — UPI app mein pay + Autopay mandate approve. WhatsApp send coming soon."
                        : checkout.whatsappSent
                          ? `Payment link AUTO-SENT to WhatsApp ${
                              checkout.whatsappToPhone
                                ? checkout.whatsappToPhone.startsWith("91") &&
                                  checkout.whatsappToPhone.length === 12
                                  ? `+91 ${checkout.whatsappToPhone.slice(2)}`
                                  : `+${checkout.whatsappToPhone}`
                                : "member number"
                            }. Member pay kare — status yahan update hoga.`
                          : "Show the QR or share the link below. WhatsApp send is coming soon."}
                    </p>
                    {checkout.qrData ? (
                      <div style={{ textAlign: "center", margin: "16px 0" }}>
                        <div
                          style={{
                            display: "inline-block",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "#fff",
                            padding: 8,
                          }}
                        >
                          <PaymentQr value={checkout.qrData} size={220} />
                        </div>
                        <p
                          className={styles.hint}
                          style={{ marginTop: 10, fontWeight: 600 }}
                        >
                          {checkout.enableAutopay
                            ? "Scan to pay & set up UPI Autopay"
                            : "Scan with UPI app to pay"}
                        </p>
                      </div>
                    ) : (
                      <p className={styles.hint} style={{ marginBottom: 12 }}>
                        QR not available yet — use the payment link below.
                      </p>
                    )}
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
                      <p className={styles.errorMsg}>
                        {checkout.failureReason}
                      </p>
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
                      } catch (e: any) {
                        setError(e?.response?.data?.message || "Resend failed");
                      } finally {
                        setCheckoutBusy(false);
                      }
                    }}
                    disabled={isPending}
                  >
                    Refresh link / QR
                  </button>
                  {checkout.shareUrl ? (
                    <a
                      className={styles.btnPrimary}
                      href={checkout.shareUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open payment page
                    </a>
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
                          Photo{" "}
                          <span style={{ opacity: 0.55 }}>(optional)</span>
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
                        <label className={styles.label}>
                          Registration Date
                        </label>
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
                        <div className={styles.phoneRow}>
                          <input
                            className={`${styles.input} ${styles.countryCode}`}
                            name="countryCode"
                            inputMode="tel"
                            placeholder="+91"
                            value={form.countryCode}
                            onChange={handleChange}
                            title="Country code"
                          />
                          <input
                            className={styles.input}
                            name="phone"
                            inputMode="numeric"
                            placeholder="9876543210"
                            value={form.phone}
                            onChange={handleChange}
                            maxLength={10}
                          />
                        </div>
                        <span className={styles.hint}>
                          10-digit number only — country code saved separately
                          (default +91).
                        </span>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Email</label>
                        <input
                          className={styles.input}
                          name="email"
                          type="email"
                          placeholder="member@example.com"
                          value={form.email}
                          onChange={handleChange}
                        />
                        <span className={styles.hint}>
                          Optional — needed to email the welcome / payment link.
                        </span>
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
                      <div className={styles.sectionLabel}>
                        Membership & Payment
                      </div>
                      <div className={styles.fields}>
                        <div className={styles.field}>
                          <label className={styles.label}>
                            Location / Branch *
                          </label>
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
                            <label className={styles.label}>
                              Membership Plan *
                            </label>
                            <select
                              className={styles.input}
                              name="planId"
                              value={form.planId}
                              onChange={handleChange}
                            >
                              <option value="">— Select plan —</option>
                              {activePlans.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} · {p.duration}{" "}
                                  {p.durationType.toLowerCase()} · ₹
                                  {p.price.toLocaleString("en-IN")}
                                </option>
                              ))}
                            </select>
                            {activePlans.length === 0 || showPlanForm ? (
                              <div
                                style={{
                                  marginTop: 10,
                                  padding: 12,
                                  border: "1px solid var(--border)",
                                  borderRadius: 6,
                                  background: "var(--surface-2)",
                                }}
                              >
                                <p
                                  className={styles.hint}
                                  style={{ marginBottom: 8, fontWeight: 600 }}
                                >
                                  {activePlans.length === 0
                                    ? "No plans yet — add one here to continue"
                                    : "New plan"}
                                </p>
                                <div
                                  style={{
                                    display: "grid",
                                    gap: 8,
                                    gridTemplateColumns: "1fr 1fr",
                                  }}
                                >
                                  <input
                                    className={styles.input}
                                    placeholder="Plan name"
                                    value={newPlan.name}
                                    onChange={(e) =>
                                      setNewPlan((p) => ({
                                        ...p,
                                        name: e.target.value,
                                      }))
                                    }
                                    style={{ gridColumn: "1 / -1" }}
                                  />
                                  <input
                                    className={styles.input}
                                    type="number"
                                    min={1}
                                    placeholder="Duration"
                                    value={newPlan.duration}
                                    onChange={(e) =>
                                      setNewPlan((p) => ({
                                        ...p,
                                        duration: Number(e.target.value) || 1,
                                      }))
                                    }
                                  />
                                  <select
                                    className={styles.input}
                                    value={newPlan.durationType}
                                    onChange={(e) =>
                                      setNewPlan((p) => ({
                                        ...p,
                                        durationType: e.target
                                          .value as typeof newPlan.durationType,
                                      }))
                                    }
                                  >
                                    <option value="DAYS">Days</option>
                                    <option value="MONTHS">Months</option>
                                    <option value="YEARS">Years</option>
                                  </select>
                                  <input
                                    className={styles.input}
                                    type="number"
                                    min={0}
                                    placeholder="Price ₹"
                                    value={newPlan.price}
                                    onChange={(e) =>
                                      setNewPlan((p) => ({
                                        ...p,
                                        price: e.target.value,
                                      }))
                                    }
                                    style={{ gridColumn: "1 / -1" }}
                                  />
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginTop: 10,
                                  }}
                                >
                                  <button
                                    type="button"
                                    className={styles.btnPrimary}
                                    disabled={createPlan.isPending}
                                    onClick={async () => {
                                      if (!newPlan.name.trim()) {
                                        setError("Plan name is required");
                                        return;
                                      }
                                      const price = Number(newPlan.price);
                                      if (!Number.isFinite(price) || price < 0) {
                                        setError("Enter a valid plan price");
                                        return;
                                      }
                                      try {
                                        setError("");
                                        const created =
                                          await createPlan.mutateAsync({
                                            name: newPlan.name.trim(),
                                            duration: newPlan.duration,
                                            durationType: newPlan.durationType,
                                            price,
                                          });
                                        setShowPlanForm(false);
                                        setNewPlan({
                                          name: "",
                                          duration: 1,
                                          durationType: "MONTHS",
                                          price: "",
                                        });
                                        // Select after list refreshes
                                        setTimeout(() => {
                                          applyPlan(created._id);
                                        }, 50);
                                        setForm((prev) => ({
                                          ...prev,
                                          planId: created._id,
                                          amount: created.price,
                                          pending: Math.max(
                                            created.price -
                                              (prev.received === ""
                                                ? 0
                                                : Number(prev.received)),
                                            0,
                                          ),
                                          expiryDate: computeExpiry(
                                            prev.startingDate || today(),
                                            created,
                                          ),
                                        }));
                                      } catch (err: any) {
                                        setError(
                                          err?.response?.data?.message ||
                                            "Could not create plan",
                                        );
                                      }
                                    }}
                                  >
                                    {createPlan.isPending
                                      ? "Saving…"
                                      : "Save plan & use"}
                                  </button>
                                  {activePlans.length > 0 ? (
                                    <button
                                      type="button"
                                      className={styles.btnSecondary}
                                      onClick={() => setShowPlanForm(false)}
                                    >
                                      Cancel
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className={styles.btnSecondary}
                                style={{ marginTop: 8 }}
                                onClick={() => setShowPlanForm(true)}
                              >
                                + Add plan
                              </button>
                            )}
                          </div>
                          <div className={styles.field}>
                            <label className={styles.label}>
                              Mode of Payment
                            </label>
                            <select
                              className={styles.input}
                              name="paymentMode"
                              value={form.paymentMode}
                              onChange={handleChange}
                            >
                              <option value="">— Select —</option>
                              {COLLECTION_MODE_OPTIONS.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  disabled={
                                    opt.value === "AUTOPAY" && !companyAutopayOn
                                  }
                                >
                                  {opt.value === "AUTOPAY" && !companyAutopayOn
                                    ? `${opt.label} — turn on in Payment settings`
                                    : opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Email notify — WhatsApp is coming soon. */}
                        <div className={styles.field}>
                          <label className={styles.label}>Notify member</label>
                          <div
                            style={{
                              display: "flex",
                              gap: 18,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                opacity: 0.55,
                                cursor: "not-allowed",
                              }}
                              title="Coming soon"
                            >
                              <input type="checkbox" checked={false} disabled />
                              WhatsApp{" "}
                              <span style={{ fontSize: 11, opacity: 0.8 }}>
                                (coming soon)
                              </span>
                            </label>
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                cursor: form.email ? "pointer" : "not-allowed",
                                opacity: form.email ? 1 : 0.55,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={form.sendEmail && !!form.email}
                                disabled={!form.email}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    sendEmail: e.target.checked,
                                  }))
                                }
                              />
                              Email
                            </label>
                          </div>
                          <span className={styles.hint}>
                            {form.paymentMode === "AUTOPAY"
                              ? "Save ke baad QR dikhega — member scan karke UPI Autopay approve kare. WhatsApp later."
                              : "Welcome / receipt email optional."}
                            {!form.email
                              ? " Email ke liye member ka email bharo."
                              : ""}
                          </span>
                        </div>

                        {form.paymentMode === "AUTOPAY" && !companyAutopayOn ? (
                          <div className={styles.field}>
                            <span className={styles.hint}>
                              Autopay is off for this gym — turn it on in
                              Payment settings → UPI Autopay.
                            </span>
                          </div>
                        ) : null}

                        <div className={styles.row3}>
                          <div className={styles.field}>
                            <label className={styles.label}>
                              Total Amount (₹)
                            </label>
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

                        {form.pending !== "" && Number(form.pending) > 0 ? (
                          <div
                            className={styles.field}
                            style={{
                              marginTop: 4,
                              padding: "12px 14px",
                              border: "1px solid rgba(230,57,70,0.35)",
                              borderRadius: 8,
                              background: "rgba(230,57,70,0.06)",
                            }}
                          >
                            <label className={styles.label}>
                              Due reminder date *
                            </label>
                            <input
                              className={styles.input}
                              name="dueReminderDate"
                              type="date"
                              value={form.dueReminderDate}
                              onChange={handleChange}
                              min={today()}
                              required
                            />
                            <span className={styles.hint}>
                              Required when balance is pending — date they
                              promised to pay. Used on Partial dues (nearest
                              first).
                            </span>
                          </div>
                        ) : null}

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
                            <span
                              style={{ fontSize: 10, color: "var(--text-3)" }}
                            >
                              UPI / transfer receipt — max{" "}
                              {uploadLimits.maxFileMb}MB. Used when Received
                              &gt; 0.
                            </span>
                          </div>
                        </div>

                        <div className={styles.row}>
                          <div className={styles.field}>
                            <label className={styles.label}>
                              Starting Date
                            </label>
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
                          <option value="NONE">No Trainer</option>
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
                          disabled={form.trainingType === "NONE"}
                        >
                          <option value="">
                            {form.trainingType === "NONE"
                              ? "— No trainer —"
                              : "— Select trainer —"}
                          </option>
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
