import styles from "./ProductPreview.module.css";

/** Static visual of the CRM — proof, not a live app. */
export default function ProductPreview() {
  return (
    <div className={styles.shell} aria-hidden>
      <aside className={styles.side}>
        <div className={styles.sideBrand}>GymFlow</div>
        <div className={styles.sideItem}>Dashboard</div>
        <div className={`${styles.sideItem} ${styles.sideActive}`}>
          Expiry follow-ups
        </div>
        <div className={styles.sideItem}>Members</div>
        <div className={styles.sideItem}>Payments</div>
        <div className={styles.sideItem}>Dues</div>
        <div className={styles.sideFoot}>Iron Temple · ADMIN</div>
      </aside>
      <div className={styles.main}>
        <div className={styles.top}>
          <div>
            <div className={styles.h}>Expiry follow-ups</div>
            <div className={styles.sub}>This week · 12 members</div>
          </div>
          <div className={styles.chip}>Systems operational</div>
        </div>
        <div className={styles.stats}>
          <div>
            <span>Expiring</span>
            <strong>12</strong>
          </div>
          <div>
            <span>Promised</span>
            <strong>5</strong>
          </div>
          <div>
            <span>At risk</span>
            <strong>3</strong>
          </div>
        </div>
        <div className={styles.table}>
          <div className={styles.trHead}>
            <span>Member</span>
            <span>Expires</span>
            <span>Status</span>
            <span>Due</span>
          </div>
          {[
            ["Aarav Mehta", "2 days", "Promised", "₹0"],
            ["Priya Shah", "4 days", "Follow up", "₹2,400"],
            ["Rohan Kulkarni", "Today", "At risk", "₹4,999"],
            ["Neha Iyer", "6 days", "Contacted", "₹0"],
          ].map((row) => (
            <div key={row[0]} className={styles.tr}>
              <span>{row[0]}</span>
              <span>{row[1]}</span>
              <span className={styles.tag}>{row[2]}</span>
              <span>{row[3]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
