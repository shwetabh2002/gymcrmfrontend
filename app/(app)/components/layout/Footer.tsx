import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <span className={styles.left}>
        © {year} Dalyfstyle Fitness. All rights reserved.
      </span>
      <span className={styles.right}>
        <span>v2.4.1</span>
        <span className={styles.divider} />
        <span>admin panel</span>
      </span>
    </footer>
  );
}