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
import {
  whatsappApi,
  WhatsAppStatus,
} from "@/services/whatsapp/whatsapp.api";
import profile from "../profile/Profile.module.css";
import styles from "./AutopaySettings.module.css";

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
  const [wa, setWa] = useState<WhatsAppStatus | null>(null);
  const [depsLoading, setDepsLoading] = useState(true);

  useEffect(() => {
    if (settings) setEnabled(settings.autopayEnabled === true);
  }, [settings]);

  const loadDeps = async () => {
    setDepsLoading(true);
    try {
      const [p, w] = await Promise.all([
        paymentProviderApi.getStatus().catch(() => null),
        whatsappApi.getStatus().catch(() => null),
      ]);
      setRzp(p);
      setWa(w);
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

  const steps: Step[] = [
    {
      id: "flag",
      title: "Turn Autopay ON for this gym",
      detail: "Use the switch above. Default is OFF. Only this gym is affected.",
      done: enabled,
      kind: "live",
    },
    {
      id: "rzp",
      title: "Connect Razorpay",
      detail:
        "Scroll to Payments — Razorpay below. Connect OAuth / API keys (or Mock for local).",
      done: !!rzp?.connected,
      kind: "live",
    },
    {
      id: "wa",
      title: "WhatsApp auto-send ready",
      detail:
        "Scroll to WhatsApp below. Cloud API for production, or Mock auto-send for local.",
      done: !!wa?.autoSendReady,
      kind: "live",
    },
    {
      id: "member",
      title: "Add member with Online + Autopay",
      detail:
        "Members → Add → Mode = Online / UPI Autopay → keep Autopay checked → save.",
      done: false,
      kind: "howto",
    },
    {
      id: "pay",
      title: "Member pays & approves UPI Autopay",
      detail:
        "Member opens WhatsApp link, pays, and approves the mandate in their UPI app.",
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

  const infraReady = enabled && !!rzp?.connected && !!wa?.autoSendReady;
  const busy = !canEdit || update.isPending;

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
            Default is OFF. Platform works with cash, UPI, and one-time online
            without Autopay. Turn ON only if this gym wants recurring UPI
            Autopay, then complete the setup checklist.
          </p>

          {error ? <p className={styles.alertError}>{error}</p> : null}
          {savedMsg ? <p className={styles.alertOk}>{savedMsg}</p> : null}

          <div className={styles.toggleRow}>
            <div className={styles.toggleCopy}>
              <p className={styles.toggleTitle}>Enable for this gym</p>
              <p className={styles.toggleHint}>
                {enabled
                  ? "Autopay is ON. Complete Razorpay + WhatsApp below, then add members with Online + Autopay."
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
                    ? "Checking Razorpay and WhatsApp…"
                    : infraReady
                      ? "Ready — you can add members with Online + Autopay."
                      : "Pending — connect Razorpay and WhatsApp first."}
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
                  : idx === 3
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
                  {rzp?.authMode ? ` (${rzp.authMode})` : ""} · WhatsApp{" "}
                  {wa?.autoSendReady ? "ready" : "not ready"}
                  {wa?.authMode ? ` (${wa.authMode})` : ""}
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
