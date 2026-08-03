"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { canAccessRoute, getDefaultRoute } from "@/lib/rbac";

import Sidebar from "../(app)/components/layout/Sidebar";
import Header  from "../(app)/components/layout/Header";
import Footer  from "../(app)/components/layout/Footer";
import styles  from "./AppLayout.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!loading && isAuthenticated && user?.role) {
      // SUPER_ADMIN must pick a gym before using tenant screens
      if (
        user.role === "SUPER_ADMIN" &&
        !user.companyId &&
        pathname !== "/companies" &&
        !pathname.startsWith("/companies")
      ) {
        router.replace("/companies");
        return;
      }
      if (!canAccessRoute(user.role, pathname, user.permissions)) {
        router.replace(
          getDefaultRoute(user.role, user.permissions, user.companyId),
        );
      }
    }
  }, [
    isAuthenticated,
    loading,
    router,
    user?.role,
    user?.permissions,
    user?.companyId,
    pathname,
  ]);

  if (loading || !isAuthenticated) return null;
  if (user?.role && !canAccessRoute(user.role, pathname, user.permissions)) return null;

  return (
    <div className={styles.wrapper}>
      <Sidebar />

      <div className={styles.main}>
        <Header />
        <div className={styles.content}>
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}
