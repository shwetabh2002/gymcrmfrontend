"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { adminLogin } from "@/services/admin/admin.api";
import { motion, AnimatePresence, Variants, Easing } from "framer-motion";
import { getDefaultRoute } from "@/lib/rbac";
import styles from "./LoginPage.module.css";
import { EASE_OUT_EXPO } from "@/config/motion";

/* ─── Framer Motion variants ──────────────────────────────── */
// custom cubic‑bezier easing; cast to satisfy framer-motion's typings
const customEase: Easing = EASE_OUT_EXPO;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: customEase },
  },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: customEase },
  },
};

const errorVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};

/* ─── Geo grid dots for left panel ───────────────────────── */
const GeoDots = () => (
  <div className={styles.geoGrid}>
    {Array.from({ length: 30 }).map((_, i) => (
      <div key={i} className={styles.geoCell} />
    ))}
  </div>
);

/* ─── Main component ──────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await adminLogin({ email, password });

      const accessToken = data?.tokens?.accessToken;
      if (!accessToken) throw new Error("Access token missing");

      login(data.tokens.accessToken, data.tokens.refreshToken, data.user);
      router.replace(
        getDefaultRoute(
          data.user.role,
          data.user.permissions,
          data.user.companyId,
        ),
      );
    } catch (err: any) {
      const status = err.response?.status;
      const raw = err.response?.data?.message;
      const apiMessage = Array.isArray(raw) ? raw.join(", ") : raw;

      if (!err.response) {
        setError(
          "Cannot reach the server. Check that the API is running and try again.",
        );
      } else if (status === 401) {
        setError(
          apiMessage === "Invalid credentials"
            ? "Invalid email or password. User not found or wrong password."
            : apiMessage || "Invalid email or password.",
        );
      } else if (status === 429) {
        setError("Too many login attempts. Wait a moment and try again.");
      } else {
        setError(
          apiMessage || err.message || "Login failed. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* ── Left visual panel ──────────────────────────── */}
      <div className={styles.visual}>
        <div className={styles.visualBg} />
        <div className={styles.scanlines} />
        <div className={styles.glow} />

        <div className={styles.visualTop}>
          <span className={styles.brandName}>
            <span className={styles.brandDot} />
            GymFlow
          </span>
        </div>

        <div className={styles.visualCenter}>
          <p className={styles.tagline} style={{ color: "var(--lime)", marginBottom: 20 }}>
            Gym operations OS
          </p>
          <h2 className={styles.visualHeadline}>
            Run your gym,
            <br />
            <em>without</em> the busywork.
          </h2>
          <p className={styles.visualSub}>
            Members, dues, renewals, and invoices — one calm workspace for the
            whole floor.
          </p>
        </div>

        <GeoDots />
      </div>

      {/* ── Right form panel ───────────────────────────── */}
      <div className={styles.formPanel}>
        <motion.div
          className={styles.formInner}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className={styles.formHeader}
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.p className={styles.tagline} variants={item}>
              Welcome back
            </motion.p>
            <motion.h1 className={styles.formTitle} variants={item}>
              Your gym, in focus.
            </motion.h1>
            <motion.p className={styles.formDesc} variants={item}>
              Sign in to continue to your GymFlow workspace.
            </motion.p>
          </motion.div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                className={styles.errorBox}
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <span className={styles.errorIcon}>ERR</span>
                <p className={styles.errorMsg}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form
            onSubmit={handleLogin}
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <div className={styles.fields}>
              <motion.div className={styles.field} variants={item}>
                <label className={styles.fieldLabel} htmlFor="email">
                  Email address
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    autoComplete="email"
                    required
                  />
                </div>
              </motion.div>

              <motion.div className={styles.field} variants={item}>
                <label className={styles.fieldLabel} htmlFor="password">
                  Password
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </motion.div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className={styles.btn}
              variants={item}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              <span className={styles.btnInner}>
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Authenticating…
                  </>
                ) : (
                  "Sign In"
                )}
              </span>
            </motion.button>
          </motion.form>

          {/* Footer */}
          <div className={styles.meta}>
            <span className={styles.metaLeft}>v2.4.1 · admin</span>
            <span className={styles.metaStatus}>
              <span className={styles.statusDot} />
              Systems operational
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
