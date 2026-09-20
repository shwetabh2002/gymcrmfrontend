"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import styles from "../renewals/Renewals.module.css";
import { useDuesQueue, useSetDueReminder } from "@/services/dues/dues.hooks";
import { DuesItem, DuesSort, DuesReminderFilter } from "@/services/dues/dues.api";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { EASE_OUT_EXPO } from "@/config/motion";
import {
  FilterBar,
  FilterChip,
  FilterField,
  FilterSearch,
  FilterSelect,
} from "@/components/FilterBar/FilterBar";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: EASE_OUT_EXPO },
  }),
};

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function reminderLabel(item: DuesItem) {
  if (item.daysUntilReminder == null) return "No date set";
  const d = item.daysUntilReminder;
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return "Today";
  return `${d}d left`;
}

function reminderClass(item: DuesItem) {
  if (item.daysUntilReminder == null) return styles.daysOk;
  if (item.daysUntilReminder <= 0) return styles.daysUrgent;
  if (item.daysUntilReminder <= 3) return styles.daysUrgent;
  if (item.daysUntilReminder <= 7) return styles.daysWarn;
  return styles.daysOk;
}

export default function DuesPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<DuesSort>("reminder_asc");
  const [reminderFilter, setReminderFilter] = useState<DuesReminderFilter>("ALL");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, isLoading, isError } = useDuesQueue({
    sort,
    search: debouncedSearch || undefined,
    page,
    limit: 50,
    reminder: reminderFilter,
  });
  const setReminder = useSetDueReminder();
  const [editing, setEditing] = useState<DuesItem | null>(null);
  const [reminderDate, setReminderDate] = useState("");

  const items = data?.items ?? [];
  const counts = data?.counts;
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  const activeFilterCount = [
    search.trim() !== "",
    sort !== "reminder_asc",
    reminderFilter !== "ALL",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setSort("reminder_asc");
    setReminderFilter("ALL");
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort, reminderFilter]);

  const openReminder = (item: DuesItem) => {
    setEditing(item);
    setReminderDate(
      item.dueReminderDate
        ? item.dueReminderDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    );
  };

  const saveReminder = async () => {
    if (!editing) return;
    try {
      await setReminder.mutateAsync({
        subscriptionId: editing.subscriptionId,
        dueReminderDate: reminderDate || null,
      });
      toast.success("Reminder date saved");
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save reminder");
    }
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <p className={styles.eyebrow}>Collections</p>
          <h1 className={styles.pageTitle}>Partial dues</h1>
          <p className={styles.pageDesc}>
            Members with unpaid balance — reach them by the date they promised.
            Default sort: nearest reminder first.
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
        <div className={styles.statCell}>
          <span className={styles.statLabel}>With dues</span>
          <span className={styles.statVal}>{counts?.total ?? 0}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Total pending</span>
          <span className={styles.statVal}>
            {money(counts?.totalPending ?? 0)}
          </span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Reminder set</span>
          <span className={styles.statVal}>{counts?.withReminder ?? 0}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Reminder overdue</span>
          <span className={styles.statVal}>{counts?.overdueReminder ?? 0}</span>
        </div>
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
            Dues queue
          </h2>
        </div>
        <FilterBar
          title="Dues filters"
          activeCount={activeFilterCount}
          onClear={clearFilters}
          chips={
            <>
              <FilterChip
                label="All"
                active={reminderFilter === "ALL"}
                onClick={() => { setReminderFilter("ALL"); setPage(1); }}
              />
              <FilterChip
                label="Reminder set"
                active={reminderFilter === "SET"}
                onClick={() => { setReminderFilter("SET"); setPage(1); }}
              />
              <FilterChip
                label="Reminder overdue"
                active={reminderFilter === "OVERDUE"}
                onClick={() => { setReminderFilter("OVERDUE"); setPage(1); }}
              />
              <FilterChip
                label="No reminder"
                active={reminderFilter === "NONE"}
                onClick={() => { setReminderFilter("NONE"); setPage(1); }}
              />
            </>
          }
        >
          <FilterField label="Search" grow>
            <FilterSearch
              value={search}
              onChange={setSearch}
              placeholder="Name / phone…"
            />
          </FilterField>
          <FilterField label="Sort by">
            <FilterSelect
              value={sort}
              onChange={(v) => setSort(v as DuesSort)}
            >
              <option value="reminder_asc">Reminder nearest</option>
              <option value="reminder_desc">Reminder farthest</option>
              <option value="pending_desc">Pending high → low</option>
              <option value="pending_asc">Pending low → high</option>
              <option value="name_asc">Name A → Z</option>
              <option value="expiry_asc">Expiry soonest</option>
            </FilterSelect>
          </FilterField>
        </FilterBar>

        <div className={styles.tableWrap}>
          {isLoading && <p className={styles.empty}>Loading…</p>}
          {isError && (
            <p className={styles.emptyError}>Failed to load dues queue.</p>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <p className={styles.empty}>
              {counts?.total === 0
                ? "No partial dues right now."
                : "No dues match these filters."}
            </p>
          )}
          {!isLoading && !isError && items.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan / validity</th>
                  <th>Paid / Pending</th>
                  <th>Due reminder</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.subscriptionId}>
                    <td>
                      <div className={styles.cellName}>{item.memberName}</div>
                      <div className={styles.cellMono}>
                        {item.memberPhone || item.idNo || "—"}
                      </div>
                    </td>
                    <td>
                      <div>{item.planName || "—"}</div>
                      <div className={styles.cellMono}>
                        {money(item.planPrice)}
                      </div>
                      <div className={styles.cellMono} style={{ marginTop: 4 }}>
                        {formatDate(item.startDate)} →{" "}
                        {formatDate(item.expiryDate)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellMono}>
                        {money(item.totalPaid)} paid
                      </div>
                      <div style={{ fontWeight: 700, color: "#c0392b" }}>
                        {money(item.pendingAmount)} due
                      </div>
                    </td>
                    <td>
                      <div>{formatDate(item.dueReminderDate)}</div>
                      <span className={reminderClass(item)}>
                        {reminderLabel(item)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() => openReminder(item)}
                        >
                          {item.dueReminderDate ? "Edit date" : "Set date"}
                        </button>
                        <Link
                          href={`/billing?mode=collect&memberId=${encodeURIComponent(item.memberId)}&subscriptionId=${encodeURIComponent(item.subscriptionId)}`}
                          className={styles.btnPrimary}
                          style={{ textDecoration: "none" }}
                        >
                          Collect
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {total > 0 ? (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Page {data?.page ?? page} of {pages} · {total} dues
            </span>
            <div className={styles.paginationBtns}>
              <button
                type="button"
                className={styles.pageNav}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className={styles.pageNav}
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </motion.div>

      {editing ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setEditing(null)}
        >
          <div
            className={styles.card}
            style={{ width: 360, padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>
              Due reminder — {editing.memberName}
            </h3>
            <p className={styles.pageDesc} style={{ marginBottom: 12 }}>
              Pending {money(editing.pendingAmount)}. When did they say they
              will pay the rest?
            </p>
            <input
              type="date"
              className={styles.searchInput}
              style={{ paddingLeft: 12, marginBottom: 12 }}
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={saveReminder}
                disabled={setReminder.isPending}
              >
                {setReminder.isPending ? "Saving…" : "Save date"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
