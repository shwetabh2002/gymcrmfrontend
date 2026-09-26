"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  platformApi,
  type PlatformInquiry,
} from "@/services/subscription/subscription.api";
import { useAuth } from "@/lib/context/AuthContext";
import { formatMoney } from "@/config/countries";
import { EASE_OUT_EXPO } from "@/config/motion";
import styles from "../profile/Profile.module.css";

const STATUS_FILTERS = [
  "ALL",
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "READ_ONLY",
  "CANCELLED",
] as const;

const STATUS_TONE: Record<string, string> = {
  TRIALING: "#1b4fd8",
  ACTIVE: "#1b7f43",
  PAST_DUE: "#b26a00",
  READ_ONLY: "#b3261e",
  CANCELLED: "#6b7280",
};

/**
 * Platform view: every gym's standing with us.
 *
 * SUPER_ADMIN only — the route guard in lib/rbac keeps gym staff out, and the
 * API refuses them anyway.
 */
export default function PlatformPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [busy, setBusy] = useState(false);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const { data: overview } = useQuery({
    queryKey: ["platform", "overview"],
    queryFn: platformApi.overview,
    enabled: isSuperAdmin,
  });
  const { data: companies, isLoading } = useQuery({
    queryKey: ["platform", "companies", statusFilter],
    queryFn: () => platformApi.companies(statusFilter),
    enabled: isSuperAdmin,
  });
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ["platform", "inquiries"],
    queryFn: () => platformApi.inquiries(),
    enabled: isSuperAdmin,
  });

  const money = (amount: number) => formatMoney(amount, "IN");

  const markInquiry = async (
    row: PlatformInquiry,
    status: "CONTACTED" | "CLOSED",
  ) => {
    try {
      await platformApi.updateInquiry(row.id, { status });
      toast.success(status === "CONTACTED" ? "Marked contacted" : "Closed");
      queryClient.invalidateQueries({ queryKey: ["platform", "inquiries"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Update failed");
    }
  };

  const runBilling = async () => {
    setBusy(true);
    try {
      const result = await platformApi.runBilling();
      toast.success(
        `Sweep done — ${result.renewalsCharged ?? 0} charged, ${result.trialsExpired ?? 0} trials ended`,
      );
      queryClient.invalidateQueries({ queryKey: ["platform"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Sweep failed");
    } finally {
      setBusy(false);
    }
  };

  if (!isSuperAdmin) {
    return <p style={{ color: "var(--text-2)" }}>Platform access only.</p>;
  }

  const stats = [
    { label: "On trial", value: overview?.counts.trialing ?? 0, tone: "#1b4fd8" },
    { label: "Paying", value: overview?.counts.active ?? 0, tone: "#1b7f43" },
    { label: "Payment failed", value: overview?.counts.pastDue ?? 0, tone: "#b26a00" },
    { label: "Lapsed", value: overview?.counts.readOnly ?? 0, tone: "#b3261e" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
    >
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            Platform
          </h2>
          <button
            type="button"
            className={styles.btnSecondary}
            disabled={busy}
            onClick={runBilling}
          >
            Run billing sweep
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            padding: "12px 22px 0",
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "var(--text-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: s.tone,
                }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            padding: "14px 22px 22px",
          }}
        >
          <div>
            <label className={styles.formLabel}>Monthly recurring revenue</label>
            <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>
              {money(overview?.mrr ?? 0)}
            </p>
          </div>
          <div>
            <label className={styles.formLabel}>Collected to date</label>
            <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>
              {money(overview?.lifetimeRevenue ?? 0)}
            </p>
            <span style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>
              {overview?.paidCharges ?? 0} paid invoices
            </span>
          </div>
        </div>
      </section>

      {/* Trials about to end — the list worth acting on today. */}
      {overview?.trialsEndingSoon?.length ? (
        <section className={styles.card} style={{ marginTop: 20 }}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleBar} />
              Trials ending soon
            </h2>
          </div>
          <div style={{ padding: "12px 22px 22px" }}>
            {overview.trialsEndingSoon.map((t) => (
              <div
                key={t.companyId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderTop: "1px solid var(--border)",
                  fontSize: "0.9rem",
                }}
              >
                <span>{t.companyName}</span>
                <span style={{ color: "var(--text-2)" }}>
                  {t.planCode} · {t.daysLeft} day{t.daysLeft === 1 ? "" : "s"} left
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}


      {/* Custom plan leads — sales follow-up. */}
      <section className={styles.card} style={{ marginTop: 20 }}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            Custom plan requests
          </h2>
          <span className={styles.cardBadge}>
            {(inquiries ?? []).filter((i) => i.status === "NEW").length} new
          </span>
        </div>
        <div style={{ padding: "12px 22px 22px" }}>
          {inquiriesLoading ? (
            <p style={{ color: "var(--text-2)" }}>Loading…</p>
          ) : !(inquiries ?? []).length ? (
            <p style={{ color: "var(--text-2)", margin: 0 }}>
              No Custom requests yet. When a gym taps Talk to us, it shows here.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {(inquiries ?? []).map((row) => (
                <div
                  key={row.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 700 }}>
                        {row.companyName}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "0.85rem",
                          color: "var(--text-2)",
                        }}
                      >
                        {row.contactName} · {row.contactPhone}
                        {row.contactEmail ? ` · ${row.contactEmail}` : ""}
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        letterSpacing: "0.06em",
                        color:
                          row.status === "NEW"
                            ? "#1b4fd8"
                            : row.status === "CONTACTED"
                              ? "#b26a00"
                              : "#6b7280",
                      }}
                    >
                      {row.status}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: "0.85rem",
                      color: "var(--text-1)",
                    }}
                  >
                    {row.branchCount} branch
                    {row.branchCount === 1 ? "" : "es"}
                    {row.approxMembers != null
                      ? ` · ~${row.approxMembers} members`
                      : ""}
                    {row.needs?.length ? ` · ${row.needs.join(", ")}` : ""}
                  </p>
                  {row.currentSoftware ? (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "0.8rem",
                        color: "var(--text-2)",
                      }}
                    >
                      Current software: {row.currentSoftware}
                    </p>
                  ) : null}
                  {row.message ? (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "0.85rem",
                        color: "var(--text-2)",
                      }}
                    >
                      {row.message}
                    </p>
                  ) : null}
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "0.75rem",
                      color: "var(--text-3)",
                    }}
                  >
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : ""}
                  </p>
                  {row.status !== "CLOSED" ? (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      {row.status === "NEW" ? (
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          onClick={() => markInquiry(row, "CONTACTED")}
                        >
                          Mark contacted
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => markInquiry(row, "CLOSED")}
                      >
                        Close
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={styles.card} style={{ marginTop: 20 }}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            Gyms
          </h2>
          <select
            className={styles.formInput}
            style={{ maxWidth: 180 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All statuses" : s}
              </option>
            ))}
          </select>
        </div>

        <div style={{ padding: "12px 22px 22px", overflowX: "auto" }}>
          {isLoading ? (
            <p style={{ color: "var(--text-2)" }}>Loading…</p>
          ) : !companies?.length ? (
            <p style={{ color: "var(--text-2)" }}>No gyms in this state.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-2)" }}>
                  <th style={{ padding: "6px 8px 6px 0", fontSize: "0.75rem" }}>
                    Gym
                  </th>
                  <th style={{ fontSize: "0.75rem" }}>Status</th>
                  <th style={{ fontSize: "0.75rem" }}>Plan</th>
                  <th style={{ fontSize: "0.75rem" }}>Branches</th>
                  <th style={{ fontSize: "0.75rem" }}>Trial / renews</th>
                  <th style={{ fontSize: "0.75rem", textAlign: "right" }}>
                    Last charge
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c.companyId}
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "9px 8px 9px 0" }}>
                      <div style={{ fontWeight: 600 }}>{c.companyName}</div>
                      <div
                        style={{ fontSize: "0.78rem", color: "var(--text-2)" }}
                      >
                        {[c.city, c.phone].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: STATUS_TONE[c.status] ?? "var(--text-2)",
                      }}
                    >
                      {c.status}
                      {c.dunningAttempts > 0 ? ` (${c.dunningAttempts})` : ""}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {c.planCode}
                      {!c.mandateApproved ? (
                        <span
                          style={{
                            color: "var(--text-2)",
                            fontSize: "0.75rem",
                          }}
                        >
                          {" "}
                          · no mandate
                        </span>
                      ) : null}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{c.branches}</td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {c.status === "TRIALING"
                        ? c.trialEndsAt
                          ? new Date(c.trialEndsAt).toLocaleDateString()
                          : "—"
                        : c.currentPeriodEnd
                          ? new Date(c.currentPeriodEnd).toLocaleDateString()
                          : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontSize: "0.85rem" }}>
                      {c.lastAmount ? money(c.lastAmount) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </motion.div>
  );
}
