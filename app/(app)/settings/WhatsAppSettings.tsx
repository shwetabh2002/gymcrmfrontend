"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings } from "@/lib/rbac";
import { whatsappApi, WhatsAppStatus } from "@/services/whatsapp/whatsapp.api";
import styles from "../profile/Profile.module.css";
import toast from "react-hot-toast";
import ComingSoonCard from "./ComingSoonCard";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";

export default function WhatsAppSettings() {
  const { user } = useAuth();
  const canEdit = canEditGymSettings(user?.role, user?.permissions);
  const { data: gymSettings, isLoading: gymLoading } = useGymSettings(
    !!user?.companyId,
  );
  const unlocked = gymSettings?.featureWhatsappUnlocked === true;
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cloudToken, setCloudToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [paymentTemplate, setPaymentTemplate] = useState("");
  const [senderNumber, setSenderNumber] = useState("");

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
    if (!unlocked) return;
    load();
  }, [unlocked]);

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

  const connectClickToChat = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await whatsappApi.connectClickToChat(senderNumber);
      setStatus(s);
      toast.success("Gym WhatsApp number saved — staff will tap Send");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Could not save number";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const connectCloud = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await whatsappApi.connectCloud({
        senderNumber: senderNumber.trim() || undefined,
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
        title="WhatsApp — Auto payment links"
        description="WhatsApp delivery is locked for this gym. Platform admin can unlock it per gym when you are ready to send payment links automatically."
      />
    );
  }

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
      <p
        className={styles.pageDesc}
        style={{ margin: "0", padding: "12px 22px 0" }}
      >
        Payment / UPI Autopay links go to the member phone entered while adding
        them, from <strong>this gym&apos;s own number</strong>. Two ways to
        send: connect Meta Cloud API for hands-off auto-send, or just save your
        number and tap Send yourself.
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
            <label className={styles.formLabel}>Your WhatsApp number</label>
            <p style={{ color: "var(--text-1)" }}>
              {status?.senderNumber || status?.displayName || "—"}
            </p>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className={styles.formLabel}>Sending</label>
            <p style={{ color: "var(--text-1)", margin: 0 }}>
              {status?.autoSendReady
                ? "Automatic — messages leave on their own."
                : status?.manualSendOnly
                  ? "Manual — WhatsApp opens with the message ready; staff taps Send."
                  : "Not set up yet."}
            </p>
          </div>

          {/* Option B: no Meta setup, gym just saves its number. */}
          {canEdit ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <label className={styles.formLabel}>
                Option 1 — your number, staff taps Send
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  className={styles.formInput}
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="Gym WhatsApp number with country code"
                  disabled={busy}
                  style={{ flex: "1 1 240px" }}
                />
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={busy || !senderNumber.trim()}
                  onClick={connectClickToChat}
                >
                  Save number
                </button>
              </div>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-2)",
                  display: "block",
                  marginTop: 6,
                }}
              >
                No Meta account needed. Every link opens a prefilled chat from
                this number — one tap per member.
              </span>
            </div>
          ) : null}

          {canEdit && !status?.connected ? (
            <>
              <div>
                <label className={styles.formLabel}>
                  Option 2 — Cloud API token (auto-send)
                </label>
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
