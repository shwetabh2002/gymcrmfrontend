"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings } from "@/lib/rbac";
import styles from "../profile/Profile.module.css";

/**
 * WhatsApp auto-send is parked for now — members use QR / payment link instead.
 */
export default function WhatsAppSettings() {
  const { user } = useAuth();
  const canEdit = canEditGymSettings(user?.role, user?.permissions);

  return (
    <section className={styles.card} style={{ marginTop: 20 }}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardTitleBar} />
          WhatsApp — Auto payment links
        </h2>
        <span className={styles.cardBadge}>Coming soon</span>
      </div>
      <div className={styles.formGrid}>
        <div style={{ gridColumn: "1 / -1", paddingBottom: 8 }}>
          <p
            className={styles.pageDesc}
            style={{ margin: 0, padding: 0, maxWidth: 560 }}
          >
            WhatsApp delivery is coming soon. For now, after you add a member
            on <strong>UPI Autopay</strong>, show them the{" "}
            <strong>QR code</strong> (or copy the payment link) so they can
            scan, pay, and approve the mandate in their UPI app.
          </p>
          {canEdit ? (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "0.85rem",
                color: "var(--text-3)",
              }}
            >
              Cloud API / click-to-chat setup will return here in a later
              release.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
