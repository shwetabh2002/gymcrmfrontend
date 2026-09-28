import Link from "next/link";
import styles from "./page.module.css";
import { MARKETING_LINKS } from "@/lib/marketing-links";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.heroBg} aria-hidden />
      <div className={styles.heroNoise} aria-hidden />

      <header className={styles.nav}>
        <div className={styles.brand}>GymFlow</div>
        <div className={styles.navActions}>
          <Link className={styles.navGhost} href={MARKETING_LINKS.login}>
            Staff login
          </Link>
          <Link className={styles.navCta} href={MARKETING_LINKS.signup}>
            Start free
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>Membership software for gyms</p>
        <h1 className={styles.logoMark}>GymFlow</h1>
        <p className={styles.lede}>
          Collect renewals before they slip. Track payments, follow-ups, and
          staff actions — one gym, one workspace.
        </p>
        <div className={styles.ctaRow}>
          <Link className={styles.ctaPrimary} href={MARKETING_LINKS.signup}>
            Create your gym
          </Link>
          <Link className={styles.ctaSecondary} href={MARKETING_LINKS.login}>
            I already have an account
          </Link>
        </div>
      </section>

      <section className={styles.strip}>
        <div>
          <strong>Renewal queue</strong>
          <span>Who’s expiring, who promised, who’s lost</span>
        </div>
        <div>
          <strong>Payments + dues</strong>
          <span>Cash, UPI, card — with who collected it</span>
        </div>
        <div>
          <strong>Staff access</strong>
          <span>Trainer & sales permissions you control</span>
        </div>
      </section>
    </main>
  );
}
