"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import styles from "./AppLayout.module.css";

/* ─── Nav items ───────────────────────────────────────────── */
const NAV = [
  { href: "/dashboard",          label: "Dashboard",         icon: "⊞" },
  { href: "/users",              label: "Users",             icon: "◎" },
  { href: "/subscription-plan",  label: "Subscription Plan", icon: "◈" },
  { href: "/payments",           label: "Payments",          icon: "◇" },
  { href: "/invoices",           label: "Invoices",          icon: "▤" },
  { href: "/profile",            label: "Profile",           icon: "◉" },
];

/* ─── Page title map ──────────────────────────────────────── */
const PAGE_TITLES: Record<string, string> = {
  "/dashboard":         "Dashboard",
  "/users":             "Users",
  "/subscription-plan": "Subscription Plan",
  "/payments":          "Payments",
  "/invoices":          "Invoices",
  "/profile":           "Profile",
};

/* ─── Sidebar ─────────────────────────────────────────────── */
function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.sidebarBrand}>
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

      {/* Nav label */}
      <div className={styles.navSection}>
        <span className={styles.navSectionLabel}>Navigation</span>
      </div>

      {/* Nav links */}
      <nav className={styles.nav}>
        {NAV.map(({ href, label, icon }) => {
          const isActive =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
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
        <div className={styles.sidebarUser}>
          <div className={styles.avatarCircle}>A</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>Admin</div>
            <div className={styles.userRole}>Super Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─── Header ──────────────────────────────────────────────── */
function Header() {
  const { logout } = useAuth();
  const router     = useRouter();
  const pathname   = usePathname();

  const pageTitle = PAGE_TITLES[pathname] ?? "Admin Panel";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <span>Admin Panel</span>
        <span className={styles.headerSlash}>/</span>
        <span className={styles.headerPage}>{pageTitle}</span>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.headerStatus}>
          <span className={styles.statusDot} />
          Systems operational
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span>↩</span>
          Logout
        </button>
      </div>
    </header>
  );
}

/* ─── Footer ──────────────────────────────────────────────── */
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <span className={styles.footerLeft}>© {year} Gym Admin. All rights reserved.</span>
      <span className={styles.footerRight}>v2.4.1 · admin panel</span>
    </footer>
  );
}

/* ─── Layout ──────────────────────────────────────────────── */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <div className={styles.content}>{children}</div>
        <Footer />
      </div>
    </div>
  );
}