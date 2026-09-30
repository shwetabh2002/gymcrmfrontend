"use client";

import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import styles from "./page.module.css";
import { MARKETING_LINKS } from "@/lib/marketing-links";
import ProductPreview from "./ProductPreview";

const PILLARS = [
  {
    title: "Renewals don’t ghost you",
    body: "Expiry queue shows who is due, who promised, and who vanished — so your desk calls the right person first.",
  },
  {
    title: "Money with a name on it",
    body: "Cash, UPI, card. Every payment linked to a member and the staffer who took it. Dues stay visible until cleared.",
  },
  {
    title: "Staff that can’t break the books",
    body: "Trainers sell. Desk collects. Owners see all. Permissions keep curiosity out of your ledger.",
  },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

export default function HomePage() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.16]);

  const enter = (delay = 0) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, delay, ease },
        };

  const inView = (delay = 0) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 40 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.28 },
          transition: { duration: 0.8, delay, ease },
        };

  return (
    <main className={styles.page}>
      {/* 1 — Split hero: brand stage + image (no text-on-photo fight) */}
      <section className={styles.hero} ref={heroRef} aria-label="GymFlow">
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

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <motion.p className={styles.heroKicker} {...enter(0.08)}>
              Membership software for serious gyms
            </motion.p>
            <motion.h1 className={styles.heroBrand} {...enter(0.15)}>
              Gym<span className={styles.heroBrandAccent}>Flow</span>
            </motion.h1>
            <motion.p className={styles.heroPromise} {...enter(0.24)}>
              Renewals collected before they slip. Payments, follow-ups, and
              staff — one workspace for the whole floor.
            </motion.p>
            <motion.div className={styles.heroActions} {...enter(0.32)}>
              <Link href={MARKETING_LINKS.signup} className={styles.btnSolidLg}>
                Create your gym
              </Link>
              <Link href={MARKETING_LINKS.login} className={styles.btnQuietLight}>
                I already have an account
              </Link>
            </motion.div>
            <motion.a
              href="#desk"
              className={styles.scrollHint}
              {...enter(0.42)}
            >
              <span className={styles.scrollLine} />
              See the desk
            </motion.a>
          </div>

          <div className={styles.heroVisual} aria-hidden>
            <motion.div
              className={styles.heroPhoto}
              style={reduce ? undefined : { y: photoY, scale: photoScale }}
            />
            <div className={styles.heroVisualShade} />
          </div>
        </div>
      </section>

      {/* 2 — Product money shot */}
      <section
        className={styles.product}
        id="desk"
        aria-labelledby="product-title"
      >
        <motion.div className={styles.productIntro} {...inView(0)}>
          <p className={styles.sectionLabel}>The desk</p>
          <h2 id="product-title" className={styles.productTitle}>
            This is what close of day should look like.
          </h2>
          <p className={styles.productLead}>
            Expiry follow-ups, dues, and who’s next — without opening five
            chats and a spreadsheet.
          </p>
        </motion.div>
        <motion.div
          className={styles.productStage}
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, y: 64, rotateX: 8 },
                whileInView: { opacity: 1, y: 0, rotateX: 0 },
                viewport: { once: true, amount: 0.25 },
                transition: { duration: 1, ease },
              })}
        >
          <ProductPreview />
        </motion.div>
      </section>

      {/* 3 — Emotional statement */}
      <section className={styles.statement} aria-labelledby="statement-title">
        <motion.h2
          id="statement-title"
          className={styles.statementText}
          {...inView(0)}
        >
          Stop losing members
          <br />
          <em>in the noise.</em>
        </motion.h2>
      </section>

      {/* 4 — Pillars with weight */}
      <section className={styles.pillars} aria-labelledby="pillars-title">
        <motion.div className={styles.pillarsHead} {...inView(0)}>
          <p className={styles.sectionLabel}>Everyday ops</p>
          <h2 id="pillars-title" className={styles.pillarsTitle}>
            Three jobs your team already does — finally in one place.
          </h2>
        </motion.div>
        <div className={styles.pillarGrid}>
          {PILLARS.map((p, i) => (
            <motion.article
              key={p.title}
              className={styles.pillar}
              {...inView(0.1 * i)}
            >
              <span className={styles.pillarN}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={styles.pillarTitle}>{p.title}</h3>
              <p className={styles.pillarBody}>{p.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* 5 — India / reality */}
      <section className={styles.reality} aria-labelledby="reality-title">
        <div className={styles.realityMedia} aria-hidden>
          <div className={styles.realityPhoto} />
          <div className={styles.realityScrim} />
        </div>
        <motion.div className={styles.realityCopy} {...inView(0)}>
          <p className={styles.sectionLabelOnDark}>Built for India</p>
          <h2 id="reality-title" className={styles.realityTitle}>
            UPI, GST, multi-branch —
            <span> without bolting on five tools.</span>
          </h2>
        </motion.div>
      </section>

      {/* 6 — Close */}
      <section className={styles.finale} aria-labelledby="finale-title">
        <motion.div className={styles.finaleInner} {...inView(0)}>
          <h2 id="finale-title" className={styles.finaleTitle}>
            Your gym online before the evening rush.
          </h2>
          <p className={styles.finaleBody}>
            Start free. Invite staff when the floor is ready.
          </p>
          <div className={styles.finaleActions}>
            <Link href={MARKETING_LINKS.signup} className={styles.btnSolidLg}>
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
