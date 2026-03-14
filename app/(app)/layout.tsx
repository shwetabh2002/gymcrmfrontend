"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

import Sidebar from "../(app)/components/layout/Sidebar";
import Header  from "../(app)/components/layout/Header";
import Footer  from "../(app)/components/layout/Footer";
import styles  from "./AppLayout.module.css";

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
        <div className={styles.content}>
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}