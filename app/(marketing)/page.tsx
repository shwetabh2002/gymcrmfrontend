import Link from "next/link";
import styles from "./page.module.css";
import { MARKETING_LINKS } from "@/lib/marketing-links";

const FEATURES = [
  {
    title: "Renewal queue",
    body: "See who’s expiring, who promised to renew, and who went quiet — before revenue slips.",
  },
  {
    title: "Payments & dues",
    body: "Cash, UPI, or card, with a clear trail of who collected and what’s still owed.",
  },
  {
    title: "Staff access",
    body: "Give trainers and sales only the screens they need. You keep the keys.",
  },
] as const;

export default function HomePage() {
  return (
    <main className={styles.page}>
      {/* ── First viewport: one composition ── */}
      <section className={styles.hero} aria-label="GymFlow">
        <div className={styles.heroMedia} aria-hidden>
          <div className={styles.heroImage} />
          <div className={styles.heroShade} />
          <div className={styles.heroGrain} />
        </div>

        <header className={styles.nav}>
          <Link className={styles.brand} href={MARKETING_LINKS.home}>
            GymFlow
          </Link>
          <div className={styles.navActions}>
            <Link className={styles.navGhost} href={MARKETING_LINKS.login}>
              Staff login
            </Link>
            <Link className={styles.navCta} href={MARKETING_LINKS.signup}>
              Start free
            </Link>
          </div>
        </header>

        <div className={styles.heroCopy}>
          <h1 className={styles.logoMark}>GymFlow</h1>
          <p className={styles.lede}>
            Collect renewals before they slip. Payments, follow-ups, and staff
            — one gym, one workspace.
          </p>
          <div className={styles.ctaRow}>
            <Link className={styles.ctaPrimary} href={MARKETING_LINKS.signup}>
              Create your gym
            </Link>
            <Link className={styles.ctaSecondary} href={MARKETING_LINKS.login}>
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Below fold: one job per section ── */}
      <section className={styles.pitch} aria-labelledby="pitch-heading">
        <p className={styles.pitchEyebrow}>Built for the desk</p>
        <h2 id="pitch-heading" className={styles.pitchTitle}>
          The day-to-day of a busy gym, without the spreadsheet mess.
        </h2>
        <p className={styles.pitchBody}>
          Front desk staff open one workspace. Members, dues, and renewals stay
          in sync — so you spend less time chasing and more time coaching.
        </p>
      </section>

      <section className={styles.features} aria-label="What you get">
        {FEATURES.map((f) => (
          <article key={f.title} className={styles.feature}>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureBody}>{f.body}</p>
          </article>
        ))}
      </section>

      <section className={styles.closing} aria-labelledby="closing-heading">
        <h2 id="closing-heading" className={styles.closingTitle}>
          Start free. Bring your gym online today.
        </h2>
        <p className={styles.closingBody}>
          Set up in minutes. Invite staff when you’re ready.
        </p>
        <Link className={styles.ctaPrimary} href={MARKETING_LINKS.signup}>
          Create your gym
        </Link>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>GymFlow</span>
        <div className={styles.footerLinks}>
          <Link href={MARKETING_LINKS.login}>Staff login</Link>
          <Link href={MARKETING_LINKS.signup}>Start free</Link>
        </div>
      </footer>
    </main>
  );
}
