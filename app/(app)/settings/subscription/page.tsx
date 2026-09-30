"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  subscriptionApi,
  type BillingSnapshot,
  type MandateStart,
} from "@/services/subscription/subscription.api";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings } from "@/lib/rbac";
import { formatMoney } from "@/config/countries";
import { useBranding } from "@/lib/context/BrandingContext";
import PaymentQr from "@/components/PaymentQr";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { downloadPaidPlatformInvoice } from "@/lib/downloadPlatformInvoice";
import { EASE_OUT_EXPO } from "@/config/motion";
import styles from "../../profile/Profile.module.css";
import CustomPlanInquiryForm from "./CustomPlanInquiryForm";

const STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  TRIALING: { text: "Free trial", tone: "#1b4fd8" },
  ACTIVE: { text: "Active", tone: "#1b7f43" },
  PAST_DUE: { text: "Payment failed", tone: "#b26a00" },
  READ_ONLY: { text: "Read-only", tone: "#b3261e" },
  CANCELLED: { text: "Cancelled", tone: "#b3261e" },
};

const FEATURE_LABEL: Record<string, string> = {
  AUTOPAY: "UPI Autopay mandates",
  WHATSAPP_CLOUD: "WhatsApp auto-send",
  EMAIL_TEMPLATES: "Custom email templates",
  MULTI_BRANCH: "Unlimited branches",
  STAFF_RBAC: "Staff accounts & permissions",
  ACTIVITY_LOGS: "Activity log (time-retained)",
};

