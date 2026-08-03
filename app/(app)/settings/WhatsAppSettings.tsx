"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings } from "@/lib/rbac";
import { whatsappApi, WhatsAppStatus } from "@/services/whatsapp/whatsapp.api";
import styles from "../profile/Profile.module.css";

export default function WhatsAppSettings() {
  const { user } = useAuth();
  const canEdit = canEditGymSettings(user?.role, user?.permissions);
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cloudToken, setCloudToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [paymentTemplate, setPaymentTemplate] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const s = await whatsappApi.getStatus();
      setStatus(s);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load WhatsApp status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const connectMock = async () => {
    setBusy(true);
    setError("");
    try {
      setStatus(await whatsappApi.connectMock());
    } catch (e: any) {
      setError(e?.response?.data?.message || "Mock connect failed");
    } finally {
      setBusy(false);
    }
  };

  const connectCloud = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await whatsappApi.connectCloud({
        cloudToken,
        phoneNumberId,
        paymentTemplate,
      });
      setStatus(s);
      setCloudToken("");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Cloud connect failed");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await whatsappApi.disconnect();
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
          WhatsApp — Auto payment links
        </h2>
        <span className={styles.cardBadge}>
          {status?.autoSendReady ? "Auto-send ON" : "Not ready"}
        </span>
      </div>
      <p className={styles.pageDesc} style={{ margin: "0", padding: "12px 22px 0" }}>
        Payment / UPI Autopay links are sent automatically to the member phone
        entered while adding them. Production: Meta Cloud API. Local: Mock
        auto-send.
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
            <label className={styles.formLabel}>Sender</label>
            <p style={{ color: "var(--text-1)" }}>
              {status?.displayName || "—"}
            </p>
          </div>

          {canEdit && !status?.connected ? (
            <>
              <div>
                <label className={styles.formLabel}>Cloud token</label>
                <input
                  className={styles.formInput}
                  type="password"
                  value={cloudToken}
                  onChange={(e) => setCloudToken(e.target.value)}
                  placeholder="Meta permanent token"
                  disabled={busy}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Phone number ID</label>
                <input
                  className={styles.formInput}
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="WhatsApp Phone Number ID"
                  disabled={busy}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Payment template</label>
                <input
                  className={styles.formInput}
                  value={paymentTemplate}
                  onChange={(e) => setPaymentTemplate(e.target.value)}
                  placeholder="e.g. membership_payment"
                  disabled={busy}
                />
              </div>
              <div
                className={styles.formActions}
                style={{ gridColumn: "1 / -1" }}
              >
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={
                    busy || !cloudToken || !phoneNumberId || !paymentTemplate
                  }
                  onClick={connectCloud}
                >
                  Connect Cloud API
                </button>
                {status?.mockAvailable ? (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled={busy}
                    onClick={connectMock}
                  >
                    Use Mock auto-send (dev)
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
