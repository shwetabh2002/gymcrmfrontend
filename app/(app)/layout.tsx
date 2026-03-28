"use client";

import { useState } from "react";

import Sidebar from "../(app)/components/layout/Sidebar";
import Header  from "../(app)/components/layout/Header";
import Footer  from "../(app)/components/layout/Footer";
import styles  from "./AppLayout.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Sidebar state lives here so both Header and Sidebar can share it
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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