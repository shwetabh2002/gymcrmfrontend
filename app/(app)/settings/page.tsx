"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings, canCreateMembers } from "@/lib/rbac";
import GymBrandingSettings from "./GymBrandingSettings";
import styles from "../profile/Profile.module.css";

export default function GymSettingsPage() {
  const { user } = useAuth();
  const canView =
    canEditGymSettings(user?.role, user?.permissions) ||
    canCreateMembers(user?.role, user?.permissions);

  if (!canView) {
    return (
      <div className={styles.page}>
        <p style={{ color: "var(--text-2)" }}>
          You do not have access to gym settings.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <p className={styles.eyebrow}>Per gym</p>
          <h1 className={styles.pageTitle}>Gym settings</h1>
          <p className={styles.pageDesc}>
            {user?.companyName
              ? `Branding and invoice PDFs for ${user.companyName}.`
              : "Branding and invoice PDFs for the selected gym."}
          </p>
          <p className={styles.pageDesc} style={{ marginTop: 8 }}>
            Your GymFlow plan, trial and payment live under{" "}
            <Link
              href="/settings/subscription"
              style={{
                color: "var(--red, #c0392b)",
                textDecoration: "underline",
              }}
            >
              Plan &amp; billing
            </Link>
            . Razorpay, Autopay, WhatsApp and email live under{" "}
            <Link
              href="/payment-settings"
              style={{
                color: "var(--red, #c0392b)",
                textDecoration: "underline",
              }}
            >
              Payment settings
            </Link>
            .
          </p>
        </div>
      </motion.div>

      <GymBrandingSettings />
    </div>
  );
}
