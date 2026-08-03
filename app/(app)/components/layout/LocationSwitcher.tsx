"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { locationsApi, LocationRow } from "@/services/locations/locations.api";
import styles from "./LocationSwitcher.module.css";

export default function LocationSwitcher() {
  const { user, login } = useAuth();
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [busy, setBusy] = useState(false);

  const canUse =
    !!user?.companyId &&
    user.role !== undefined &&
    (user.role === "SUPER_ADMIN" ? !!user.companyId : true);

  useEffect(() => {
    if (!canUse) {
      setRows([]);
      return;
    }
    let cancelled = false;
    locationsApi
      .list()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canUse, user?.companyId]);

  if (!canUse || rows.length === 0) return null;

  const onChange = async (value: string) => {
    setBusy(true);
    try {
      const session =
        value === ""
          ? await locationsApi.clearActive()
          : await locationsApi.select(value);
      login(session.tokens.accessToken, session.tokens.refreshToken, session.user);
      // Refresh lists after scope change
      window.location.reload();
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="loc-switch">
        Location
      </label>
      <select
        id="loc-switch"
        className={styles.select}
        disabled={busy}
        value={user?.locationId || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All locations</option>
        {rows
          .filter((r) => r.status === "ACTIVE")
          .map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.isDefault ? " (default)" : ""}
            </option>
          ))}
      </select>
    </div>
  );
}
