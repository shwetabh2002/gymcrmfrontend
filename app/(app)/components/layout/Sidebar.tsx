"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import styles from "./Sidebar.module.css";

const NAV = [
  { href: "/dashboard",        label: "Dashboard",         icon: "⊞" },
  { href: "/users",            label: "Members",            icon: "◎" },
  // { href: "/subscriptions",    label: "Subscriptions",      icon: "◈" },
  // { href: "/plans",            label: "Plans",              icon: "◇" },
  // { href: "/trainers",         label: "Trainers",           icon: "▸" },
  // { href: "/training-types",   label: "Training Types",     icon: "▤" },
  // { href: "/payments",         label: "Payments",           icon: "▤" },
  { href: "/invoices",         label: "Invoices",           icon: "▣" },
  { href: "/profile",          label: "Profile",            icon: "◉" },
];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile toggle button */}
      <button className={styles.mobileToggle} onClick={toggleSidebar} aria-label="Toggle sidebar">
        <span className={styles.hamburger}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Backdrop — conditionally rendered so it only exists in DOM when open */}
      {isOpen && <div className={styles.backdrop} onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${isCollapsed ? styles.collapsed : ""}`}>
        <div className={styles.brand}>
          <div className={styles.brandRow}>
            <div className={styles.brandIcon}>
              <Image src="/small_logo.png" alt="Logo" width={48} height={48} />
            </div>
            {!isCollapsed && (
              <div>
                <div className={styles.brandName}>Dalyfstyle Fitness</div>
                <div className={styles.brandSub}>Control Panel</div>
              </div>
            )}
          </div>
          <button
            className={styles.collapseBtn}
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand" : "Collapse"}
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        <div className={styles.navSection}>
          {!isCollapsed && <span className={styles.navLabel}>Navigation</span>}
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ href, label, icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                onClick={closeSidebar}
              >
                <span className={styles.navIcon}>{icon}</span>
                {/* FIX: Wrap label in a span with .navLinkLabel so CSS can
                    hide it independently when the sidebar is collapsed */}
                <span className={styles.navLinkLabel}>{label}</span>
              </Link>
            );
          })}
        </nav>

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