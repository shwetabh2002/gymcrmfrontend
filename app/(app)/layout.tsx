"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

import Sidebar from "../(app)/components/layout/Sidebar";
import Header  from "../(app)/components/layout/Header";
import Footer  from "../(app)/components/layout/Footer";
import styles  from "./AppLayout.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Sidebar state lives here so both Header and Sidebar can share it
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <div className={styles.wrapper}>
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />

      <div className={styles.main}>
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        <div className={styles.content}>
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}