"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { companiesApi, CompanyRow } from "@/services/companies/companies.api";
import styles from "./CompanySwitcher.module.css";

type Props = {
  /** `sidebar` matches dark/light sidebar; `header` sits in the top bar */
  variant?: "sidebar" | "header";
};

export default function CompanySwitcher({ variant = "sidebar" }: Props) {
  const { user, login } = useAuth();
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    companiesApi
      .list()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setLoadError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setLoadError("Could not load gyms");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      // Focus search when panel opens
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.name} ${r.slug} ${r.city ?? ""} ${r.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  if (!isSuperAdmin) return null;

  const currentLabel = user?.companyName || "Select a gym…";

  const applySession = async (
    session: Awaited<ReturnType<typeof companiesApi.select>>,
  ) => {
    login(session.tokens.accessToken, session.tokens.refreshToken, session.user);
    window.location.reload();
  };

  const onSelect = async (id: string) => {
    if (busy || id === user?.companyId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      const session = await companiesApi.select(id);
      await applySession(session);
    } catch (e) {
      console.error(e);
      setBusy(false);
      setLoadError("Failed to switch gym");
    }
  };

  const onClear = async () => {
    if (busy || !user?.companyId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      const session = await companiesApi.clearActive();
      await applySession(session);
    } catch (e) {
      console.error(e);
      setBusy(false);
      setLoadError("Failed to clear gym");
    }
  };

  return (
    <div
      className={`${styles.wrap} ${variant === "header" ? styles.headerVariant : styles.sidebarVariant}`}
      ref={rootRef}
    >
      {variant === "sidebar" && (
        <span className={styles.label}>Gym / company</span>
      )}

      <button
        type="button"
        className={styles.trigger}
        disabled={busy}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.triggerText}>
          <span className={styles.triggerTitle}>{currentLabel}</span>
          {user?.companyId && (
            <span className={styles.triggerHint}>Switch gym</span>
          )}
        </span>
        <span className={styles.chevron} aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div className={styles.panel} role="listbox">
          <div className={styles.searchRow}>
            <input
              ref={searchRef}
              className={styles.search}
              type="search"
              placeholder="Search gyms…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          {loadError && <p className={styles.error}>{loadError}</p>}

          <button
            type="button"
            className={`${styles.option} ${!user?.companyId ? styles.optionActive : ""}`}
            disabled={busy || !user?.companyId}
            onClick={onClear}
          >
            <span className={styles.optionName}>Clear selection</span>
            <span className={styles.optionMeta}>Companies list</span>
          </button>

          <div className={styles.list}>
            {filtered.length === 0 ? (
              <p className={styles.empty}>
                {rows.length === 0 ? "No gyms yet" : "No matches"}
              </p>
            ) : (
              filtered.map((r) => {
                const active = r.id === user?.companyId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`${styles.option} ${active ? styles.optionActive : ""}`}
                    disabled={busy}
                    onClick={() => onSelect(r.id)}
                  >
                    <span className={styles.optionName}>{r.name}</span>
                    <span className={styles.optionMeta}>
                      {r.city ? `${r.city} · ` : ""}
                      {r.status}
                      {r.slug ? ` · ${r.slug}` : ""}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
