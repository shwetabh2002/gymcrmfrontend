"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings } from "@/lib/rbac";
import {
  paymentProviderApi,
  ProviderStatus,
} from "@/services/payments/provider.api";
import styles from "../profile/Profile.module.css";
import ComingSoonCard from "./ComingSoonCard";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";

export default function RazorpaySettings() {
  const { user } = useAuth();
  const canEdit = canEditGymSettings(user?.role, user?.permissions);
  const { data: gymSettings, isLoading: gymLoading } = useGymSettings(
    !!user?.companyId,
  );
  const unlocked = gymSettings?.featureRazorpayUnlocked === true;
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const s = await paymentProviderApi.getStatus();
      setStatus(s);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load payment provider");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!unlocked) return;
    load();
  }, [unlocked]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("razorpay") === "connected") load();
  }, []);

  const connectOAuth = async () => {
    setBusy(true);
    setError("");
    try {
      const { authorizeUrl } = await paymentProviderApi.startOAuth();
      window.location.href = authorizeUrl;
    } catch (e: any) {
      setError(e?.response?.data?.message || "OAuth start failed");
      setBusy(false);
    }
  };

  const connectKeys = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await paymentProviderApi.connectApiKeys({ keyId, keySecret });
      setStatus(s);
      setKeySecret("");
      toast.success("Razorpay connected for this gym");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Connect failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const saveWebhookSecret = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await paymentProviderApi.setWebhookSecret(webhookSecret.trim());
      setStatus(s);
      setWebhookSecret("");
      toast.success(
        s.webhookSecretSet
          ? "Webhook secret saved — autopay confirmations will be verified"
          : "Webhook secret cleared",
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Could not save webhook secret";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed — select and copy manually");
    }
  };

  const connectMock = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await paymentProviderApi.connectMock();
      setStatus(s);
      toast.success("Mock Razorpay connected (development only)");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Mock connect failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await paymentProviderApi.disconnect();
      await load();
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
        Connect this gym&apos;s Razorpay account so Online / UPI Autopay
        settlements go to their bank. Prefer Partner OAuth in production; API
        keys or Mock for local testing.
      </p>

      {loading ? (
        <p style={{ color: "var(--text-2)" }}>Loading…</p>
      ) : (
        <div className={styles.formGrid}>
          {error ? (
            <p style={{ color: "#f87171", gridColumn: "1 / -1" }}>{error}</p>
          ) : null}

          <div>
            <label className={styles.formLabel}>Status</label>
            <p style={{ color: "var(--text-1)" }}>
              {status?.status || "NOT_CONNECTED"}
              {status?.authMode ? ` · ${status.authMode}` : ""}
            </p>
          </div>
          <div>
            <label className={styles.formLabel}>Account</label>
            <p style={{ color: "var(--text-1)" }}>
              {status?.accountName || "—"}
            </p>
          </div>

          {canEdit && !status?.connected ? (
            <>
              {status?.partnerOAuthAvailable ? (
                <div style={{ gridColumn: "1 / -1" }}>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={busy}
                    onClick={connectOAuth}
                  >
                    Connect with Razorpay
                  </button>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-2)",
                      margin: "6px 0 0",
                    }}
                  >
                    Recommended — one click, and webhooks are set up for you.
                    Settlements go straight to this gym&apos;s bank account.
                  </p>
                </div>
              ) : null}

              <div style={{ gridColumn: "1 / -1" }}>
                <label className={styles.formLabel}>
                  {status?.partnerOAuthAvailable
                    ? "Or connect with your own API keys"
                    : "Connect with your Razorpay API keys"}
                </label>
              </div>

              <div>
                <label className={styles.formLabel}>Key ID</label>
                <input
                  className={styles.formInput}
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder="rzp_test_…"
                  disabled={!canEdit || busy}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Key Secret</label>
                <input
                  className={styles.formInput}
                  type="password"
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder="••••••••"
                  disabled={!canEdit || busy}
                />
              </div>
              <div
                className={styles.formActions}
                style={{ gridColumn: "1 / -1" }}
              >
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={busy || !keyId || !keySecret}
                  onClick={connectKeys}
                >
                  Connect API keys
                </button>
                {status?.mockAvailable ? (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled={busy}
                    onClick={connectMock}
                  >
                    Use Mock (dev)
                  </button>
                ) : null}
              </div>
            </>
          ) : null}

          {status?.connected ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <label className={styles.formLabel}>UPI Autopay mandates</label>
              <p style={{ color: "var(--text-1)", margin: "0 0 4px" }}>
                {status.mandateCapable
                  ? "Live — members can approve a real UPI Autopay mandate."
                  : "Mock connection: members get a simulated link. Connect OAuth or API keys for real mandates."}
              </p>
            </div>
          ) : null}

          {/* OAuth gyms are covered by the partner-level webhook. */}
          {status?.connected && status?.webhookOwnedByPlatform ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <label className={styles.formLabel}>Webhooks</label>
              <p style={{ color: "var(--text-1)", margin: 0 }}>
                Handled for you — connecting with Razorpay OAuth also subscribes
                this gym to payment and mandate updates. Nothing to configure in
                your Razorpay dashboard.
              </p>
            </div>
          ) : null}

          {/* API-key gyms must register the webhook themselves: it is how a
              mandate approval and every recurring debit get confirmed. */}
          {status?.connected &&
          status?.webhookUrl &&
          !status?.webhookOwnedByPlatform ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <label className={styles.formLabel}>
                Webhook — add this in your Razorpay dashboard
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <code
                  style={{
                    background: "var(--surface-2, rgba(127,127,127,.12))",
                    padding: "6px 10px",
                    borderRadius: 6,
                    wordBreak: "break-all",
                  }}
                >
                  {status.webhookUrl}
                </code>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => copy(status.webhookUrl!, "Webhook URL")}
                >
                  Copy URL
                </button>
              </div>

              {status.webhookEvents?.length ? (
                <p
                  style={{
                    color: "var(--text-2)",
                    fontSize: "0.85rem",
                    marginTop: 8,
                  }}
                >
                  Enable these events: {status.webhookEvents.join(", ")}
                </p>
              ) : null}

              <p
                style={{
                  color: status.webhookSecretSet ? "var(--text-2)" : "#f59e0b",
                  fontSize: "0.85rem",
                  marginTop: 8,
                }}
              >
                {status.webhookSecretSet
                  ? "This gym has its own webhook secret saved."
                  : "No gym-specific secret yet — the platform-wide secret is used. Paste yours below for per-gym verification."}
              </p>

              {canEdit ? (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    className={styles.formInput}
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="Webhook signing secret from Razorpay"
                    disabled={busy}
                    style={{ flex: "1 1 240px" }}
                  />
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={busy}
                    onClick={saveWebhookSecret}
                  >
                    {webhookSecret.trim() ? "Save secret" : "Clear secret"}
                  </button>
                </div>
              ) : null}
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
