"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import styles from "./Renewals.module.css";
import {
  useRenewalCounts,
  useRenewalQueue,
  useUpdateFollowUp,
} from "@/services/renewals/renewals.hooks";
import {
  RenewalFollowUpStatus,
  RenewalQueueItem,
  RenewalStatusFilter,
} from "@/services/renewals/renewals.api";
import { RowActions } from "@/components/RowActions";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

const STATUS_OPTIONS: RenewalFollowUpStatus[] = [
  "PENDING",
  "CONTACTED",
  "PROMISED",
  "RENEWED",
  "LOST",
  "SKIPPED",
];

function statusBadgeClass(status: RenewalFollowUpStatus) {
  switch (status) {
    case "PENDING":
      return styles.badgePending;
    case "CONTACTED":
      return styles.badgeContacted;
    case "PROMISED":
      return styles.badgePromised;
    case "RENEWED":
      return styles.badgeRenewed;
    case "LOST":
      return styles.badgeLost;
    default:
      return styles.badgeSkipped;
  }
}

function daysClass(days: number) {
  if (days <= 0) return styles.daysUrgent;
  if (days <= 3) return styles.daysUrgent;
  if (days <= 7) return styles.daysWarn;
  return styles.daysOk;
}

function daysLabel(days: number) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  return `${days}d left`;
}

