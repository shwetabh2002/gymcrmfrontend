"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  companiesApi,
  CompanyRow,
  ManualOnboardPayload,
} from "@/services/companies/companies.api";
import { useQueryClient } from "@tanstack/react-query";
import { COUNTRIES, DEFAULT_COUNTRY_CODE } from "@/config/countries";
import styles from "./Companies.module.css";

const EMPTY: ManualOnboardPayload = {
  gymName: "",
  phone: "",
  city: "",
  countryCode: DEFAULT_COUNTRY_CODE,
  memberIdPrefix: "GYM",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export default function CompaniesPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await companiesApi.list();
      setRows(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
      return;
    }
    load();
  }, [user?.role]);

  const activeId = user?.companyId ?? null;

  const onboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await companiesApi.onboard(form);
      setForm(EMPTY);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Onboard failed");
    } finally {
      setSaving(false);
    }
  };

  const select = async (id: string) => {
    setSelecting(id);
    setError("");
    try {
      const session = await companiesApi.select(id);
      login(session.tokens.accessToken, session.tokens.refreshToken, session.user);
      // Drop cached branding so next gym loads its own settings
      await queryClient.invalidateQueries({ queryKey: ["gym-settings"] });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Select failed");
    } finally {
      setSelecting(null);
    }
  };

  const clear = async () => {
    try {
      const session = await companiesApi.clearActive();
      login(session.tokens.accessToken, session.tokens.refreshToken, session.user);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Clear failed");
    }
  };

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.name.localeCompare(b.name)),
    [rows],
  );

  if (user?.role !== "SUPER_ADMIN") return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Platform</p>
          <h1 className={styles.title}>Companies</h1>
          <p className={styles.sub}>
            Switch gym context or manually onboard a new gym admin.
            {activeId
              ? ` Currently viewing: ${user?.companyName || activeId}`
              : " No gym selected — pick one to use the CRM."}
          </p>
        </div>
        {activeId && (
          <button type="button" className={styles.ghostBtn} onClick={clear}>
            Clear selection
          </button>
        )}
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>All gyms</h2>
            <span>{sorted.length}</span>
          </div>
          {loading ? (
            <p className={styles.muted}>Loading…</p>
          ) : sorted.length === 0 ? (
            <p className={styles.muted}>No companies yet. Onboard one →</p>
          ) : (
            <ul className={styles.list}>
              {sorted.map((c) => (
                <li key={c.id} className={styles.row}>
                  <div>
                    <div className={styles.rowTitle}>
                      {c.name}
                      {activeId === c.id && (
                        <span className={styles.pill}>active</span>
                      )}
                    </div>
                    <div className={styles.rowMeta}>
                      {c.slug} · {c.status} · {c.source}
                      {c.countryName ? ` · ${c.countryName}` : ""}
                      {c.currency ? ` · ${c.currency}` : ""}
                      {c.city ? ` · ${c.city}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={selecting === c.id}
                    onClick={() => select(c.id)}
                  >
                    {selecting === c.id ? "Opening…" : "Open gym"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Manual onboard</h2>
          </div>
          <form className={styles.form} onSubmit={onboard}>
            <label>
              Gym name
              <input
                required
                value={form.gymName}
                onChange={(e) => setForm({ ...form, gymName: e.target.value })}
              />
            </label>
            <div className={styles.two}>
              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label>
                City
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </label>
            </div>
            <label>
              Country
              <select
                value={form.countryCode || DEFAULT_COUNTRY_CODE}
                onChange={(e) =>
                  setForm({ ...form, countryCode: e.target.value })
                }
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Member ID prefix
              <input
                value={form.memberIdPrefix}
                onChange={(e) =>
                  setForm({ ...form, memberIdPrefix: e.target.value })
                }
              />
            </label>
            <label>
              Admin name
              <input
                required
                value={form.adminName}
                onChange={(e) =>
                  setForm({ ...form, adminName: e.target.value })
                }
              />
            </label>
            <label>
              Admin email
              <input
                required
                type="email"
                value={form.adminEmail}
                onChange={(e) =>
                  setForm({ ...form, adminEmail: e.target.value })
                }
              />
            </label>
            <label>
              Admin password
              <input
                required
                type="password"
                minLength={6}
                value={form.adminPassword}
                onChange={(e) =>
                  setForm({ ...form, adminPassword: e.target.value })
                }
              />
            </label>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? "Creating…" : "Create gym + admin"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
