"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./page.module.css";
import { MARKETING_LINKS } from "@/lib/marketing-links";

const FEATURES = [
  {
    n: "01",
    title: "Renewal radar",
    body: "Who’s expiring this week, who promised to come back, who went silent — on one screen before the month slips.",
  },
  {
    n: "02",
    title: "Payments that stick",
    body: "Cash, UPI, card. Every rupee tagged to a member and a staffer, with dues you can actually chase.",
  },
  {
    n: "03",
    title: "Staff, on a leash",
    body: "Trainers sell. Front desk collects. Owners see everything. Permissions keep the chaos out of your books.",
  },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

export default function HomePage() {
  const reduce = useReducedMotion();

  const rise = (delay = 0) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, delay, ease },
        };

  const reveal = (delay = 0) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 36 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-12% 0px" },
          transition: { duration: 0.8, delay, ease },
        };

  return (
    <main className={styles.page}>
      {/* ── First viewport: brand + line + CTAs + full-bleed media ── */}
      <section className={styles.hero} aria-label="GymFlow">
        <div className={styles.heroMedia} aria-hidden>
          <div className={styles.heroImage} />
          <div className={styles.heroShade} />
          <div className={styles.heroVignette} />
          <div className={styles.heroGrain} />
          <div className={styles.heroRule} />
        </div>

        <motion.header className={styles.nav} {...rise(0)}>
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
        </motion.header>

        <div className={styles.heroBottom}>
          <motion.div className={styles.heroCopy} {...rise(0.12)}>
            <h1 className={styles.logoMark}>
              <span className={styles.logoWord}>Gym</span>
              <span className={styles.logoWordAccent}>Flow</span>
            </h1>
            <p className={styles.lede}>
              Renewals collected before they slip. Payments, follow-ups, and
              staff — one gym, one workspace.
            </p>
            <div className={styles.ctaRow}>
              <Link className={styles.ctaPrimary} href={MARKETING_LINKS.signup}>
                Create your gym
              </Link>
              <Link className={styles.ctaSecondary} href={MARKETING_LINKS.login}>
                I already have an account
              </Link>
            </div>
          </motion.div>

          <motion.p className={styles.heroAside} {...rise(0.28)} aria-hidden>
            Membership OS
            <br />
            for real gyms
          </motion.p>
        </div>
      </section>

      {/* ── Split: product truth + photo ── */}
      <section className={styles.split} aria-labelledby="split-heading">
        <motion.div className={styles.splitCopy} {...reveal(0)}>
          <p className={styles.eyebrow}>Front desk, finally quiet</p>
          <h2 id="split-heading" className={styles.splitTitle}>
            Run the floor like you run the lifts — deliberate, logged, done.
          </h2>
          <p className={styles.splitBody}>
            Spreadsheets lose renewals. WhatsApp threads lose who paid. GymFlow
            keeps members, dues, and staff action in one place so the shift
            ends clean.
          </p>
        </motion.div>
        <motion.div
          className={styles.splitMedia}
          aria-hidden
          {...reveal(0.12)}
        >
          <div className={styles.splitImage} />
          <div className={styles.splitFrame} />
        </motion.div>
      </section>

      {/* ── Features: large editorial rhythm ── */}
      <section className={styles.features} aria-label="What you get">
        <motion.div className={styles.featuresHead} {...reveal(0)}>
          <p className={styles.eyebrow}>What stays on the desk</p>
          <h2 className={styles.featuresTitle}>Three jobs. No fluff.</h2>
        </motion.div>
        <ol className={styles.featureList}>
          {FEATURES.map((f, i) => (
            <motion.li
              key={f.n}
              className={styles.featureRow}
              {...reveal(0.08 * i)}
            >
              <span className={styles.featureN}>{f.n}</span>
              <div className={styles.featureText}>
                <h3 className={styles.featureName}>{f.title}</h3>
                <p className={styles.featureBody}>{f.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* ── Atmosphere band ── */}
      <section className={styles.band} aria-labelledby="band-heading">
        <div className={styles.bandMedia} aria-hidden>
          <div className={styles.bandImage} />
          <div className={styles.bandShade} />
        </div>
        <motion.div className={styles.bandCopy} {...reveal(0)}>
          <h2 id="band-heading" className={styles.bandTitle}>
            Built for India gym ops —
            <span> UPI, GST, multi-branch when you grow.</span>
          </h2>
        </motion.div>
      </section>

      {/* ── Close ── */}
      <section className={styles.closing} aria-labelledby="closing-heading">
        <motion.div {...reveal(0)}>
          <h2 id="closing-heading" className={styles.closingTitle}>
            Your gym. Online before the next rush.
          </h2>
          <p className={styles.closingBody}>
            Free to start. Invite staff when the floor is ready.
          </p>
          <div className={styles.closingActions}>
            <Link className={styles.ctaPrimaryDark} href={MARKETING_LINKS.signup}>
              Create your gym
            </Link>
            <Link className={styles.ctaGhostDark} href={MARKETING_LINKS.login}>
              Staff login
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.footerBrand} href={MARKETING_LINKS.home}>
          GymFlow
        </Link>
        <p className={styles.footerTag}>Membership software for gyms</p>
        <div className={styles.footerLinks}>
          <Link href={MARKETING_LINKS.login}>Staff login</Link>
          <Link href={MARKETING_LINKS.signup}>Start free</Link>
        </div>
      </footer>
    </main>
  );
}
