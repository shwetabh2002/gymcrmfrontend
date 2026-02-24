"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./Header.module.css";
import { adminLogout } from "@/services/admin/admin.api";

export default function Header() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await adminLogout();
      logout();
        router.replace("/login"); 
    } catch (error) {
      console.error(error);
    } finally {
      
    }
  };

  return (
    <header className={styles.header}>
      <div>Admin Panel</div>
      <button onClick={handleLogout} className={styles.logoutBtn}>
        Logout
      </button>
    </header>
  );
}