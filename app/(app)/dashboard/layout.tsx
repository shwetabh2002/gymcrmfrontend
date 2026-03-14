import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrapper}>
      {/* Page Header */}
    
      {/* Page Content */}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}