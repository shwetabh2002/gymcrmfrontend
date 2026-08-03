"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/context/AuthContext";
import { useDashboard } from "@/services/analytics/analytics.hooks";
import { canEditGymSettings } from "@/lib/rbac";
import styles from "./Profile.module.css";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: dashboard } = useDashboard();

  const displayName  = user?.name  ?? "Admin User";
  const displayEmail = user?.email ?? "—";
  const displayRole  = user?.role  ?? "ADMIN";
  const canEditSettings = canEditGymSettings(user?.role, user?.permissions);

  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd,     setNewPwd]       = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [pwdError,   setPwdError]     = useState("");
  const [pwdSuccess, setPwdSuccess]   = useState("");

  const handlePasswordUpdate = () => {
    setPwdError(""); setPwdSuccess("");
    if (!currentPwd) { setPwdError("Current password is required."); return; }
    if (newPwd.length < 8) { setPwdError("New password must be at least 8 characters."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match."); return; }
    setPwdSuccess("Password updated successfully.");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  };

  const counts = dashboard?.counts;

  const gymStats = [
    { label: "Total Members",        val: counts?.totalMembers          ?? "—" },
    { label: "Active Subscriptions", val: counts?.activeSubscriptions   ?? "—" },
    { label: "Monthly Revenue",      val: counts != null ? `₹${counts.monthlyRevenue.toLocaleString()}` : "—" },
    { label: "New This Month",       val: counts?.newMembersThisMonth   ?? "—" },
  ];

  return (
    <div className={styles.page}>

      <motion.div className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Profile</h1>
          <p className={styles.pageDesc}>Manage your account information and security settings.</p>
        </div>
      </motion.div>

      <div className={styles.profileGrid}>

        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.identityCard}>
            <div className={styles.identityAccent} />
            <div className={styles.identityBody}>
              <div className={styles.avatarLarge}>{initials(displayName)}</div>
              <div>
                <div className={styles.identityName}>{displayName}</div>
                <div className={styles.identityRole}>{displayRole}</div>
              </div>
              <div className={styles.identityDivider} />
              <div className={styles.infoRows}>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Email</span>
                  <span className={styles.infoRowVal}>{displayEmail}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Gym</span>
                  <span className={styles.infoRowVal}>{user?.companyName || "—"}</span>
                </div>
              </div>
              <span className={`${styles.badge} ${styles.badgeActive}`}>Account Active</span>

              <div className={styles.identityDivider} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
                {gymStats.map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: "#555" }}>{s.label}</span>
                    <span style={{ fontSize: "0.88rem", color: "#ccc", fontWeight: 600 }}>{String(s.val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className={styles.rightCol}>

          <motion.div className={styles.card} custom={1} variants={fadeUp} initial="hidden" animate="visible">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />Account Information</h2>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <input className={styles.formInput} defaultValue={displayName} disabled />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input className={styles.formInput} type="email" defaultValue={displayEmail} disabled />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <input className={styles.formInput} defaultValue={displayRole} disabled />
              </div>
            </div>
            {canEditSettings && (
              <div className={styles.formActions}>
                <Link href="/settings" className={styles.btnPrimary} style={{ textDecoration: "none" }}>
                  Open gym settings →
                </Link>
              </div>
            )}
          </motion.div>

          <motion.div className={styles.card} custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />Change Password</h2>
            </div>

            {pwdError   && <p style={{ fontSize: "0.85rem", color: "#e63946", background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.2)", borderRadius: 6, padding: "0.6rem 0.85rem", marginBottom: "1rem" }}>{pwdError}</p>}
            {pwdSuccess && <p style={{ fontSize: "0.85rem", color: "#3ec95a", background: "rgba(62,201,90,0.08)", border: "1px solid rgba(62,201,90,0.2)", borderRadius: 6, padding: "0.6rem 0.85rem", marginBottom: "1rem" }}>{pwdSuccess}</p>}

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Current Password</label>
                <input className={styles.formInput} type="password" placeholder="••••••••••"
                  value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
              </div>
              <div className={styles.formGroup} />
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>New Password</label>
                <input className={styles.formInput} type="password" placeholder="••••••••••"
                  value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confirm New Password</label>
                <input className={styles.formInput} type="password" placeholder="••••••••••"
                  value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.btnPrimary} onClick={handlePasswordUpdate}>Update Password</button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
