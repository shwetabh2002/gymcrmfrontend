"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./Employees.module.css";
import {
  useEmployees,
  useIsEmployeeSectionUnlocked,
  useLockEmployeeSection,
} from "@/services/employees/employees.hook";
import { Employee } from "@/services/employees/employees.api";
import EmployeeModal from "./EmployeeModal";
import DeleteEmployeeDialog from "./DeleteEmployeeDialog";
import UnlockModal from "./UnlockModal";

const PAGE_SIZE = 10;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount?: number) {
  if (amount === undefined || amount === null) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function EmployeesPage() {
  // Check unlock status (from localStorage)
  const isUnlocked = useIsEmployeeSectionUnlocked();

  // Employee data (only fetch if unlocked)
  const { data: employees, isLoading, isError } = useEmployees();
  const lockMutation = useLockEmployeeSection();

  const [unlockModalOpen, setUnlockModalOpen] = useState(!isUnlocked);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const openCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };
  const openEdit = (e: Employee) => {
    setSelected(e);
    setModalOpen(true);
  };
  const openDelete = (e: Employee) => {
    setSelected(e);
    setDeleteOpen(true);
  };

  const handleLock = async () => {
    await lockMutation.mutateAsync();
    setUnlockModalOpen(true);
  };

  const handleUnlockSuccess = () => {
    setUnlockModalOpen(false);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };
  const handleType = (val: string) => {
    setTypeFilter(val);
    setPage(1);
  };
  const handleStatus = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const filtered = useMemo(() => {
    if (!employees) return [];
    return employees
      .filter((e) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.phone.toLowerCase().includes(q) ||
          (e.employeeId && e.employeeId.toLowerCase().includes(q));
        const matchType = typeFilter === "ALL" || e.employeeType === typeFilter;
        const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
        return matchSearch && matchType && matchStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [employees, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalSalary = filtered.reduce((s, e) => s + e.salary, 0);
  const avgSalary = filtered.length > 0 ? totalSalary / filtered.length : 0;

  const pageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    return range;
  };

  // Show unlock modal in the content area (sidebar remains accessible)
  if (!isUnlocked) {
    return (
      <div className={styles.page}>
        <UnlockModal open={unlockModalOpen} onClose={() => {}} onUnlock={handleUnlockSuccess} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <EmployeeModal open={modalOpen} onClose={() => setModalOpen(false)} existing={selected} />
      <DeleteEmployeeDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} employee={selected} />

      {/* Header */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <h1 className={styles.pageTitle}>Employees</h1>
          <p className={styles.pageSubtitle}>Manage gym employees and staff</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={handleLock}>
            🔒 Lock Section
          </button>
          <button className={styles.btnPrimary} onClick={openCreate}>
            + Add Employee
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div className={styles.statStrip} custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <span className={styles.statLabelDot} />
            Total Employees
          </span>
          <span className={styles.statVal}>{employees?.length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <span className={styles.statLabelDot} />
            Active
          </span>
          <span className={styles.statVal}>{employees?.filter((e) => e.status === "ACTIVE").length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <span className={styles.statLabelDot} />
            Sales Staff
          </span>
          <span className={styles.statVal}>{employees?.filter((e) => e.employeeType === "SALES").length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <span className={styles.statLabelDot} />
            Trainers
          </span>
          <span className={styles.statVal}>
            {employees?.filter((e) => e.employeeType === "TRAINER").length ?? "—"}
          </span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <span className={styles.statLabelDot} />
            Total Salary
          </span>
          <span className={`${styles.statVal} ${styles.statValRed}`}>{formatCurrency(totalSalary)}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <span className={styles.statLabelDot} />
            Avg Salary
          </span>
          <span className={styles.statVal}>{formatCurrency(avgSalary)}</span>
        </div>
      </motion.div>

      {/* Table Card */}
      <motion.div className={styles.card} custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            All Employees
          </h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.searchInput}
                placeholder="Search ID, name, email, phone…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <select className={styles.filterSelect} value={typeFilter} onChange={(e) => handleType(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="SALES">Sales</option>
              <option value="TRAINER">Trainer</option>
            </select>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => handleStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && (
            <p style={{ padding: "1.5rem 22px", color: "var(--text-2)", fontSize: 13 }}>Loading employees…</p>
          )}
          {isError && (
            <p style={{ padding: "1.5rem 22px", color: "#e63946", fontSize: 13 }}>
              Failed to load employees. Please refresh.
            </p>
          )}

          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Device ID</th>
                  <th>Type</th>
                  <th>Salary</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-2)", fontSize: 13 }}>
                      {employees?.length === 0
                        ? "No employees yet. Add one to get started."
                        : "No employees match your filters."}
                    </td>
                  </tr>
                )}
                {paginated.map((e) => (
                  <tr key={e._id}>
                    <td className={styles.cellMono}>{e.employeeId ?? "—"}</td>
                    <td style={{ color: "#fff", fontWeight: 500 }}>{e.name}</td>
                    <td className={styles.cellMono}>{e.age}</td>
                    <td className={styles.cellMono}>{e.phone}</td>
                    <td className={styles.cellMono}>{e.email}</td>
                    <td className={styles.cellMono}>{e.deviceUserId?.trim() ? e.deviceUserId : "—"}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          e.employeeType === "SALES" ? styles.badgeSales : styles.badgeTrainer
                        }`}
                      >
                        {e.employeeType}
                      </span>
                    </td>
                    <td className={`${styles.cellMono} ${styles.cellRed}`}>{formatCurrency(e.salary)}</td>
                    <td className={styles.cellMono}>{formatDate(e.joiningDate)}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          e.status === "ACTIVE" ? styles.badgeActive : styles.badgeInactive
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={styles.iconBtn} onClick={() => openEdit(e)} title="Edit">
                          ✎
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => openDelete(e)}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {filtered.length !== employees?.length
              ? `Showing ${Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–${Math.min(
                  page * PAGE_SIZE,
                  filtered.length
                )} of ${filtered.length} filtered (${employees?.length ?? 0} total)`
              : `Showing ${Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–${Math.min(
                  page * PAGE_SIZE,
                  filtered.length
                )} of ${employees?.length ?? 0} employees`}
          </span>
          <div className={styles.paginationBtns}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              ‹
            </button>

            {pageNumbers().map((n) => (
              <button
                key={n}
                className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ""}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}

            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
