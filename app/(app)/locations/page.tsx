"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  locationsApi,
  LocationRow,
  CreateLocationPayload,
} from "@/services/locations/locations.api";
import styles from "./Locations.module.css";
import { RowActions } from "@/components/RowActions";

const EMPTY: CreateLocationPayload = {
  name: "",
  code: "",
  city: "",
  phone: "",
  address: "",
  isDefault: false,
};

export default function LocationsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await locationsApi.list());
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.companyId) load();
  }, [user?.companyId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await locationsApi.create({
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        city: form.city?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
        isDefault: form.isDefault,
      });
      setForm(EMPTY);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    try {
      await locationsApi.update(id, { isDefault: true });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Update failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this location?")) return;
    try {
      await locationsApi.remove(id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Delete failed");
    }
  };

  if (!user?.companyId) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Select a company first.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Branches</p>
          <h1 className={styles.title}>Locations</h1>
          <p className={styles.sub}>
            Segregate members & payments by branch. Invoice design is configured
            in Gym settings (with live preview). Address / phone here still show
            on that branch&apos;s invoices.
          </p>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Your branches</h2>
            <span>{rows.length}</span>
          </div>
          {loading ? (
            <p className={styles.muted}>Loading…</p>
          ) : rows.length === 0 ? (
            <p className={styles.muted}>No locations yet.</p>
          ) : (
            <ul className={styles.list}>
              {rows.map((r) => (
                <li key={r.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>
                      {r.name}
                      {r.isDefault && <span className={styles.pill}>default</span>}
                      {r.status !== "ACTIVE" && (
                        <span className={styles.pillMuted}>{r.status}</span>
                      )}
                    </div>
                    <div className={styles.rowMeta}>
                      {r.code}
                      {r.city ? ` · ${r.city}` : ""}
                      {r.phone ? ` · ${r.phone}` : ""}
                    </div>
                  </div>
                  <RowActions
                    actions={[
                      ...(!r.isDefault
                        ? [
                            {
                              label: "Make default",
                              onClick: () => setDefault(r.id),
                            },
                          ]
                        : []),
                      {
                        label: "Delete",
                        onClick: () => remove(r.id),
                        tone: "danger" as const,
                      },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Add location</h2>
          </div>
          <form className={styles.form} onSubmit={onCreate}>
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Andheri West"
              />
            </label>
            <label>
              Code (optional)
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="andheri"
              />
            </label>
            <div className={styles.two}>
              <label>
                City
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </label>
              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
            </div>
            <label>
              Address
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={!!form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
              />
              Set as default branch
            </label>
            <button type="submit" className={styles.primary} disabled={saving}>
              {saving ? "Saving…" : "Add location"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
