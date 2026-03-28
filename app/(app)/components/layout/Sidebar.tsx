"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import styles from "./Sidebar.module.css";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    href: "/users",
    label: "Members",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M1 13c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M11 7.5a2 2 0 100-4M15 13c0-1.8-1.5-3-4-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/employees",
    label: "Employees",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="8" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 12c0-1.657 1.343-2.5 3-2.5s3 .843 3 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/invoices",
    label: "Invoices",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {/* Backdrop — mobile only, conditionally rendered */}
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${isCollapsed ? styles.collapsed : ""}`}>

        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandRow}>
            <div className={styles.brandIcon}>
              <Image src="/small_logo.png" alt="Logo" width={48} height={48} style={{ width: "auto", height: "auto" }} />
            </div>
            {!isCollapsed && (
              <div>
                <div className={styles.brandName}>Dalyfstyle Fitness</div>
                <div className={styles.brandSub}>Control Panel</div>
              </div>
            )}
          </div>

          {/* Collapse toggle — desktop only */}
          <button
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* Nav section label */}
        <div className={styles.navSection}>
          {!isCollapsed && <span className={styles.navLabel}>Navigation</span>}
        </div>

        {/* Nav links */}
        <nav className={styles.nav}>
          {NAV.map(({ href, label, icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                onClick={onClose}
                title={isCollapsed ? label : undefined}
              >
                <span className={styles.navIcon}>{icon}</span>
                <span className={styles.navLinkLabel}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userRow}>
            <div className={styles.avatar}>{user?.name ? initials(user.name) : "A"}</div>
            {!isCollapsed && (
              <div>
                <div className={styles.userName}>{user?.name ?? "Admin"}</div>
                <div className={styles.userRole}>{user?.role ?? "ADMIN"}</div>
              </div>
            )}
          </div>
        </div>

      </aside>
    </>
  );
}