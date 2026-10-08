"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { COUNTRIES, DEFAULT_COUNTRY_CODE } from "@/lib/countries";
import { MARKETING_LINKS, signupApiUrl } from "@/lib/marketing-links";
import styles from "./signup.module.css";

type FormState = {
  gymName: string;
  phone: string;
  city: string;
  countryCode: string;
  memberIdPrefix: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

type SetupPhase = "idle" | "creating" | "opening" | "done";

const INITIAL: FormState = {
  gymName: "",
  phone: "",
  city: "",
  countryCode: DEFAULT_COUNTRY_CODE,
  memberIdPrefix: "GYM",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

const SETUP_LINES = [
  "Creating your company…",
  "Setting up admin login…",
  "Preparing your workspace…",
  "Almost ready…",
];

const SIGNUP_TIMEOUT_MS = 45_000;

function mapSignupError(err: unknown, status?: number, body?: any): string {
  const raw = Array.isArray(err)
    ? err.join(". ")
    : (err instanceof Error && err.message) ||
      (typeof err === "string" ? err : "") ||
      "";

  if (
    err instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(raw)
  ) {
    return "Can't reach the server right now. Check that the API is running, then try again.";
  }

  if (/aborted|timeout|timed out/i.test(raw)) {
    return "Setup is taking too long. Please try again — if it keeps happening, check the API is running.";
  }

  if (status === 409 || /already registered/i.test(raw)) {
    return "This email is already registered. Try logging in or use a different email.";
  }
  if (status === 429) {
    return "Too many signup attempts. Wait a minute and try again.";
  }
  if (status === 400) {
    if (Array.isArray(body?.message)) return body.message.join(". ");
    if (typeof body?.message === "string") return body.message;
    return "Please check the form fields and try again.";
  }
  if (status && status >= 500) {
    return "Something went wrong on our side. Please try again in a moment.";
  }

  if (raw && raw.length < 180 && !/^Error:?\s*$/i.test(raw)) {
    return raw;
  }
  return "Could not create your gym. Please try again.";
}

export default function SignupPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<SetupPhase>("idle");
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (phase !== "creating") return;
    setLineIdx(0);
    const id = window.setInterval(() => {
      setLineIdx((i) => (i + 1) % SETUP_LINES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [phase]);

  const onChange =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    setPhase("creating");

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), SIGNUP_TIMEOUT_MS);

    try {
      let res: Response;
      try {
        res = await fetch(signupApiUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            gymName: form.gymName.trim(),
            phone: form.phone.trim() || undefined,
            city: form.city.trim() || undefined,
            countryCode: form.countryCode || DEFAULT_COUNTRY_CODE,
            memberIdPrefix: form.memberIdPrefix.trim() || "GYM",
            adminName: form.adminName.trim(),
            adminEmail: form.adminEmail.trim().toLowerCase(),
            adminPassword: form.adminPassword,
          }),
        });
      } catch (netErr: any) {
        if (netErr?.name === "AbortError") {
          throw Object.assign(
            new Error(
              "Setup is taking too long. Please try again — if it keeps happening, check the API is running.",
            ),
            { __mapped: true },
          );
        }
        throw Object.assign(new Error(mapSignupError(netErr)), {
          __mapped: true,
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw Object.assign(
          new Error(mapSignupError(data?.message, res.status, data)),
          { __mapped: true },
        );
      }

      const accessToken = data?.tokens?.accessToken;
      const refreshToken = data?.tokens?.refreshToken;
      const user = data?.user;
      if (!accessToken || !refreshToken || !user) {
        throw new Error(
          "Signup succeeded but login tokens were missing. Try logging in manually.",
        );
      }

      setPhase("opening");
      const userParam = encodeURIComponent(JSON.stringify(user));
      window.location.href = `${MARKETING_LINKS.authCallback}#accessToken=${encodeURIComponent(
        accessToken,
      )}&refreshToken=${encodeURIComponent(
        refreshToken,
      )}&user=${userParam}`;

      window.setTimeout(() => {
        setPhase("idle");
        setLoading(false);
        setError(
          `Workspace created, but CRM didn't open. Go to ${MARKETING_LINKS.login} and sign in with your email.`,
        );
      }, 12_000);
    } catch (err: any) {
      setError(err?.__mapped ? err.message : mapSignupError(err));
      setLoading(false);
      setPhase("idle");
    } finally {
      window.clearTimeout(timer);
    }
  };

  const showOverlay = phase === "creating" || phase === "opening";

  return (
    <main className={styles.page}>
      {showOverlay && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-live="polite"
        >
          <div className={styles.overlayCard}>
            <div className={styles.spinner} aria-hidden />
            <p className={styles.overlayEyebrow}>GymFlow</p>
            <h2 className={styles.overlayTitle}>
              {phase === "opening"
                ? "Opening your CRM…"
                : "Your complete workspace is setting up"}
            </h2>
            <p className={styles.overlaySub}>
              {phase === "opening"
                ? "Hang tight — redirecting you in a moment."
                : SETUP_LINES[lineIdx]}
            </p>
            <ul className={styles.overlaySteps}>
              <li data-done={phase !== "creating" || lineIdx > 0 ? "1" : "0"}>
                Company profile
              </li>
              <li data-done={phase !== "creating" || lineIdx > 1 ? "1" : "0"}>
                Admin account
              </li>
              <li data-done={phase === "opening" || lineIdx > 2 ? "1" : "0"}>
                Workspace defaults
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className={styles.panel}>
        <div className={styles.top}>
          <Link href={MARKETING_LINKS.home} className={styles.brand}>
            GymFlow
          </Link>
          <p className={styles.eyebrow}>Self-serve setup</p>
          <h1 className={styles.title}>Open your gym workspace</h1>
          <p className={styles.sub}>
            Creates your company + admin account, then drops you into the CRM.
          </p>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <fieldset>
            <legend>Gym</legend>
            <label>
              Gym name
              <input
                required
                value={form.gymName}
                onChange={onChange("gymName")}
                placeholder="Iron House Fitness"
                disabled={loading}
              />
            </label>
            <div className={styles.row}>
              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={onChange("phone")}
                  placeholder="98765 43210"
                  disabled={loading}
                />
              </label>
              <label>
                City
                <input
                  value={form.city}
                  onChange={onChange("city")}
                  placeholder="Mumbai"
                  disabled={loading}
                />
              </label>
            </div>
            <label>
              Country & currency
              <select
                value={form.countryCode}
                onChange={onChange("countryCode")}
                required
                disabled={loading}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} — {c.currency}
                  </option>
                ))}
              </select>
              <span
                style={{
                  display: "block",
                  marginTop: 6,
                  fontSize: "0.78rem",
                  color: "rgba(16,18,20,0.55)",
                  lineHeight: 1.45,
                }}
              >
                Choose carefully. After signup this is locked — all amounts in
                your CRM use this currency. To change later, contact support.
              </span>
            </label>
            <label>
              Member ID prefix
              <input
                value={form.memberIdPrefix}
                onChange={onChange("memberIdPrefix")}
                placeholder="GYM"
                maxLength={12}
                disabled={loading}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Admin login</legend>
            <label>
              Your name
              <input
                required
                value={form.adminName}
                onChange={onChange("adminName")}
                placeholder="Asha Verma"
                disabled={loading}
              />
            </label>
            <label>
              Work email
              <input
                required
                type="email"
                value={form.adminEmail}
                onChange={onChange("adminEmail")}
                placeholder="owner@gym.com"
                autoComplete="email"
                disabled={loading}
              />
            </label>
            <label>
              Password
              <div className={styles.passwordWrap}>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  value={form.adminPassword}
                  onChange={onChange("adminPassword")}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9.3 3.1 11 7-.5 1.2-1.2 2.3-2.1 3.2M6.1 6.1C4.2 7.4 2.7 9.1 2 12c1.7 3.9 6 7 11 7 1.4 0 2.7-.2 3.9-.7"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.75"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </label>
          </fieldset>

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Creating workspace…" : "Create & open CRM"}
          </button>
        </form>

        <p className={styles.foot}>
          Already onboarded?{" "}
          <Link href={MARKETING_LINKS.login}>Staff login</Link>
        </p>
      </div>
    </main>
  );
}
