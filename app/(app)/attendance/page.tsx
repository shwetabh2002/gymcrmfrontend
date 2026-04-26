"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import styles from "../employees/Employees.module.css";
import {
  useAttendanceList,
  useAttendanceToday,
} from "@/services/attendance/attendance.hook";
import type { AttendanceRecord } from "@/services/attendance/attendance.api";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/** Calendar Y-M-D in APP_TIMEZONE (same as backend attendance / eSSL guidance). */
const APP_TZ = "Asia/Kolkata";

/** YYYY-MM for "current month" in the gym (not the PC's timezone — fixes empty table when e.g. data is Apr 2026 IST but the laptop is in the US). */
function currentMonthValueIst(): string {
  const ymd = new Date().toLocaleDateString("en-CA", { timeZone: APP_TZ });
  const [y, m] = ymd.split("-");
  return `${y}-${m}`;
}

function formatTime(iso?: string | Date) {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function empName(row: AttendanceRecord) {
  const p = row.employeeId;
  if (p && typeof p === "object" && "name" in p) return (p as { name: string }).name;
  return row.employeeName ?? "—";
}

export default function AttendancePage() {
  const [month, setMonth] = useState(currentMonthValueIst);
  const [liveToday, setLiveToday] = useState(true);

  const { data: rows, isLoading, isError, refetch } = useAttendanceList({ month });
  const {
    data: todayRows,
    isLoading: todayLoading,
    dataUpdatedAt: todayUpdatedAt,
  } = useAttendanceToday(liveToday, 15_000);

  const sorted = useMemo(() => {
    const list = rows ?? [];
    return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [rows]);

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className={styles.pageTitle} style={{ color: "#000" }}>
            Attendance
          </h1>
        </div>
      </motion.div>

      <motion.div
        className={styles.card}
        custom={0.5}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: "1rem" }}
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            Today — live
          </h2>
          <div className={styles.toolbar} style={{ alignItems: "center" }}>
            <label style={{ fontSize: 12, color: "#888", display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={liveToday}
                onChange={(e) => setLiveToday(e.target.checked)}
              />
              Auto-refresh every 15s
            </label>
            {todayUpdatedAt ? (
              <span style={{ fontSize: 11, color: "#555" }}>
                Updated {new Date(todayUpdatedAt).toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>
        <div className={styles.tableWrap}>
          {todayLoading && !todayRows && (
            <p style={{ padding: "1rem 22px", color: "var(--text-2)", fontSize: 13 }}>Loading today…</p>
          )}
          {todayRows && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Device user ID</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayRows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-2)" }}>
                      No punches today yet.
                    </td>
                  </tr>
                )}
                {todayRows.map((row) => (
                  <tr key={row._id}>
                    <td style={{ color: "#fff", fontWeight: 500 }}>{empName(row)}</td>
                    <td className={styles.cellMono}>{row.deviceUserId}</td>
                    <td className={styles.cellMono}>{formatTime(row.checkInTime)}</td>
                    <td className={styles.cellMono}>{formatTime(row.checkOutTime)}</td>
                    <td>
                      <span className={styles.badge}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      <motion.div className={styles.card} custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            Records (by month)
          </h2>
          <div className={styles.toolbar}>
            <label style={{ fontSize: 12, color: "#888", display: "flex", gap: 8, alignItems: "center" }}>
              Month
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className={styles.searchInput}
                style={{ width: "auto" }}
              />
            </label>
            <button type="button" className={styles.btnSecondary} onClick={() => refetch()}>
              Refresh
            </button>
          </div>
        </div>

        <p style={{ padding: "0 22px 12px", margin: 0, fontSize: 12, color: "#888", lineHeight: 1.5 }}>
          Select month, then refresh.
        </p>
        <div className={styles.tableWrap}>
          {isLoading && (
            <p style={{ padding: "1.5rem 22px", color: "var(--text-2)", fontSize: 13 }}>Loading…</p>
          )}
          {isError && (
            <p style={{ padding: "1.5rem 22px", color: "#e63946", fontSize: 13 }}>
              Could not load attendance. Is the API running and are you logged in?
            </p>
          )}
          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Device user ID</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-2)" }}>
                      No attendance for this month. Run an eSSL sync or wait for device pushes.
                    </td>
                  </tr>
                )}
                {sorted.map((row) => (
                  <tr key={row._id}>
                    <td className={styles.cellMono}>{row.date}</td>
                    <td style={{ color: "#fff", fontWeight: 500 }}>{empName(row)}</td>
                    <td className={styles.cellMono}>{row.deviceUserId}</td>
                    <td className={styles.cellMono}>{formatTime(row.checkInTime)}</td>
                    <td className={styles.cellMono}>{formatTime(row.checkOutTime)}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          row.status === "Late"
                            ? styles.badgeTrainer
                            : row.status === "Present"
                              ? styles.badgeActive
                              : ""
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className={styles.cellMono}>
                      {row.workingHours != null ? `${row.workingHours}` : "—"}
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
