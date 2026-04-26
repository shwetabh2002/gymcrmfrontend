"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import styles from "./Header.module.css";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/users":         "Members",
  "/employees":     "Employees",
  "/attendance":    "Attendance",
  "/subscriptions": "Subscriptions",
  "/plans":         "Subscription Plans",
  "/payments":      "Payments",
  "/invoices":      "Invoices",
  "/profile":       "Profile",
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
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
        {/* Hamburger — only visible on mobile via CSS */}
        <button
          className={styles.menuBtn}
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        <span className={styles.breadcrumb}>Admin Panel</span>
        <span className={styles.slash}>/</span>
        <span className={styles.page}>{pageTitle}</span>
      </div>

      <div className={styles.right}>
        <div className={styles.status}>
          <span className={styles.statusDot} />
          Systems operational
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          {/* SVG logout / sign-out icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H2.5A1.5 1.5 0 011 10.5v-7A1.5 1.5 0 012.5 2H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9.5 10L13 7l-3.5-3M13 7H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}