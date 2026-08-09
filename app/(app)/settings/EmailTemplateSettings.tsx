"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings } from "@/lib/rbac";
import {
  emailTemplatesApi,
  EmailTemplatePreview,
  EmailTemplateRow,
} from "@/services/email-templates/email-templates.api";
import styles from "../profile/Profile.module.css";

/**
 * Settings → Emails.
 *
 * Each gym writes its own wording for member-facing mails. A template left
 * untouched uses the platform default, and any type can be switched off so that
 * email is never sent for this gym.
 */
export default function EmailTemplateSettings() {
  const { user } = useAuth();
  const canEdit = canEditGymSettings(user?.role, user?.permissions);

  const [rows, setRows] = useState<EmailTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openType, setOpenType] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ subject: string; body: string }>({
    subject: "",
    body: "",
  });
  const [preview, setPreview] = useState<EmailTemplatePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await emailTemplatesApi.list());
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load email templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEditor = (row: EmailTemplateRow) => {
    setOpenType(row.type);
    setDraft({ subject: row.subject, body: row.body });
    setPreview(null);
  };

  const save = async (type: string) => {
    if (!canEdit) return;
    setBusy(true);
    try {
      setRows(
        await emailTemplatesApi.update(type, {
          subject: draft.subject,
          body: draft.body,
        }),
      );
      toast.success("Template saved");
      setOpenType(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save template");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (row: EmailTemplateRow) => {
    if (!canEdit) return;
    setBusy(true);
    try {
      setRows(
        await emailTemplatesApi.update(row.type, { enabled: !row.enabled }),
      );
      toast.success(
        row.enabled
          ? `${row.label} emails turned off`
          : `${row.label} emails turned on`,
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not update");
    } finally {
      setBusy(false);
    }
  };

  const reset = async (type: string) => {
    if (!canEdit) return;
    setBusy(true);
    try {
      const next = await emailTemplatesApi.reset(type);
      setRows(next);
      const row = next.find((r) => r.type === type);
      if (row) setDraft({ subject: row.subject, body: row.body });
      toast.success("Back to the default wording");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not reset");
    } finally {
      setBusy(false);
    }
  };

  const showPreview = async (type: string) => {
    setBusy(true);
    try {
      setPreview(await emailTemplatesApi.preview(type));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Preview failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.card} style={{ marginTop: 20 }}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardTitleBar} />
          Emails
        </h2>
        <span className={styles.cardBadge}>
          {rows.filter((r) => r.enabled).length}/{rows.length} on
        </span>
      </div>
      <p
        className={styles.pageDesc}
        style={{ margin: 0, padding: "12px 22px 0" }}
      >
        Your own wording for member emails. Mails go out with this gym&apos;s
        name, logo and reply-to address. Leave a template untouched to use the
        default, or switch a type off to stop sending it entirely.
      </p>

      {loading ? (
        <p style={{ color: "var(--text-2)", padding: "12px 22px" }}>Loading…</p>
      ) : (
        <div style={{ padding: "12px 22px 22px" }}>
          {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}

          {rows.map((row) => (
            <div
              key={row.type}
              style={{
                borderTop: "1px solid var(--border, rgba(127,127,127,.2))",
                padding: "14px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "1 1 240px" }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {row.label}
                    {row.customised ? (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          marginLeft: 8,
                          color: "var(--text-2)",
                        }}
                      >
                        · customised
                      </span>
                    ) : null}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "0.85rem",
                      color: "var(--text-2)",
                    }}
                  >
                    {row.description}
                  </p>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: canEdit ? "pointer" : "default",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    disabled={!canEdit || busy}
                    onChange={() => toggle(row)}
                  />
                  Send this email
                </label>

                {canEdit ? (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() =>
                      openType === row.type
                        ? setOpenType(null)
                        : openEditor(row)
                    }
                  >
                    {openType === row.type ? "Close" : "Edit"}
                  </button>
                ) : null}
              </div>

              {openType === row.type ? (
                <div style={{ marginTop: 12 }}>
                  <label className={styles.formLabel}>Subject</label>
                  <input
                    className={styles.formInput}
                    value={draft.subject}
                    disabled={busy}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, subject: e.target.value }))
                    }
                  />

                  <label className={styles.formLabel} style={{ marginTop: 10 }}>
                    Message
                  </label>
                  <textarea
                    className={styles.formInput}
                    rows={10}
                    value={draft.body}
                    disabled={busy}
                    style={{ fontFamily: "inherit", lineHeight: 1.5 }}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, body: e.target.value }))
                    }
                  />

                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-2)",
                      marginTop: 8,
                    }}
                  >
                    Placeholders:{" "}
                    {row.placeholders.map((ph) => (
                      <code
                        key={ph}
                        style={{
                          background: "var(--surface-2, rgba(127,127,127,.12))",
                          padding: "1px 5px",
                          borderRadius: 4,
                          marginRight: 4,
                        }}
                      >
                        {`{${ph}}`}
                      </code>
                    ))}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      disabled={busy}
                      onClick={() => save(row.type)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      disabled={busy}
                      onClick={() => showPreview(row.type)}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      disabled={busy || !row.customised}
                      onClick={() => reset(row.type)}
                    >
                      Use default
                    </button>
                  </div>

                  {preview && preview.type === row.type ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 8,
                        background: "var(--surface-2, rgba(127,127,127,.08))",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "0.8rem",
                          color: "var(--text-2)",
                        }}
                      >
                        Preview with sample data
                      </p>
                      <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
                        {preview.subject}
                      </p>
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                          fontSize: "0.9rem",
                        }}
                      >
                        {preview.text}
                      </pre>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
