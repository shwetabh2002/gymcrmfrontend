"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import { canEditGymSettings } from "@/lib/rbac";
import {
  activityLogsApi,
  type ActivityLogItem,
} from "@/services/activity-logs/activity-logs.api";
import { useUpdateGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import { EASE_OUT_EXPO } from "@/config/motion";
import styles from "../profile/Profile.module.css";
import ComingSoonCard from "../settings/ComingSoonCard";

function formatWhen(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function Row({ item }: { item: ActivityLogItem }) {
  const who = [item.actorName, item.actorEmail, item.actorRole]
    .filter(Boolean)
    .join(" · ");
  const via =
    item.httpMethod && item.httpPath
      ? `${item.httpMethod} ${item.httpPath}`
      : item.action;

  return (
    <div
      style={{
        padding: "12px 0",
        borderTop: "1px solid var(--border)",
      }}
    >
      <p style={{ margin: 0, fontWeight: 600, color: "var(--text-1)" }}>
        {item.summary}
      </p>
      <p
        style={{
          margin: "4px 0 0",
          fontSize: "0.82rem",
          color: "var(--text-2)",
        }}
      >
        <strong style={{ color: "var(--text-1)" }}>{who || "Unknown"}</strong>
        {" · "}
        {via}
        {item.statusCode != null ? ` · ${item.statusCode}` : ""}
        {" · "}
        {formatWhen(item.createdAt)}
      </p>
    </div>
  );
}

/**
 * Two layers: server ACTIVITY_LOGS_ENABLED + gym activityLogsEnabled.
 * Entitlement (plan or SUPER_ADMIN unlock) required before gym can turn ON.
 */
export default function ActivityLogsPage() {
  const { user } = useAuth();
  const canView =
    canEditGymSettings(user?.role, user?.permissions) ||
    user?.role === "SUPER_ADMIN" ||
    !!user?.permissions?.includes("dashboard");
  const canToggle = canEditGymSettings(user?.role, user?.permissions);
  const updateSettings = useUpdateGymSettings();

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["activity-logs", q, user?.companyId],
    queryFn: () => activityLogsApi.list({ q: q || undefined, limit: 100 }),
    enabled: canView && !!user?.companyId,
  });

  const setGymOn = async (next: boolean) => {
    try {
      await updateSettings.mutateAsync({ activityLogsEnabled: next });
      toast.success(
        next ? "Activity log turned ON" : "Activity log turned OFF",
      );
      await refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not update");
    }
  };

  if (!canView) {
    return (
      <p style={{ color: "var(--text-2)" }}>
        You do not have access to activity logs.
      </p>
    );
  }

  if (!user?.companyId) {
    return (
      <p style={{ color: "var(--text-2)" }}>
        Select a gym to see its activity log.
      </p>
    );
  }

  const infraOff = data && !data.enabled;
  const notEntitled =
    data && data.enabled && data.entitled === false;
  const gymOff =
    data && data.enabled && data.entitled === true && !data.gymEnabled;
  const live = data && data.available;

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
    >
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Paid · time-retained</p>
          <h1 className={styles.pageTitle}>Activity log</h1>
          <p className={styles.pageDesc}>
            Who did what in this gym. Server master switch + per-gym on/off.
            History is kept for a limited window, then removed automatically.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--text-2)" }}>Loading…</p>
      ) : infraOff ? (
        <ComingSoonCard
          title="Activity log"
          description="Activity logging is turned off on this server. Platform ops must set ACTIVITY_LOGS_ENABLED=true, then unlock or include it on the plan, then turn it ON for this gym."
        />
      ) : notEntitled ? (
        <ComingSoonCard
          title="Activity log"
          description="Not on this gym's plan and not unlocked yet. Ask platform support to unlock Activity log for this gym, or upgrade to a plan that includes it."
        />
      ) : gymOff ? (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleBar} />
              Activity log is OFF for this gym
            </h2>
          </div>
          <div style={{ padding: "0 22px 22px" }}>
            <p
              style={{
                margin: "0 0 16px",
                color: "var(--text-2)",
                fontSize: "0.92rem",
                maxWidth: 520,
              }}
            >
              This gym is entitled, but the gym-level switch is off. Turn it on
              to start recording who does what. You can turn it off anytime.
            </p>
            {canToggle ? (
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={updateSettings.isPending}
                onClick={() => setGymOn(true)}
              >
                Turn ON for this gym
              </button>
            ) : (
              <p style={{ margin: 0, color: "var(--text-3)", fontSize: "0.85rem" }}>
                Ask an admin to turn Activity log ON in settings.
              </p>
            )}
          </div>
        </section>
      ) : live ? (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleBar} />
              Recent activity
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className={styles.cardBadge}>
                Last {data?.retentionDays ?? 30} days
              </span>
              {canToggle ? (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={updateSettings.isPending}
                  onClick={() => setGymOn(false)}
                  style={{ fontSize: "0.75rem" }}
                >
                  Turn OFF
                </button>
              ) : null}
            </div>
          </div>

          <div style={{ padding: "0 22px 16px", display: "flex", gap: 8 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setQ(qInput.trim());
              }}
              style={{ display: "flex", gap: 8, flex: 1 }}
            >
              <input
                className={styles.formInput}
                placeholder="Search by person, action, path…"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
              />
              <button type="submit" className={styles.btnSecondary}>
                Search
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => refetch()}
                disabled={isFetching}
              >
                Refresh
              </button>
            </form>
          </div>

          <div style={{ padding: "0 22px 22px" }}>
            {!data?.items.length ? (
              <p style={{ color: "var(--text-2)", margin: 0 }}>
                No activity in the last {data?.retentionDays ?? 30} days
                {q ? " for this search" : ""}.
              </p>
            ) : (
              <>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "0.8rem",
                    color: "var(--text-3)",
                  }}
                >
                  Showing {data.items.length}
                  {data.total > data.items.length ? ` of ${data.total}` : ""}{" "}
                  events · older than {data.retentionDays} days are deleted
                </p>
                {data.items.map((item) => (
                  <Row key={item.id} item={item} />
                ))}
              </>
            )}
          </div>
        </section>
      ) : (
        <ComingSoonCard
          title="Activity log"
          description="Activity log is not available for this gym yet."
        />
      )}
    </motion.div>
  );
}
