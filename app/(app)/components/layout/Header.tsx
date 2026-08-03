"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import styles from "./Header.module.css";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/users":         "Members",
  "/renewals":      "Expiry Follow-ups",
  "/billing":       "Memberships & Payments",
  "/subscriptions": "Memberships & Payments",
  "/plans":         "Plans",
  "/payments":      "Memberships & Payments",
  "/invoices":      "Invoices",
  "/profile":       "Profile",
};

export default function Header() {
  const { logout } = useAuth();
  const router     = useRouter();
  const pathname   = usePathname();

  const pageTitle = PAGE_TITLES[pathname] ?? "Admin Panel";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span>Admin Panel</span>
        <span className={styles.slash}>/</span>
        <span className={styles.page}>{pageTitle}</span>
      </div>
      <div className={styles.right}>
        <div className={styles.status}>
          <span className={styles.statusDot} />
          Systems operational
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span className={styles.logoutIcon}>↩</span>
          Logout
        </button>
      </div>
    </header>
  );
}