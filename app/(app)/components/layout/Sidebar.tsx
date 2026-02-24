"use client";

import Link from "next/link";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Gym Admin</div>

      <nav className={styles.nav}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/users">Users</Link>
        <Link href="/plans">Subscription Plan</Link>
        <Link href="/payments">Payments</Link>
        <Link href="/invoices">Invoices</Link>
        <Link href="/profile">Profile</Link>
      </nav>
    </aside>
  );
}