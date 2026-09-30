"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./page.module.css";
import { MARKETING_LINKS } from "@/lib/marketing-links";

/**
 * GymFlow marketing home
 * ──────────────────────
 * Audience: gym owners / front-desk leads who need renewals + dues under control.
 * First viewport job: brand recognition + one promise + clear signup/login.
 * Below fold: prove the daily ops story, then ask again.
 */

const PILLARS = [
  {
    title: "Catch renewals early",
    body: "See who expires this week, who said they’d renew, and who went quiet — before the month closes.",
  },
  {
    title: "Know every rupee",
    body: "Cash, UPI, or card. Each payment tied to a member and the staffer who took it, with dues you can chase.",
  },
  {
    title: "Staff without chaos",
    body: "Trainers sell. Desk collects. You see everything. Permissions keep the books clean.",
  },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

export default function HomePage() {
  const reduce = useReducedMotion();

  const enter = (delay = 0) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.75, delay, ease },
        };

  const inView = (delay = 0) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 28 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.35 },
          transition: { duration: 0.7, delay, ease },
        };

  return (
    <main className={styles.page}>
      {/* ── Viewport 1: one composition ── */}
      <section className={styles.hero}>
        <div className={styles.heroStage} aria-hidden>
          <div className={styles.heroPhoto} />
          <div className={styles.heroScrim} />
        </div>

        <motion.header className={styles.nav} {...enter(0)}>
          <Link href={MARKETING_LINKS.home} className={styles.navBrand}>
            GymFlow
          </Link>
          <nav className={styles.navRight} aria-label="Account">
            <Link href={MARKETING_LINKS.login} className={styles.navLink}>
              Staff login
            </Link>
            <Link href={MARKETING_LINKS.signup} className={styles.btnSolid}>
              Start free
            </Link>
          </nav>
        </motion.header>

        <div className={styles.heroContent}>
          <motion.p className={styles.heroKicker} {...enter(0.08)}>
            For gym owners who hate chasing renewals
          </motion.p>
          <motion.h1 className={styles.heroBrand} {...enter(0.14)}>
            GymFlow
          </motion.h1>
          <motion.p className={styles.heroPromise} {...enter(0.22)}>
            Collect renewals before they slip. Track payments, follow-ups, and
            staff — one gym, one workspace.
          </motion.p>
          <motion.div className={styles.heroActions} {...enter(0.3)}>
            <Link href={MARKETING_LINKS.signup} className={styles.btnSolid}>
              Create your gym
            </Link>
            <Link href={MARKETING_LINKS.login} className={styles.btnQuiet}>
              I already have an account
            </Link>
          </motion.div>
        </div>

        <motion.div className={styles.scrollHint} {...enter(0.45)} aria-hidden>
          <span />
          Scroll
        </motion.div>
      </section>

      {/* ── Why it exists ── */}
      <section className={styles.why} aria-labelledby="why-title">
        <motion.div className={styles.whyInner} {...inView(0)}>
          <p className={styles.sectionLabel}>Why GymFlow</p>
          <h2 id="why-title" className={styles.whyTitle}>
            The front desk should feel calm at close of day.
          </h2>
          <p className={styles.whyBody}>
            Spreadsheets miss renewals. Chat threads lose who paid. GymFlow
            keeps members, money, and follow-ups in one place so your team
            finishes the shift knowing what’s done.
          </p>
        </motion.div>
      </section>

      {/* ── Visual story ── */}
      <section className={styles.story} aria-labelledby="story-title">
        <motion.div className={styles.storyCopy} {...inView(0)}>
          <p className={styles.sectionLabel}>On the floor</p>
          <h2 id="story-title" className={styles.storyTitle}>
            Built for how Indian gyms actually run.
          </h2>
          <p className={styles.storyBody}>
            UPI and cash in the same ledger. GST-ready invoices. Multiple
            branches when you grow. Permissions so trainers only see what they
            need.
          </p>
        </motion.div>
        <motion.figure className={styles.storyFigure} {...inView(0.1)}>
          <div className={styles.storyPhoto} role="img" aria-label="Gym training floor" />
        </motion.figure>
      </section>

      {/* ── Three pillars ── */}
      <section className={styles.pillars} aria-labelledby="pillars-title">
        <motion.div className={styles.pillarsHead} {...inView(0)}>
          <p className={styles.sectionLabel}>What you get</p>
          <h2 id="pillars-title" className={styles.pillarsTitle}>
            Three things your desk does every day.
          </h2>
        </motion.div>
        <ul className={styles.pillarList}>
          {PILLARS.map((item, i) => (
            <motion.li key={item.title} className={styles.pillar} {...inView(0.08 * (i + 1))}>
              <span className={styles.pillarIndex}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={styles.pillarTitle}>{item.title}</h3>
              <p className={styles.pillarBody}>{item.body}</p>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* ── Final ask ── */}
      <section className={styles.finale} aria-labelledby="finale-title">
        <motion.div className={styles.finaleInner} {...inView(0)}>
          <h2 id="finale-title" className={styles.finaleTitle}>
            Open your gym workspace today.
          </h2>
          <p className={styles.finaleBody}>
            Free to start. Add staff when the floor is ready.
          </p>
          <div className={styles.finaleActions}>
            <Link href={MARKETING_LINKS.signup} className={styles.btnSolid}>
              Create your gym
            </Link>
            <Link href={MARKETING_LINKS.login} className={styles.btnOnDark}>
              Staff login
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className={styles.footer}>
        <Link href={MARKETING_LINKS.home} className={styles.footerBrand}>
          GymFlow
        </Link>
        <p className={styles.footerMeta}>Membership software for gyms</p>
        <div className={styles.footerNav}>
          <Link href={MARKETING_LINKS.login}>Staff login</Link>
          <Link href={MARKETING_LINKS.signup}>Start free</Link>
        </div>
      </footer>
    </main>
  );
}
