"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings } from "@/lib/rbac";
import {
  useGymSettings,
  useUpdateGymSettings,
} from "@/services/gym-settings/gym-settings.hooks";
import {
  paymentProviderApi,
  ProviderStatus,
} from "@/services/payments/provider.api";
import profile from "../profile/Profile.module.css";
import styles from "./AutopaySettings.module.css";
import ComingSoonCard from "./ComingSoonCard";

type Step = {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  /** live = show Done/Pending from status; howto = how-to step */
  kind: "live" | "howto";
};

export default function AutopaySettings() {
  const { user } = useAuth();
  const canEdit = canEditGymSettings(user?.role, user?.permissions);
  const { data: settings, isLoading } = useGymSettings(!!user?.companyId);
  const update = useUpdateGymSettings();
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [rzp, setRzp] = useState<ProviderStatus | null>(null);
  const [depsLoading, setDepsLoading] = useState(true);
  const [mandateMultiplier, setMandateMultiplier] = useState(2);
  const [mandateMonths, setMandateMonths] = useState(60);

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.autopayEnabled === true);
    setMandateMultiplier(settings.autopayMandateMultiplier ?? 2);
    setMandateMonths(settings.autopayMandateValidityMonths ?? 60);
  }, [settings]);

  const loadDeps = async () => {
    setDepsLoading(true);
    try {
      const p = await paymentProviderApi.getStatus().catch(() => null);
      setRzp(p);
    } finally {
      setDepsLoading(false);
    }
  };

  useEffect(() => {
    loadDeps();
  }, []);

  const save = async (next: boolean) => {
    if (!canEdit) return;
    setError("");
    setSavedMsg("");
    setEnabled(next);
    try {
      await update.mutateAsync({ autopayEnabled: next });
      setSavedMsg(
        next
          ? "Autopay turned ON — finish the checklist below for this gym."
          : "Autopay turned OFF — cash / UPI / one-time online work as usual.",
      );
      setTimeout(() => setSavedMsg(""), 4000);
      if (next) await loadDeps();
    } catch (e: any) {
      setEnabled(!next);
      setError(e?.response?.data?.message || "Failed to update");
    }
  };

  /** Applies to mandates created from now on; existing ones keep their terms. */
  const saveMandateTerms = async (patch: {
    autopayMandateMultiplier?: number;
    autopayMandateValidityMonths?: number;
  }) => {
    if (!canEdit) return;
    setError("");
    try {
      // UPI Autopay only — e-Mandate / card / NACH are not offered.
      await update.mutateAsync({ ...patch, autopayMethod: "upi" });
      setSavedMsg("Mandate terms saved — applies to new mandates for this gym.");
      setTimeout(() => setSavedMsg(""), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save mandate terms");
    }
  };

  const steps: Step[] = [
    {
      id: "flag",
      title: "Turn Autopay ON for this gym",
      detail:
        "Use the switch above. Default is OFF. Only this gym is affected.",
      done: enabled,
      kind: "live",
    },
    {
      id: "rzp",
      title: "Connect Razorpay",
      detail:
        "Scroll to Payments — Razorpay on this page. Connect OAuth / API keys (or Mock for local).",
      done: !!rzp?.connected,
      kind: "live",
    },
    {
      id: "member",
      title: "Add member on Autopay",
      detail:
        "Members → Add → Mode of Payment = UPI Autopay (mandate) → save. Cash and Online stay manual-fill.",
      done: false,
      kind: "howto",
    },
    {
      id: "pay",
      title: "Member scans QR & approves UPI Autopay",
      detail:
        "Show the QR on screen (or share the link). Member scans with their UPI app, pays, and approves the mandate. WhatsApp send is coming soon.",
      done: false,
      kind: "howto",
    },
    {
      id: "renew",
      title: "Renewals charge automatically",
      detail:
        "When due, Autopay worker charges the mandate. Failures go to Expiry Follow-ups.",
      done: false,
      kind: "howto",
    },
  ];

  const infraReady = enabled && !!rzp?.connected;
  const busy = !canEdit || update.isPending;
  const unlocked = settings?.featureAutopayUnlocked === true;

  if (!isLoading && !unlocked) {
    return (
      <ComingSoonCard
        title="UPI Autopay"
        description="Autopay is locked for this gym. Platform admin can unlock it per gym when you are ready to go live with recurring UPI mandates."
      />
    );
  }

  return (
    <section className={`${profile.card} ${styles.wrap}`}>
      <div className={profile.cardHeader}>
        <h2 className={profile.cardTitle}>
          <span className={profile.cardTitleBar} />
          UPI Autopay
        </h2>
        <span className={enabled ? styles.badgeOn : styles.badgeOff}>
          {enabled ? "On" : "Off"}
        </span>
      </div>

      {isLoading ? (
        <div className={styles.body}>
          <p className={styles.toggleHint}>Loading…</p>
        </div>
      ) : (
        <div className={styles.body}>
          <p className={styles.desc}>
            Default is OFF. Cash and Online collection work without it. Turn ON
            only if this gym wants recurring UPI Autopay, then complete the
            setup checklist.
          </p>

          {error ? <p className={styles.alertError}>{error}</p> : null}
          {savedMsg ? <p className={styles.alertOk}>{savedMsg}</p> : null}

          <div className={styles.toggleRow}>
            <div className={styles.toggleCopy}>
              <p className={styles.toggleTitle}>Enable for this gym</p>
              <p className={styles.toggleHint}>
                {enabled
                  ? "Autopay is ON. Connect Razorpay below, then add members with UPI Autopay — show them the QR to approve."
                  : "Autopay is OFF. Members and payments work normally without recurring Autopay."}
              </p>
            </div>

            <label
              className={`${styles.switch} ${enabled ? styles.switchOn : ""}`}
              data-disabled={busy ? "true" : "false"}
            >
              <input
                className={styles.switchInput}
                type="checkbox"
                role="switch"
                aria-checked={enabled}
                checked={enabled}
                disabled={busy}
                onChange={(e) => save(e.target.checked)}
              />
              <span className={styles.switchTrack} aria-hidden>
                <span className={styles.switchThumb} />
              </span>
              <span className={styles.switchLabel}>
                {enabled ? "ON" : "OFF"}
              </span>
            </label>
          </div>

          {/* Terms the member approves once, in their UPI app. */}
          {enabled ? (
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <p className={styles.panelTitle}>Mandate terms</p>
              </div>
              <p className={styles.toggleHint} style={{ padding: "0 0 10px" }}>
                These terms are <strong>per gym</strong> — each gym can set its
                own ceiling and validity. A member approves them once; Razorpay
                may then debit up to the ceiling without asking again until the
                mandate expires. Changes apply to <strong>new</strong> mandates
                only.
              </p>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                }}
              >
                <label>
                  <span className={styles.toggleHint}>Method</span>
                  <input
                    className={profile.formInput}
                    value="UPI Autopay"
                    readOnly
                    disabled
                  />
                </label>
                <label>
                  <span className={styles.toggleHint}>
                    Per-debit ceiling (× plan price)
                  </span>
                  <input
                    className={profile.formInput}
                    type="number"
                    min={1}
                    max={10}
                    value={mandateMultiplier}
                    disabled={busy}
                    onChange={(e) =>
                      setMandateMultiplier(Number(e.target.value))
                    }
                    onBlur={() =>
                      saveMandateTerms({
                        autopayMandateMultiplier: mandateMultiplier,
                      })
                    }
                  />
                </label>
                <label>
                  <span className={styles.toggleHint}>Validity (months)</span>
                  <input
                    className={profile.formInput}
                    type="number"
                    min={1}
                    max={120}
                    value={mandateMonths}
                    disabled={busy}
                    onChange={(e) => setMandateMonths(Number(e.target.value))}
                    onBlur={() =>
                      saveMandateTerms({
                        autopayMandateValidityMonths: mandateMonths,
                      })
                    }
                  />
                </label>
              </div>
              {rzp?.connected && rzp?.mandateCapable === false ? (
                <p className={styles.toggleHint} style={{ paddingTop: 10 }}>
                  Razorpay is on the Mock connection — members get a simulated
                  link. Connect OAuth or API keys for real mandates.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <p className={styles.panelTitle}>
                {enabled
                  ? "Setup checklist for this gym"
                  : "What you will need if you turn Autopay ON"}
              </p>
              <p
                className={`${styles.panelSub} ${
                  enabled && infraReady ? styles.panelSubReady : ""
                }`}
              >
                {!enabled
                  ? "Preview only — nothing changes until the switch is ON."
                  : depsLoading
                    ? "Checking Razorpay…"
                    : infraReady
                      ? "Ready — add members with UPI Autopay and show the QR."
                      : "Pending — connect Razorpay first."}
              </p>
            </div>

            <ul className={styles.list}>
              {steps.map((step, idx) => {
                const isLive = step.kind === "live";
                const done = isLive ? step.done : false;
                const pill = isLive
                  ? done
                    ? "Done"
                    : "Pending"
                  : idx === 2
                    ? "Next"
                    : "Later";
                const pillClass = isLive
                  ? done
                    ? styles.pillDone
                    : styles.pillNext
                  : styles.pillLater;

                return (
                  <li
                    key={step.id}
                    className={`${styles.item} ${
                      isLive && done ? styles.itemDone : styles.itemTodo
                    }`}
                  >
                    <span
                      className={`${styles.icon} ${
                        isLive && done ? styles.iconDone : styles.iconTodo
                      }`}
                      aria-hidden
                    >
                      {isLive && done ? "✓" : idx + 1}
                    </span>
                    <div className={styles.itemBody}>
                      <p className={styles.itemTitle}>{step.title}</p>
                      <p className={styles.itemDetail}>{step.detail}</p>
                    </div>
                    <span className={pillClass}>{pill}</span>
                  </li>
                );
              })}
            </ul>

            {enabled && !depsLoading ? (
              <div className={styles.footer}>
                <p className={styles.live}>
                  Live: Razorpay{" "}
                  {rzp?.connected ? "connected" : "not connected"}
                  {rzp?.authMode ? ` (${rzp.authMode})` : ""} · Member flow: QR /
                  link (WhatsApp coming soon)
                </p>
                <button
                  type="button"
                  className={profile.btnSecondary}
                  onClick={() => loadDeps()}
                >
                  Refresh status
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
