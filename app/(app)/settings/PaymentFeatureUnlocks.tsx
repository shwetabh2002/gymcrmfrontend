"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import {
  useGymSettings,
  useUpdateGymSettings,
} from "@/services/gym-settings/gym-settings.hooks";
import styles from "../profile/Profile.module.css";

type FlagKey =
  | "featureAutopayUnlocked"
  | "featureRazorpayUnlocked"
  | "featureWhatsappUnlocked"
  | "featureEmailTemplatesUnlocked";

const ROWS: { key: FlagKey; label: string; hint: string }[] = [
  {
    key: "featureAutopayUnlocked",
    label: "UPI Autopay",
    hint: "Unlock Autopay + Razorpay for this gym. Gym can then connect Razorpay and turn Autopay ON.",
  },
  {
    key: "featureRazorpayUnlocked",
    label: "Razorpay only",
    hint: "Unlock Razorpay connect / keys without Autopay (online one-time payments).",
  },
  {
    key: "featureWhatsappUnlocked",
    label: "WhatsApp",
    hint: "Unlock WhatsApp payment-link setup for this gym.",
  },
  {
    key: "featureEmailTemplatesUnlocked",
    label: "Email templates",
    hint: "Unlock custom email templates for this gym.",
  },
];

/**
 * SUPER_ADMIN only — per-gym unlock of payment modules that default to Coming soon.
 */
export default function PaymentFeatureUnlocks() {
  const { user } = useAuth();
  const isSuper = user?.role === "SUPER_ADMIN";
  const { data: settings, isLoading } = useGymSettings(
    isSuper && !!user?.companyId,
  );
  const update = useUpdateGymSettings();
  const [local, setLocal] = useState<Record<FlagKey, boolean>>({
    featureAutopayUnlocked: false,
    featureRazorpayUnlocked: false,
    featureWhatsappUnlocked: false,
    featureEmailTemplatesUnlocked: false,
  });

  useEffect(() => {
    if (!settings) return;
    setLocal({
      featureAutopayUnlocked: settings.featureAutopayUnlocked === true,
      featureRazorpayUnlocked: settings.featureRazorpayUnlocked === true,
      featureWhatsappUnlocked: settings.featureWhatsappUnlocked === true,
      featureEmailTemplatesUnlocked:
        settings.featureEmailTemplatesUnlocked === true,
    });
  }, [settings]);

  if (!isSuper || !user?.companyId) return null;

  const toggle = async (key: FlagKey, next: boolean) => {
    const prev = { ...local };
    const patch: Partial<Record<FlagKey, boolean>> = { [key]: next };
    // Autopay depends on Razorpay — unlock both so gym can connect + switch ON
    if (key === "featureAutopayUnlocked" && next) {
      patch.featureRazorpayUnlocked = true;
    }
    setLocal((s) => ({ ...s, ...patch }));
    try {
      await update.mutateAsync(patch);
      toast.success(
        next
          ? key === "featureAutopayUnlocked"
            ? "Autopay + Razorpay unlocked — gym can connect Razorpay and turn Autopay ON"
            : `${ROWS.find((r) => r.key === key)?.label} unlocked for this gym`
          : `${ROWS.find((r) => r.key === key)?.label} locked (Coming soon)`,
      );
    } catch (e: any) {
      setLocal(prev);
      toast.error(e?.response?.data?.message || "Could not update unlock");
    }
  };

  return (
    <section className={styles.card} style={{ marginTop: 8 }}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardTitleBar} />
          Platform unlocks
        </h2>
        <span className={styles.cardBadge}>SUPER_ADMIN</span>
      </div>
      <p
        className={styles.pageDesc}
        style={{ margin: "0 0 12px", padding: 0, maxWidth: 640 }}
      >
        These modules stay Coming soon for every gym until you unlock them here.
        Unlock is gym-specific — only the gym you are viewing is affected.
      </p>
      {isLoading ? (
        <p style={{ color: "var(--text-3)", fontSize: "0.85rem" }}>Loading…</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {ROWS.map((row) => {
            const on = local[row.key];
            return (
              <div
                key={row.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "10px 0",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: "0.92rem",
                      color: "var(--text-1)",
                    }}
                  >
                    {row.label}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "0.8rem",
                      color: "var(--text-3)",
                      maxWidth: 420,
                    }}
                  >
                    {row.hint}
                  </p>
                </div>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: update.isPending ? "wait" : "pointer",
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    color: on ? "var(--accent)" : "var(--text-3)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={update.isPending}
                    onChange={(e) => toggle(row.key, e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  {on ? "UNLOCKED" : "LOCKED"}
                </label>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
