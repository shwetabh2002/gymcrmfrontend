"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useBranding } from "@/lib/context/BrandingContext";
import { navItemsForRole } from "@/lib/rbac";
import LocationSwitcher from "./LocationSwitcher";
import styles from "./Sidebar.module.css";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { gymName, logoUrl } = useBranding();
  const NAV = navItemsForRole(user?.role, user?.permissions);
  const brandInitials = initials(gymName || "GA");

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandRow}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={gymName}
              className={styles.brandLogo}
            />
          ) : (
            <div className={styles.brandIcon}>
              <span>{brandInitials}</span>
            </div>
          )}
          <div>
            <div className={styles.brandName}>{gymName}</div>
            <div className={styles.brandSub}>
              {user?.role === "SUPER_ADMIN"
                ? user?.companyName
                  ? "Viewing gym"
                  : "Select a gym"
                : user?.locationName || "All locations"}
            </div>
          </div>
        </div>
      </div>

      <LocationSwitcher />

      <div className={styles.navSection}>
        <span className={styles.navLabel}>Navigation</span>
      </div>

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

      <div className={styles.sidebarFooter}>
        <div className={styles.userRow}>
          <div className={styles.avatar}>
            {user?.name ? initials(user.name) : "A"}
          </div>
          <div>
            <div className={styles.userName}>{user?.name ?? "Admin"}</div>
            <div className={styles.userRole}>{user?.role ?? "ADMIN"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
