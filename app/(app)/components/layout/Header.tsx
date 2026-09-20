"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import CompanySwitcher from "./CompanySwitcher";
import styles from "./Header.module.css";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/users":         "Members",
  "/renewals":      "Expiry Follow-ups",
  "/dues":          "Partial dues",
  "/billing":       "Memberships & Payments",
  "/subscriptions": "Memberships & Payments",
  "/plans":         "Plans",
  "/payments":      "Memberships & Payments",
  "/invoices":      "Invoices",
  "/payment-settings": "Payment settings",
  "/settings":      "Gym settings",
  "/profile":       "Profile",
};

export default function Header() {
  const { logout, user } = useAuth();
  const router     = useRouter();
  const pathname   = usePathname();

  const pageTitle = PAGE_TITLES[pathname] ?? "Workspace";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span>Workspace</span>
        <span className={styles.slash}>/</span>
        <span className={styles.page}>{pageTitle}</span>
      </div>
      <div className={styles.right}>
        {isSuperAdmin ? (
          <CompanySwitcher variant="header" />
        ) : (
          <div className={styles.status}>
            <span className={styles.statusDot} />
            Systems operational
          </div>
        )}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span className={styles.logoutIcon}>↩</span>
          Logout
        </button>
      </div>
    </header>
  );
}
