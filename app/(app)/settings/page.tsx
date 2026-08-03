"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings, canCreateMembers } from "@/lib/rbac";
import GymBrandingSettings from "./GymBrandingSettings";
import RazorpaySettings from "./RazorpaySettings";
import WhatsAppSettings from "./WhatsAppSettings";
import AutopaySettings from "./AutopaySettings";
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
              ? `Configure branding, payments & invoice PDFs for ${user.companyName}.`
              : "Configure branding, payments and invoice PDFs for the selected gym."}
          </p>
        </div>
      </motion.div>

      <GymBrandingSettings />
      <AutopaySettings />
      <RazorpaySettings />
      <WhatsAppSettings />
    </div>
  );
}