const BASIC_FEATURES = [
  "Members, plans & dues",
  "Cash / UPI / online payments",
  "GST invoices",
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const branding = useBranding();
  const canEdit = canEditGymSettings(user?.role, user?.permissions);
  const queryClient = useQueryClient();

  const [busy, setBusy] = useState(false);
  const [mandate, setMandate] = useState<MandateStart | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [pickPayMode, setPickPayMode] = useState(false);

  const { data: sub, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.mine,
  });
  const { data: plans } = useQuery({
    queryKey: ["subscription", "plans"],
    queryFn: subscriptionApi.plans,
  });
  const { data: invoices } = useQuery({
    queryKey: ["subscription", "invoices"],
    queryFn: subscriptionApi.invoices,
  });

  const money = (amount: number) =>
    formatMoney(amount, branding.country?.code ?? "IN");

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["subscription"] });
    await queryClient.refetchQueries({ queryKey: ["subscription"] });
  };

  const isPaidActive = sub?.status === "ACTIVE";
  const needsBillingSetup =
    !!sub &&
    (!sub.canWrite ||
      sub.status === "TRIALING" ||
      sub.status === "PAST_DUE" ||
      sub.status === "READ_ONLY");

  const formatDate = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleDateString() : "—";

  const choosePlan = async (planCode: string) => {
    if (!canEdit) return;
    if (!sub?.canWrite) {
      toast.error(
        "Set up billing first to restore access — switching plans alone will not unlock the account",
      );
      return;
    }
    setBusy(true);
    try {
      await subscriptionApi.changePlan(planCode);
      refresh();
      toast.success(`Switched to ${planCode}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not change plan");
    } finally {
      setBusy(false);
    }
  };

  const askPayMode = () => {
    if (!canEdit) return;
    setPickPayMode(true);
  };

  const startBilling = async (mode: "one_time" | "autopay") => {
    if (!canEdit) return;
    setPickPayMode(false);
    setBusy(true);
    try {
      const result = await subscriptionApi.startMandate(mode);

      // One-time: Razorpay Checkout modal on this page (Orders API + checkout.js).
      if (
        mode === "one_time" &&
        result.checkout &&
        result.orderId &&
        result.keyId &&
        result.amountPaise
      ) {
        setMandate(null);
        try {
          const paid = await openRazorpayCheckout({
            keyId: result.keyId,
            orderId: result.orderId,
            amountPaise: result.amountPaise,
            currency: result.currency || "INR",
            name: "GymFlow",
            description: result.description,
            prefill: result.prefill,
            notes: {
              chargeId: result.chargeId || "",
              planCode: result.planCode,
            },
          });
          await subscriptionApi.verifyCheckout({
            orderId: paid.razorpay_order_id,
            paymentId: paid.razorpay_payment_id,
            signature: paid.razorpay_signature,
            chargeId: result.chargeId,
          });
          await refresh();
          toast.success("Payment received — your plan is active");
        } catch (payErr: any) {
          if (payErr?.message === "Payment cancelled") {
            toast("Payment cancelled");
          } else {
            toast.error(
              payErr?.response?.data?.message ||
                payErr?.message ||
                "Payment failed",
            );
          }
        }
        return;
      }

      // Autopay still uses Razorpay’s hosted mandate / auth link.
      setMandate(result);
      if (result.shareUrl) {
        window.open(result.shareUrl, "_blank", "noopener,noreferrer");
      }
      toast.success(
        mode === "autopay"
          ? "Autopay page opened — approve the mandate"
          : "Payment page opened — pay this period",
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not start billing");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!canEdit) return;
    setBusy(true);
    try {
      await subscriptionApi.cancel();
      refresh();
      toast.success("Subscription cancelled — your data stays readable");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not cancel");
    } finally {
      setBusy(false);
    }
  };

  const resume = async () => {
    setBusy(true);
    try {
      await subscriptionApi.resume();
      refresh();
      toast.success("Subscription resumed");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not resume");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !sub) {
    return <p style={{ color: "var(--text-2)" }}>Loading subscription…</p>;
  }

  const status = STATUS_LABEL[sub.status] ?? {
    text: sub.status,
    tone: "var(--text-2)",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
    >
      {/* ── Where this gym stands ── */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            Subscription
          </h2>
          <span className={styles.cardBadge} style={{ color: status.tone }}>
            {status.text}
          </span>
        </div>

        <div className={styles.formGrid}>
          <div>
            <label className={styles.formLabel}>Plan</label>
            <p style={{ color: "var(--text-1)", margin: 0 }}>
              {sub.planName} · {money(sub.pricePerBranch)} per branch /{" "}
              {sub.interval === "YEARLY" ? "year" : "month"}
            </p>
          </div>
          <div>
            <label className={styles.formLabel}>Branches</label>
            <p style={{ color: "var(--text-1)", margin: 0 }}>
              {sub.branches}
              {sub.maxBranches ? ` of ${sub.maxBranches} included` : ""}
            </p>
          </div>
          <div>
            <label className={styles.formLabel}>
              {sub.status === "TRIALING"
                ? "Trial ends"
                : sub.status === "ACTIVE"
                  ? "Active until"
                  : "Next renewal"}
            </label>
            <p style={{ color: "var(--text-1)", margin: 0 }}>
              {sub.status === "TRIALING"
                ? sub.trialEndsAt
                  ? `${formatDate(sub.trialEndsAt)} · ${sub.trialDaysLeft} day${sub.trialDaysLeft === 1 ? "" : "s"} left`
                  : "—"
                : formatDate(sub.currentPeriodEnd)}
            </p>
          </div>
          <div>
            <label className={styles.formLabel}>
              {sub.status === "ACTIVE" ? "Next charge" : "Amount due"}
            </label>
            <p style={{ color: "var(--text-1)", margin: 0 }}>
              {money(sub.nextAmount)}{" "}
              <span style={{ color: "var(--text-2)", fontSize: "0.85rem" }}>
                + GST
              </span>
            </p>
          </div>
          <div>
            <label className={styles.formLabel}>Billing</label>
            <p style={{ color: "var(--text-1)", margin: 0 }}>
              {sub.mandateApproved || sub.billingMode === "AUTOPAY"
                ? "Autopay on"
                : sub.status === "ACTIVE" || sub.billingMode === "ONE_TIME"
                  ? "One-time (pay each period)"
                  : "Not set up yet"}
            </p>
          </div>
          {sub.status === "ACTIVE" && sub.lastAmount != null ? (
            <div>
              <label className={styles.formLabel}>Last payment</label>
              <p style={{ color: "var(--text-1)", margin: 0 }}>
                {money(sub.lastAmount)}
                {sub.lastChargeAt
                  ? ` · ${formatDate(sub.lastChargeAt)}`
                  : ""}
              </p>
            </div>
          ) : null}

          {sub.lastFailureReason ? (
            <p style={{ gridColumn: "1 / -1", color: "#b26a00", margin: 0 }}>
              Last attempt failed: {sub.lastFailureReason}
            </p>
          ) : null}

          {!sub.canWrite ? (
            <p style={{ gridColumn: "1 / -1", color: "#b3261e", margin: 0 }}>
              This account is read-only. Your data is safe and still readable.
              Set up billing (or resume if you already have a mandate) to add
              members and take payments again — switching plans alone will not
              restore access.
            </p>
          ) : null}

          {isPaidActive ? (
            <p
              style={{
                gridColumn: "1 / -1",
                margin: 0,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#eef8f1",
                color: "#1b7f43",
                border: "1px solid #b7e0c2",
                fontSize: "0.92rem",
              }}
            >
              <strong>{sub.planName}</strong> is active
              {sub.currentPeriodEnd
                ? ` through ${formatDate(sub.currentPeriodEnd)}`
                : ""}
              . You can keep using the CRM; renew or switch plans anytime.
            </p>
          ) : null}
        </div>

        {/* Billing actions */}
        {canEdit ? (
          <div className={styles.formActions} style={{ padding: "0 22px 22px", gap: 10 }}>
            {!sub.canWrite ? (
              sub.mandateApproved ? (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={busy}
                  onClick={resume}
                >
                  Resume subscription
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={busy}
                  onClick={askPayMode}
                >
                  Set up billing
                </button>
              )
            ) : needsBillingSetup ? (
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={busy}
                onClick={askPayMode}
              >
                {sub.status === "TRIALING" ? "Pay for this period" : "Set up billing"}
              </button>
            ) : (
              <>
                {!sub.mandateApproved ? (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={busy}
                    onClick={() => startBilling("autopay")}
                  >
                    Enable Autopay
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={busy}
                  onClick={askPayMode}
                >
                  Pay next period
                </button>
                {/* Cancel only for Autopay — one-time is already paid for the period. */}
                {sub.mandateApproved || sub.billingMode === "AUTOPAY" ? (
                  sub.cancelledAt ? (
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      disabled={busy}
                      onClick={resume}
                    >
                      Resume subscription
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      disabled={busy}
                      onClick={cancel}
                    >
                      Cancel subscription
                    </button>
                  )
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {pickPayMode ? (
          <div
            style={{
              padding: "0 22px 22px",
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <p
              style={{
                gridColumn: "1 / -1",
                margin: 0,
                color: "var(--text-2)",
                fontSize: "0.95rem",
              }}
            >
              How do you want to pay for this period?
            </p>
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={busy}
              onClick={() => startBilling("one_time")}
              style={{ width: "100%", minHeight: 72 }}
            >
              One-time pay
              <span
                style={{
                  display: "block",
                  fontWeight: 400,
                  fontSize: "0.8rem",
                  opacity: 0.9,
                  marginTop: 4,
                }}
              >
                Pay this cycle once (UPI / card)
              </span>
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              disabled={busy}
              onClick={() => startBilling("autopay")}
              style={{ width: "100%", minHeight: 72 }}
            >
              Autopay (UPI mandate)
              <span
                style={{
                  display: "block",
                  fontWeight: 400,
                  fontSize: "0.8rem",
                  opacity: 0.85,
                  marginTop: 4,
                }}
              >
                Auto-debit every period after you approve
              </span>
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              disabled={busy}
              onClick={() => setPickPayMode(false)}
              style={{ gridColumn: "1 / -1", width: "fit-content" }}
            >
              Cancel
            </button>
          </div>
        ) : null}

        {mandate?.shareUrl ? (
          <div style={{ padding: "0 22px 22px" }}>
            <p style={{ color: "var(--text-1)" }}>
              {mandate.mode === "autopay"
                ? "Approve the UPI Autopay mandate. "
                : "Complete payment on the Razorpay page (also opened in a new tab). "}
              {money(mandate.amount)} will be collected now for{" "}
              {mandate.branches} branch{mandate.branches === 1 ? "" : "es"}.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <a
                href={mandate.shareUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.btnPrimary}
                style={{ textDecoration: "none" }}
              >
                Open payment page
              </a>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {mandate.qrData ? (
                <div
                  style={{
                    padding: 6,
                    background: "#fff",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <PaymentQr value={mandate.qrData} size={180} />
                </div>
              ) : null}
              <div style={{ flex: "1 1 260px" }}>
                <label className={styles.formLabel}>Payment link</label>
                <input
                  className={styles.formInput}
                  readOnly
                  value={mandate.shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    navigator.clipboard
                      .writeText(mandate.shareUrl || "")
                      .then(() => toast.success("Link copied"))
                      .catch(() => toast.error("Copy failed"));
                  }}
                >
                  Copy link
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* ── Plans ── */}
      <section className={styles.card} style={{ marginTop: 20 }}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            Plans
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            padding: "12px 22px 22px",
          }}
        >
          {(plans ?? []).map((plan) => {
            const current = plan.code === sub.planCode;
            return (
              <div
                key={plan.code}
                style={{
                  border: `1px solid ${current ? "var(--brand, #1b4fd8)" : "var(--border)"}`,
                  borderRadius: 10,
                  padding: 16,
                  position: "relative",
                }}
              >
                {plan.isRecommended ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 12,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#1b4fd8",
                      color: "#fff",
                    }}
                  >
                    POPULAR
                  </span>
                ) : null}
                <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem" }}>
                  {plan.name}
                </h3>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                  }}
                >
                  {plan.isContactSales ? (
                    "Custom"
                  ) : (
                    <>
                      {money(plan.pricePerBranch)}
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 400,
                          color: "var(--text-2)",
                        }}
                      >
                        {" "}
                        / branch / month
                      </span>
                    </>
                  )}
                </p>
                {plan.description ? (
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: "0.85rem",
                      color: "var(--text-2)",
                    }}
                  >
                    {plan.description}
                  </p>
                ) : null}
                <ul
                  style={{
                    margin: "0 0 14px",
                    paddingLeft: 18,
                    fontSize: "0.85rem",
                    color: "var(--text-2)",
                  }}
                >
                  {BASIC_FEATURES.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                  {plan.features.map((f) => (
                    <li key={f}>{FEATURE_LABEL[f] ?? f}</li>
                  ))}
                  <li>
                    {plan.maxBranches
                      ? `Up to ${plan.maxBranches} branch${plan.maxBranches === 1 ? "" : "es"}`
                      : "Branches by agreement"}
                  </li>
                </ul>
                {plan.isContactSales ? (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={!canEdit}
                    onClick={() => setShowCustomForm(true)}
                    style={{ width: "100%" }}
                  >
                    Talk to us
                  </button>
                ) : current && isPaidActive ? (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled
                    style={{ width: "100%" }}
                  >
                    Current plan
                    {sub.currentPeriodEnd
                      ? ` · until ${formatDate(sub.currentPeriodEnd)}`
                      : ""}
                  </button>
                ) : current && needsBillingSetup ? (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={busy || !canEdit}
                    onClick={askPayMode}
                    style={{ width: "100%" }}
                  >
                    Pay for {plan.name}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={current ? styles.btnSecondary : styles.btnPrimary}
                    disabled={busy || current || !canEdit || !sub.canWrite}
                    onClick={() => choosePlan(plan.code)}
                    style={{ width: "100%" }}
                  >
                    {current
                      ? "Current plan"
                      : !sub.canWrite
                        ? "Set up billing first"
                        : `Switch to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {showCustomForm ? (
          <div
            style={{
              padding: "0 22px 22px",
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "1rem" }}>
              Custom plan request
            </h3>
            <CustomPlanInquiryForm canEdit={canEdit} />
          </div>
        ) : null}
      </section>

      {/* ── Billing history ── */}
      <section className={styles.card} style={{ marginTop: 20 }}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            Billing history
          </h2>
        </div>
        <div style={{ padding: "12px 22px 22px" }}>
          {!invoices?.length ? (
            <p style={{ color: "var(--text-2)", margin: 0 }}>
              No charges yet.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-2)" }}>
                  <th style={{ padding: "6px 0", fontSize: "0.75rem" }}>
                    Invoice
                  </th>
                  <th style={{ fontSize: "0.75rem" }}>Period</th>
                  <th style={{ fontSize: "0.75rem" }}>Payment</th>
                  <th style={{ fontSize: "0.75rem" }}>Status</th>
                  <th style={{ fontSize: "0.75rem", textAlign: "right" }}>
                    Amount
                  </th>
                  <th style={{ fontSize: "0.75rem", textAlign: "right" }}>
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td
                      style={{
                        padding: "8px 0",
                        fontFamily: "var(--mono)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {new Date(inv.periodStart).toLocaleDateString()} –{" "}
                      {new Date(inv.periodEnd).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>
                      {inv.razorpayPaymentId ? (
                        <>
                          <div
                            style={{
                              fontFamily: "var(--mono)",
                              color: "var(--text-1)",
                            }}
                            title={inv.razorpayOrderId || undefined}
                          >
                            {inv.razorpayPaymentId}
                          </div>
                          <div>
                            {[inv.paymentMethod, inv.paymentInstrument, inv.payMode]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {inv.status}
                      {inv.failureReason ? ` · ${inv.failureReason}` : ""}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      {money(inv.totalAmount)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {inv.status === "PAID" ? (
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                          onClick={() => {
                            try {
                              downloadPaidPlatformInvoice(inv, {
                                name: branding.gymName || sub.planName || "Gym",
                              });
                              toast.success("Invoice downloaded");
                            } catch {
                              toast.error("Could not download invoice");
                            }
                          }}
                        >
                          Download
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-2)", fontSize: "0.8rem" }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </motion.div>
  );
}
