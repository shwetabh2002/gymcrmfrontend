"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings } from "@/lib/rbac";
import {
  paymentProviderApi,
  ProviderStatus,
} from "@/services/payments/provider.api";
import styles from "../profile/Profile.module.css";

export default function RazorpaySettings() {
  const { user } = useAuth();
  const canEdit = canEditGymSettings(user?.role, user?.permissions);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
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
    load();
  }, []);

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
    } catch (e: any) {
      setError(e?.response?.data?.message || "Connect failed");
    } finally {
      setBusy(false);
    }
  };

  const connectMock = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await paymentProviderApi.connectMock();
      setStatus(s);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Mock connect failed");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await paymentProviderApi.disconnect();
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Disconnect failed");
    } finally {
      setBusy(false);
    }
  };

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
      <p className={styles.pageDesc} style={{ margin: "0", padding: "12px 22px 0" }}>
        Connect this gym&apos;s Razorpay account so Online / UPI Autopay
        settlements go to their bank. Prefer Partner OAuth in production;
        API keys or Mock for local testing.
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
                    Connect with Razorpay OAuth
                  </button>
                </div>
              ) : null}

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
              <div className={styles.formActions} style={{ gridColumn: "1 / -1" }}>
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

          {canEdit && status?.connected ? (
            <div className={styles.formActions} style={{ gridColumn: "1 / -1" }}>
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
