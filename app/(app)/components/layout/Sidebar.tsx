"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const NAV = [
  { href: "/dashboard",         label: "Dashboard",         icon: "⊞" },
  { href: "/users",             label: "Users",             icon: "◎" },
  { href: "/plans",             label: "Subscription Plan", icon: "◈" },
  { href: "/payments",          label: "Payments",          icon: "◇" },
  { href: "/invoices",          label: "Invoices",          icon: "▤" },
  { href: "/profile",           label: "Profile",           icon: "◉" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}>
            <span>GA</span>
          </div>
          <div>
            <div className={styles.brandName}>Gym Admin</div>
            <div className={styles.brandSub}>Control Panel</div>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className={styles.navSection}>
        <span className={styles.navLabel}>Navigation</span>
      </div>

      {/* Nav links */}
      <nav className={styles.nav}>
        {NAV.map(({ href, label, icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={styles.sidebarFooter}>
        <div className={styles.userRow}>
          <div className={styles.avatar}>A</div>
          <div>
            <div className={styles.userName}>Admin</div>
            <div className={styles.userRole}>Super Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}