export default function RenewalsPage() {
  const [statusFilter, setStatusFilter] = useState<RenewalStatusFilter>("OPEN");
  const [withinDays, setWithinDays] = useState(7);
  const [search, setSearch] = useState("");
  const [noteItem, setNoteItem] = useState<RenewalQueueItem | null>(null);
  const [noteText, setNoteText] = useState("");

  const queueParams = {
    withinDays,
    includeExpired: true,
    expiredWithinDays: 30,
    status: statusFilter,
  };

  const { data: queue, isLoading, isError } = useRenewalQueue(queueParams);
  const { data: counts } = useRenewalCounts({ withinDays, expiredWithinDays: 30 });
  const updateFollowUp = useUpdateFollowUp();

  const filtered = useMemo(() => {
    if (!queue) return [];
    const q = search.toLowerCase().trim();
    if (!q) return queue;
    return queue.filter(
      (item) =>
        item.memberName.toLowerCase().includes(q) ||
        (item.phone ?? "").includes(q) ||
        (item.email ?? "").toLowerCase().includes(q),
    );
  }, [queue, search]);

  const stats = [
    {
      label: "Open Follow-ups",
      val: counts?.open ?? "—",
      sub: `${counts?.pending ?? 0} pending`,
    },
    {
      label: "Expiring Today",
      val: counts?.expiringToday ?? "—",
      sub: `${counts?.expired ?? 0} already expired`,
    },
    {
      label: "Contacted / Promised",
      val: (counts?.contacted ?? 0) + (counts?.promised ?? 0),
      sub: "in progress",
    },
  ];

  const onStatusChange = async (
    item: RenewalQueueItem,
    next: RenewalFollowUpStatus,
  ) => {
    if (next === item.renewalFollowUpStatus) return;
    try {
      await updateFollowUp.mutateAsync({
        subscriptionId: item._id,
        payload: { renewalFollowUpStatus: next },
      });
      toast.success(`${item.memberName} → ${next}`);
    } catch {
      toast.error("Failed to update follow-up status");
    }
  };

  const openNotes = (item: RenewalQueueItem) => {
    setNoteItem(item);
    setNoteText(item.followUpNotes ?? "");
  };

  const saveNotes = async () => {
    if (!noteItem) return;
    try {
      await updateFollowUp.mutateAsync({
        subscriptionId: noteItem._id,
        payload: { followUpNotes: noteText },
      });
      toast.success("Notes saved");
      setNoteItem(null);
    } catch {
      toast.error("Failed to save notes");
    }
  };

  return (
    <div className={styles.page}>
      <AnimatePresence>
        {noteItem && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoteItem(null)}
            />
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Notes · {noteItem.memberName}
                </h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setNoteItem(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <textarea
                className={styles.noteArea}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Call outcome, promised date, objections…"
              />
              <div className={styles.modalActions}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setNoteItem(null)}
                >
                  Cancel
                </button>
                <button
                  className={styles.btnPrimary}
                  onClick={saveNotes}
                  disabled={updateFollowUp.isPending}
                >
                  Save Notes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Member Retention</p>
          <h1 className={styles.pageTitle}>Expiry Follow-ups</h1>
          <p className={styles.pageDesc}>
            Call and track members whose plan is expiring soon or recently
            expired — status, notes, and next contact.
          </p>
        </div>
      </motion.div>

      <motion.div
        className={styles.statStrip}
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        {stats.map((st) => (
          <div key={st.label} className={styles.statCell}>
            <span className={styles.statLabel}>
              <span className={styles.statLabelDot} />
              {st.label}
            </span>
            <span className={styles.statVal}>{st.val}</span>
            <span className={styles.statSub}>{st.sub}</span>
          </div>
        ))}
      </motion.div>

      <motion.div
        className={styles.card}
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            Work Queue
          </h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.searchInput}
                placeholder="Search member, phone, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as RenewalStatusFilter)
              }
            >
              <option value="OPEN">Open only</option>
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={withinDays}
              onChange={(e) => setWithinDays(Number(e.target.value))}
            >
              <option value={3}>Next 3 days</option>
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && (
            <p style={{ padding: "1.5rem", color: "#555", fontSize: 13 }}>
              Loading renewal queue…
            </p>
          )}
          {isError && (
            <p style={{ padding: "1.5rem", color: "#e63946", fontSize: 13 }}>
              Failed to load renewal queue.
            </p>
          )}
          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Plan</th>
                  <th>Expiry</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "2.5rem",
                        textAlign: "center",
                        color: "#444",
                        fontSize: 13,
                      }}
                    >
                      {queue?.length === 0
                        ? "No renewals in this window. Nice."
                        : "No members match your filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className={styles.cellName}>{item.memberName}</div>
                      <div className={styles.cellSub}>{item.email || "—"}</div>
                    </td>
                    <td className={styles.cellMono}>{item.phone || "—"}</td>
                    <td>
                      <div>{item.planName}</div>
                      <div className={styles.cellSub}>
                        ₹{item.planPrice?.toLocaleString("en-IN") ?? "—"}
                      </div>
                    </td>
                    <td className={styles.cellMono}>
                      {new Date(item.expiryDate).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <span className={daysClass(item.daysRemaining)}>
                        {daysLabel(item.daysRemaining)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${statusBadgeClass(
                          item.renewalFollowUpStatus,
                        )}`}
                      >
                        {item.renewalFollowUpStatus}
                      </span>
                    </td>
                    <td>
                      <div className={styles.notesPreview}>
                        {item.followUpNotes || "—"}
                      </div>
                      {item.lastFollowUpAt && (
                        <div className={styles.cellSub}>
                          Last:{" "}
                          {item.lastFollowUpByName
                            ? `${item.lastFollowUpByName} · `
                            : ""}
                          {new Date(item.lastFollowUpAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <select
                          className={styles.actionSelect}
                          value={item.renewalFollowUpStatus}
                          disabled={updateFollowUp.isPending}
                          onChange={(e) =>
                            onStatusChange(
                              item,
                              e.target.value as RenewalFollowUpStatus,
                            )
                          }
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <RowActions
                          actions={[
                            {
                              label: "Note",
                              onClick: () => openNotes(item),
                            },
                            {
                              label: "Membership",
                              href: "/billing?tab=memberships",
                            },
                            ...(item.phone
                              ? [
                                  {
                                    label: "Call",
                                    href: `tel:${item.phone}`,
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
