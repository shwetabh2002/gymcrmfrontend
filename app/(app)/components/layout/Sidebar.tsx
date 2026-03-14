"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import styles from "./Sidebar.module.css";

const NAV = [
  { href: "/dashboard",     label: "Dashboard",         icon: "⊞" },
  { href: "/users",         label: "Members",            icon: "◎" },
  { href: "/subscriptions", label: "Subscriptions",      icon: "◈" },
  { href: "/plans",         label: "Plans",              icon: "◇" },
  { href: "/payments",      label: "Payments",           icon: "▤" },
  { href: "/invoices",      label: "Invoices",           icon: "▣" },
  { href: "/profile",       label: "Profile",            icon: "◉" },
];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}><span>GA</span></div>
          <div>
            <div className={styles.brandName}>Gym Admin</div>
            <div className={styles.brandSub}>Control Panel</div>
          </div>
        </div>
      </div>

      <div className={styles.navSection}>
        <span className={styles.navLabel}>Navigation</span>
      </div>

      <nav className={styles.nav}>
        {NAV.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`${styles.navLink} ${isActive ? styles.active : ""}`}>
              <span className={styles.navIcon}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.userRow}>
          <div className={styles.avatar}>{user?.name ? initials(user.name) : "A"}</div>
          <div>
            <div className={styles.userName}>{user?.name ?? "Admin"}</div>
            <div className={styles.userRole}>{user?.role ?? "ADMIN"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}