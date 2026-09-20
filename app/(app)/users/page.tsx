"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import styles from "./Users.module.css";
import { useMembersPaged } from "@/services/members/members.hook";
import { Member } from "@/services/members/members.api";
import { useAuth } from "@/lib/context/AuthContext";
import {
  canCreateMembers,
  canDeleteMembers,
  canUpdateMembers,
} from "@/lib/rbac";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import { resolveInvoiceTax, resolveRecordTax } from "@/lib/tax";
import { MoneyWithGst } from "@/components/MoneyWithGst";
import { RowActions } from "@/components/RowActions";
import MemberModal from "./MemberModal";
import DeleteMemberDialog from "./DeleteMemberDialog";
import MemberLifecycleModal from "./MemberLifecycleModal";
import { EASE_OUT_EXPO } from "@/config/motion";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  FilterBar,
  FilterField,
  FilterSearch,
  FilterSelect,
} from "@/components/FilterBar/FilterBar";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: EASE_OUT_EXPO },
  }),
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusBadgeClass(status: string, styles: any) {
  if (status === "ACTIVE") return styles.badgeActive;
  if (status === "EXPIRED" || status === "SUSPENDED")
    return styles.badgeExpired;
  return styles.badgeInactive;
}

function trainingBadgeClass(type: string, styles: any) {
  if (type === "PT") return styles.badgePT;
  if (type === "GT") return styles.badgeGT;
  return styles.badgePending;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Rows per page. Small enough to render instantly, large enough to scan. */
const MEMBERS_PAGE_SIZE = 25;

export default function UsersPage() {
  const { user } = useAuth();
  const canCreate = canCreateMembers(user?.role, user?.permissions);
  const canUpdate = canUpdateMembers(user?.role, user?.permissions);
  const canDelete = canDeleteMembers(user?.role, user?.permissions);
  const [page, setPage] = useState(1);
  const [search, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [trainFilter, setTrainFilter] = useState("ALL");
  const [duesFilter, setDuesFilter] = useState("ALL");
  /**
   * Typing hits the database, so wait for a pause instead of firing a query per
   * keystroke.
   */
  const debouncedSearch = useDebouncedValue(search, 300);

  const activeFilterCount = [
    search.trim() !== "",
    statusFilter !== "ALL",
    trainFilter !== "ALL",
    duesFilter !== "ALL",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("ALL");
    setTrainFilter("ALL");
    setDuesFilter("ALL");
  };

  const {
    data: paged,
    isLoading,
    isError,
  } = useMembersPaged({
    page,
    limit: MEMBERS_PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter,
    trainingType: trainFilter,
    hasPending: duesFilter === "PENDING" ? "true" : undefined,
  });

  const members = paged?.items;
  const total = paged?.total ?? 0;
  const pages = paged?.pages ?? 1;

  // Any filter change means the current page number no longer makes sense.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, trainFilter, duesFilter]);
  const { data: gymSettings } = useGymSettings();
  const { taxPercentage, taxMode } = resolveInvoiceTax(gymSettings);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const openCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };
  const openEdit = (m: Member) => {
    setSelected(m);
    setModalOpen(true);
  };
  const openDelete = (m: Member) => {
    setSelected(m);
    setDeleteOpen(true);
  };
  const openView = (m: Member) => {
    setSelected(m);
    setViewOpen(true);
  };

  // Search and filters are applied by the server, so this page renders the
  // rows it was handed rather than filtering a full copy of the gym.
  const filtered = members ?? [];

  return (
    <div className={styles.page}>
      <MemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        existing={selected}
      />
      <DeleteMemberDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        member={selected}
      />
      <MemberLifecycleModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        member={selected}
      />

      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Members</h1>
          <p className={styles.pageDesc}>
            Manage gym members, plans, and payments.{" "}
            <Link
              href="/dues"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              Open partial dues queue
            </Link>
          </p>
        </div>
        {canCreate && (
          <button className={styles.btnPrimary} onClick={openCreate}>
            + Add Member
          </button>
        )}
      </motion.div>

      <motion.div
        className={styles.card}
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            All Members
          </h2>
        </div>
        <FilterBar
          title="Member filters"
          activeCount={activeFilterCount}
          onClear={clearFilters}
        >
          <FilterField label="Search" grow>
            <FilterSearch
              value={search}
              onChange={setSearchInput}
              placeholder="Name, ID, phone, trainer…"
            />
          </FilterField>
          <FilterField label="Status">
            <FilterSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </FilterSelect>
          </FilterField>
          <FilterField label="Training">
            <FilterSelect value={trainFilter} onChange={setTrainFilter}>
              <option value="ALL">All types</option>
              <option value="PT">Personal (PT)</option>
              <option value="GT">Group (GT)</option>
              <option value="NONE">None</option>
              <option value="OTHER">Other</option>
            </FilterSelect>
          </FilterField>
          <FilterField label="Balance">
            <FilterSelect value={duesFilter} onChange={setDuesFilter}>
              <option value="ALL">All balances</option>
              <option value="PENDING">Pending dues</option>
            </FilterSelect>
          </FilterField>
        </FilterBar>

        <div className={styles.tableWrap}>
          {isLoading && (
            <p
              style={{
                padding: "1.5rem 22px",
                color: "var(--text-2)",
                fontSize: 13,
              }}
            >
              Loading members…
            </p>
          )}
          {isError && (
            <p
              style={{ padding: "1.5rem 22px", color: "#e63946", fontSize: 13 }}
            >
              Failed to load members. Please refresh.
            </p>
          )}

          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Plan</th>
                  <th>Training</th>
                  <th>Trainer</th>
                  <th>Sales</th>
                  <th>Amount</th>
                  <th>Received</th>
                  <th>Pending</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={13}
                      style={{
                        padding: "2.5rem",
                        textAlign: "center",
                        color: "var(--text-2)",
                        fontSize: 13,
                      }}
                    >
                      {members?.length === 0
                        ? "No members yet. Add one to get started."
                        : "No members match your filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((m) => (
                  <tr key={m._id}>
                    <td
                      className={styles.cellMono}
                      style={{ color: "var(--text-3)", fontSize: 11 }}
                    >
                      {m.idNo ?? "—"}
                    </td>
                    <td>
                      <div className={styles.avatarCell}>
                        <div className={styles.avatar}>{initials(m.name)}</div>
                        <div>
                          <div className={styles.avatarName}>{m.name}</div>
                          {m.instagramHandle && (
                            <div className={styles.avatarSub}>
                              {m.instagramHandle}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.cellMono}>
                      {m.contactNumber || m.phone
                        ? `${m.countryCode || "+91"} ${m.contactNumber || m.phone}`
                        : "—"}
                    </td>
                    <td className={styles.cellMono}>
                      {m.membershipPlan ?? "—"}
                    </td>
                    <td>
                      {m.trainingType ? (
                        <span
                          className={`${styles.badge} ${trainingBadgeClass(m.trainingType, styles)}`}
                        >
                          {m.trainingType}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={styles.cellPerson}>{m.trainer ?? "—"}</td>
                    <td className={styles.cellPerson}>
                      {m.salesPerson ?? "—"}
                    </td>
                    <td className={styles.cellMono}>
                      <MoneyWithGst
                        amount={m.amount}
                        {...resolveRecordTax(
                          { taxPercentage, taxMode },
                          m,
                        )}
                      />
                    </td>
                    <td className={`${styles.cellMono} ${styles.cellGreen}`}>
                      <MoneyWithGst
                        amount={m.received}
                        {...resolveRecordTax(
                          { taxPercentage, taxMode },
                          m,
                        )}
                      />
                    </td>
                    <td
                      className={`${styles.cellMono} ${(m.pending ?? 0) > 0 ? styles.cellRed : ""}`}
                    >
                      {(m.pending ?? 0) > 0 ? (
                        <div>
                          <MoneyWithGst
                            amount={m.pending}
                            {...resolveRecordTax(
                              { taxPercentage, taxMode },
                              m,
                            )}
                          />
                          {m.dueReminderDate ? (
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--text-3)",
                                marginTop: 2,
                              }}
                            >
                              Due {formatDate(m.dueReminderDate)}
                            </div>
                          ) : (
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--text-3)",
                                marginTop: 2,
                              }}
                            >
                              <Link href="/dues">Set reminder →</Link>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-3)" }}>Nil</span>
                      )}
                    </td>
                    <td className={styles.cellMono}>
                      {formatDate(m.expiryDate)}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${statusBadgeClass(m.memberStatus, styles)}`}
                      >
                        {m.memberStatus}
                      </span>
                    </td>
                    <td>
                      <RowActions
                        actions={[
                          {
                            label: "View",
                            onClick: () => openView(m),
                          },
                          ...(canUpdate
                            ? [{ label: "Edit", onClick: () => openEdit(m) }]
                            : []),
                          ...(canDelete
                            ? [
                                {
                                  label: "Delete",
                                  onClick: () => openDelete(m),
                                  tone: "danger" as const,
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            {total === 0
              ? "No members"
              : `Showing ${(page - 1) * MEMBERS_PAGE_SIZE + 1}–${
                  (page - 1) * MEMBERS_PAGE_SIZE + filtered.length
                } of ${total} member${total !== 1 ? "s" : ""}`}
          </span>

          {pages > 1 ? (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginLeft: "auto",
              }}
            >
              <button
                type="button"
                className={styles.pageNav}
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>
              <span className={styles.paginationInfo}>
                Page {page} of {pages}
              </span>
              <button
                type="button"
                className={styles.pageNav}
                disabled={page >= pages || isLoading}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next →
              </button>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
