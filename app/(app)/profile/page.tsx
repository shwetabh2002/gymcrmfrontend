"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/context/AuthContext";
import styles from "./Profile.module.css";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

const activityLog = [
  { action: "Logged in",                 time: "Today, 9:14 AM",    ip: "192.168.1.1" },
  { action: "Updated pricing — Pro plan",time: "Yesterday, 4:02 PM",ip: "192.168.1.1" },
  { action: "Exported user CSV",         time: "Feb 20, 11:30 AM",  ip: "192.168.1.1" },
  { action: "Added new user",            time: "Feb 18, 3:45 PM",   ip: "192.168.1.1" },
  { action: "Password changed",          time: "Feb 10, 10:00 AM",  ip: "10.0.0.42"   },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { user } = useAuth();

  const displayName  = user?.name  ?? "Admin User";
  const displayEmail = user?.email ?? "—";
  const displayRole  = user?.role  ?? "ADMIN";

  const INFO_ROWS = [
    { label: "Email", val: displayEmail },
    { label: "Role",  val: displayRole  },
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

        {/* Identity card */}
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
                {INFO_ROWS.map(({ label, val }) => (
                  <div key={label} className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>{label}</span>
                    <span className={styles.infoRowVal}>{val}</span>
                  </div>
                ))}
              </div>
              <span className={`${styles.badge} ${styles.badgeActive}`}>Account Active</span>
            </div>
          </div>
        </motion.div>

        {/* Right column */}
        <div className={styles.rightCol}>

          {/* Personal Info */}
          <motion.div className={styles.card} custom={1} variants={fadeUp} initial="hidden" animate="visible">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />Personal Information</h2>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <input className={styles.formInput} defaultValue={displayName} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input className={styles.formInput} type="email" defaultValue={displayEmail} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <input className={styles.formInput} defaultValue={displayRole} disabled />
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.btnSecondary}>Discard</button>
              <button className={styles.btnPrimary}>Save Changes</button>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div className={styles.card} custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />Security</h2>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Current Password</label>
                <input className={styles.formInput} type="password" placeholder="••••••••••" />
              </div>
              <div className={styles.formGroup} />
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>New Password</label>
                <input className={styles.formInput} type="password" placeholder="••••••••••" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confirm New Password</label>
                <input className={styles.formInput} type="password" placeholder="••••••••••" />
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.btnPrimary}>Update Password</button>
            </div>
          </motion.div>

          {/* Activity log */}
          <motion.div className={styles.card} custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />Recent Activity</h2>
              <span className={styles.cardBadge}>{activityLog.length} events</span>
            </div>
            <ul className={styles.logList}>
              {activityLog.map((log, i) => (
                <li key={i} className={styles.logItem}>
                  <div className={styles.logLeft}>
                    <span className={styles.logDot} />
                    <div>
                      <div className={styles.logAction}>{log.action}</div>
                      <div className={styles.logIp}>IP: {log.ip}</div>
                    </div>
                  </div>
                  <span className={styles.logTime}>{log.time}</span>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </div>
  );
}