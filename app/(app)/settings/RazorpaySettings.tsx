"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings } from "@/lib/rbac";
import { paymentProviderApi } from "@/services/payments/provider.api";
import styles from "../profile/Profile.module.css";
import ComingSoonCard from "./ComingSoonCard";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import { subscriptionApi } from "@/services/subscription/subscription.api";

export default function RazorpaySettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const companyId = user?.companyId ?? null;
  const canEdit = canEditGymSettings(user?.role, user?.permissions);
  const { data: gymSettings, isLoading: gymLoading } = useGymSettings(
    !!companyId,
  );
  const { data: sub } = useQuery({
    queryKey: ["subscription", companyId],
    queryFn: subscriptionApi.mine,
    enabled: !!companyId,
  });
  const unlocked =
    gymSettings?.razorpayEntitled === true ||
    gymSettings?.featureRazorpayUnlocked === true ||
    gymSettings?.featureAutopayUnlocked === true ||
    (sub?.features ?? []).includes("AUTOPAY");

  const {
    data: status,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["payment-provider", companyId],
    queryFn: paymentProviderApi.getStatus,
    enabled: !!companyId && unlocked,
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !companyId) return;
    const url = new URL(window.location.href);
    const rzpState = url.searchParams.get("razorpay");
    if (!rzpState) return;

    if (rzpState === "connected") {
      toast.success("Razorpay connected successfully");
      qc.invalidateQueries({ queryKey: ["payment-provider", companyId] });
    } else if (rzpState === "cancelled") {
      toast.error("Razorpay authorization was cancelled");
    } else if (rzpState === "error") {
      toast.error("Could not connect Razorpay — please try again");
    }

    url.searchParams.delete("razorpay");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [companyId, qc]);

  const connectOAuth = async () => {
    setBusy(true);
    setError("");
    try {
      const { authorizeUrl } = await paymentProviderApi.startOAuth();
      window.location.href = authorizeUrl;
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || "Could not start Razorpay connect";
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError("");
    try {
      await paymentProviderApi.disconnect();
      await qc.invalidateQueries({ queryKey: ["payment-provider", companyId] });
      await refetch();
      toast.success("Razorpay disconnected");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Disconnect failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (gymLoading) {
    return (
      <section className={styles.card} style={{ marginTop: 20 }}>
        <p style={{ padding: 16, color: "var(--text-3)" }}>Loading…</p>
      </section>
    );
  }

  if (!unlocked) {
    return (
      <ComingSoonCard
        title="Payments — Razorpay"
        description="Razorpay connect is locked for this gym. Platform admin can unlock it per gym when you are ready to take online payments."
      />
    );
  }

  const displayError =
    error ||
    (queryError as any)?.response?.data?.message ||
    (queryError ? "Failed to load payment provider" : "");
  const needsReconnect = status?.status === "NEEDS_REAUTH";

  return (
    <section className={styles.card} style={{ marginTop: 20 }}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardTitleBar} />
          Payments — Razorpay
        </h2>
        <span className={styles.cardBadge}>
          {status?.connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <p
        className={styles.pageDesc}
        style={{ margin: "0", padding: "12px 22px 0" }}
      >
        Connect this gym&apos;s Razorpay account in one click so Online and UPI
        Autopay settlements go straight to your bank account.
      </p>

      {loading ? (
        <p style={{ padding: "16px 22px", color: "var(--text-2)" }}>Loading…</p>
      ) : (
        <div className={styles.formGrid}>
          {displayError ? (
            <p style={{ color: "#f87171", gridColumn: "1 / -1" }}>
              {displayError}
            </p>
          ) : null}

          <div>
            <label className={styles.formLabel}>Status</label>
            <p style={{ color: "var(--text-1)" }}>
              {status?.connected
                ? "Connected"
                : needsReconnect
                  ? "Reconnect required"
                  : "Not connected"}
            </p>
          </div>
          <div>
            <label className={styles.formLabel}>Account</label>
            <p style={{ color: "var(--text-1)" }}>
              {status?.accountName || "—"}
            </p>
          </div>

          {canEdit && !status?.connected ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={busy || !status?.partnerOAuthAvailable}
                onClick={connectOAuth}
              >
                {needsReconnect
                  ? "Reconnect with Razorpay"
                  : "Connect with Razorpay"}
              </button>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-2)",
                  margin: "8px 0 0",
                }}
              >
                {status?.partnerOAuthAvailable
                  ? "One-click authorization — settlements go straight to your bank account, with zero technical or dashboard setup required."
                  : "Razorpay one-click connect is not active on the platform yet. Please contact support."}
              </p>
            </div>
          ) : null}

          {status?.connected ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <label className={styles.formLabel}>UPI Autopay mandates</label>
              <p style={{ color: "var(--text-1)", margin: "0 0 4px" }}>
                Live — members can approve UPI Autopay mandates and recurring
                renewals are confirmed automatically.
              </p>
            </div>
          ) : null}

          {canEdit && status?.connected ? (
            <div
              className={styles.formActions}
              style={{ gridColumn: "1 / -1" }}
            >
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={busy}
                onClick={disconnect}
              >
                Disconnect
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
