// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/lib/context/AuthContext";
// import { adminLogin } from "@/services/admin/admin.api";
// import { motion, AnimatePresence, Variants, Easing } from "framer-motion";
// import styles from "./LoginPage.module.css";

// /* ─── Framer Motion variants ──────────────────────────────── */
// // custom cubic‑bezier easing; cast to satisfy framer-motion's typings
// const customEase: Easing = [0.16, 1, 0.3, 1] as any;

// const cardVariants: Variants = {
//   hidden:  { opacity: 0, y: 24 },
//   visible: {
//     opacity: 1, y: 0,
//     transition: { duration: 0.55, ease: customEase },
//   },
// };

// const stagger: Variants = {
//   visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
// };

// const item: Variants = {
//   hidden:  { opacity: 0, y: 12 },
//   visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: customEase } },
// };

// const errorVariants: Variants = {
//   hidden:  { opacity: 0, y: -6, scale: 0.98 },
//   visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.25 } },
//   exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
// };

// /* ─── Geo grid dots for left panel ───────────────────────── */
// const GeoDots = () => (
//   <div className={styles.geoGrid}>
//     {Array.from({ length: 30 }).map((_, i) => (
//       <div key={i} className={styles.geoCell} />
//     ))}
//   </div>
// );

// /* ─── Main component ──────────────────────────────────────── */
// export default function LoginPage() {
//   const router   = useRouter();
//   const { login } = useAuth();

//   const [email,    setEmail]    = useState("");
//   const [password, setPassword] = useState("");
//   const [error,    setError]    = useState("");
//   const [loading,  setLoading]  = useState(false);

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const data = await adminLogin({ email, password });

//       const accessToken = data?.tokens?.accessToken;
//       if (!accessToken) throw new Error("Access token missing");

//       login(data.tokens.accessToken, data.tokens.refreshToken);
//       router.replace("/dashboard");
//     } catch (err: any) {
//       setError(
//         err.response?.data?.message ||
//         err.message ||
//         "Login failed. Please check your credentials."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className={styles.root}>

//       {/* ── Left visual panel ──────────────────────────── */}
//       <div className={styles.visual}>
//         <div className={styles.visualBg} />
//         <div className={styles.scanlines} />
//         <div className={styles.glow} />

//         <div className={styles.visualTop}>
//           <span className={styles.brandName}>
//             <span className={styles.brandDot} />
//             Control Centre
//           </span>
//         </div>

//         <div className={styles.visualCenter}>
//           <h2 className={styles.visualHeadline}>
//             Secure<br />
//             <em>Admin</em><br />
//             Access
//           </h2>
//           <p className={styles.visualSub}>
//             // restricted — authorized use only
//           </p>
//         </div>

//         <GeoDots />
//       </div>

//       {/* ── Right form panel ───────────────────────────── */}
//       <div className={styles.formPanel}>
//         <motion.div
//           className={styles.formInner}
//           variants={cardVariants}
//           initial="hidden"
//           animate="visible"
//         >
//           <motion.div
//             className={styles.formHeader}
//             variants={stagger}
//             initial="hidden"
//             animate="visible"
//           >
//             <motion.p className={styles.tagline} variants={item}>
//               Admin Portal
//             </motion.p>
//             <motion.h1 className={styles.formTitle} variants={item}>
//               Sign in to your<br />workspace
//             </motion.h1>
//             <motion.p className={styles.formDesc} variants={item}>
//               Enter your credentials to access the dashboard.
//             </motion.p>
//           </motion.div>

//           {/* Error */}
//           <AnimatePresence mode="wait">
//             {error && (
//               <motion.div
//                 key="error"
//                 className={styles.errorBox}
//                 variants={errorVariants}
//                 initial="hidden"
//                 animate="visible"
//                 exit="exit"
//               >
//                 <span className={styles.errorIcon}>ERR</span>
//                 <p className={styles.errorMsg}>{error}</p>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Form */}
//           <motion.form
//             onSubmit={handleLogin}
//             variants={stagger}
//             initial="hidden"
//             animate="visible"
//           >
//             <div className={styles.fields}>
//               <motion.div className={styles.field} variants={item}>
//                 <label className={styles.fieldLabel} htmlFor="email">
//                   Email address
//                 </label>
//                 <div className={styles.inputWrap}>
//                   <input
//                     id="email"
//                     type="email"
//                     placeholder="you@company.com"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className={styles.input}
//                     autoComplete="email"
//                     required
//                   />
//                 </div>
//               </motion.div>

//               <motion.div className={styles.field} variants={item}>
//                 <label className={styles.fieldLabel} htmlFor="password">
//                   Password
//                 </label>
//                 <div className={styles.inputWrap}>
//                   <input
//                     id="password"
//                     type="password"
//                     placeholder="••••••••••••"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className={styles.input}
//                     autoComplete="current-password"
//                     required
//                   />
//                 </div>
//               </motion.div>
//             </div>

//             <motion.button
//               type="submit"
//               disabled={loading}
//               className={styles.btn}
//               variants={item}
//               whileTap={!loading ? { scale: 0.98 } : {}}
//             >
//               <span className={styles.btnInner}>
//                 {loading ? (
//                   <>
//                     <span className={styles.spinner} />
//                     Authenticating…
//                   </>
//                 ) : (
//                   "Sign In"
//                 )}
//               </span>
//             </motion.button>
//           </motion.form>

//           {/* Footer */}
//           <div className={styles.meta}>
//             <span className={styles.metaLeft}>v2.4.1 · admin</span>
//             <span className={styles.metaStatus}>
//               <span className={styles.statusDot} />
//               Systems operational
//             </span>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// }



"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { motion, AnimatePresence, Variants, Easing } from "framer-motion";
import styles from "./LoginPage.module.css";

/* ─── Framer Motion variants ──────────────────────────────── */
const customEase: Easing = [0.16, 1, 0.3, 1] as any;

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

  /* ─── TEMP CLIENT-SIDE LOGIN ─────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const demoEmail = "admin@gymcrm.com";
      const demoPassword = "admin123";

      if (email === demoEmail && password === demoPassword) {
        // Fake tokens
        const fakeAccessToken = "test-access-token-123";
        const fakeRefreshToken = "test-refresh-token-456";

        login(fakeAccessToken, fakeRefreshToken);

        router.replace("/dashboard");
      } else {
        setError("Invalid email or password.");
      }

      setLoading(false);
    }, 1000);
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
            Control Centre
          </span>
        </div>

        <div className={styles.visualCenter}>
          <h2 className={styles.visualHeadline}>
            Secure<br />
            <em>Admin</em><br />
            Access
          </h2>
          <p className={styles.visualSub}>
            // restricted — authorized use only
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
              Admin Portal
            </motion.p>
            <motion.h1 className={styles.formTitle} variants={item}>
              Sign in to your<br />workspace
            </motion.h1>
            <motion.p className={styles.formDesc} variants={item}>
              Enter your credentials to access the dashboard.
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
                    placeholder="admin@gymcrm.com"
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
                    placeholder="admin123"
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