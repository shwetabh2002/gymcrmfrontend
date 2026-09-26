"use client";

import styles from "../profile/Profile.module.css";

type Props = {
  title: string;
  description: string;
};

/** Locked payment module — gym cannot configure until SUPER_ADMIN unlocks. */
export default function ComingSoonCard({ title, description }: Props) {
  return (
    <section className={styles.card} style={{ marginTop: 20 }}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardTitleBar} />
          {title}
        </h2>
        <span className={styles.cardBadge}>Coming soon</span>
      </div>
      <div className={styles.formGrid}>
        <div style={{ gridColumn: "1 / -1", paddingBottom: 8 }}>
          <p
            className={styles.pageDesc}
            style={{ margin: 0, padding: 0, maxWidth: 560 }}
          >
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
