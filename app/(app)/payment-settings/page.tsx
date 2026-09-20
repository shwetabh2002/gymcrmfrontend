"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings, canCreateMembers } from "@/lib/rbac";
import AutopaySettings from "../settings/AutopaySettings";
import RazorpaySettings from "../settings/RazorpaySettings";
import WhatsAppSettings from "../settings/WhatsAppSettings";
import EmailTemplateSettings from "../settings/EmailTemplateSettings";
import styles from "../profile/Profile.module.css";

export default function PaymentSettingsPage() {
  const { user } = useAuth();
  const canView =
    canEditGymSettings(user?.role, user?.permissions) ||
    canCreateMembers(user?.role, user?.permissions);

  if (!canView) {
    return (
      <div className={styles.page}>
        <p style={{ color: "var(--text-2)" }}>
          You do not have access to payment settings.
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
          <h1 className={styles.pageTitle}>Payment settings</h1>
          <p className={styles.pageDesc}>
            {user?.companyName
              ? `Razorpay, UPI Autopay, WhatsApp and email for ${user.companyName}.`
              : "Razorpay, UPI Autopay, WhatsApp and email for the selected gym."}
          </p>
        </div>
      </motion.div>

      <AutopaySettings />
      <RazorpaySettings />
      <WhatsAppSettings />
      <EmailTemplateSettings />
    </div>
  );
}
