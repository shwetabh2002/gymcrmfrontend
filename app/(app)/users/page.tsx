"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import styles from "./Users.module.css";
import { useMembers } from "@/services/members/members.hook";
import { Member } from "@/services/members/members.api";
import { useAuth } from "@/lib/context/AuthContext";
import {
  canCreateMembers,
  canDeleteMembers,
  canUpdateMembers,
} from "@/lib/rbac";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import { resolveInvoiceTax } from "@/lib/tax";
import { MoneyWithGst } from "@/components/MoneyWithGst";
import { RowActions } from "@/components/RowActions";
import MemberModal from "./MemberModal";
import DeleteMemberDialog from "./DeleteMemberDialog";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function statusBadgeClass(status: string, styles: any) {
  if (status === "ACTIVE")   return styles.badgeActive;
  if (status === "EXPIRED" || status === "SUSPENDED")  return styles.badgeExpired;
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
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function UsersPage() {
  const { user } = useAuth();
  const canCreate = canCreateMembers(user?.role, user?.permissions);
  const canUpdate = canUpdateMembers(user?.role, user?.permissions);
  const canDelete = canDeleteMembers(user?.role, user?.permissions);
  const { data: members, isLoading, isError } = useMembers();
  const { data: gymSettings } = useGymSettings();
  const { taxPercentage, taxMode } = resolveInvoiceTax(gymSettings);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [selected,     setSelected]     = useState<Member | null>(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [trainFilter,  setTrainFilter]  = useState("ALL");

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (m: Member) => { setSelected(m); setModalOpen(true); };
  const openDelete = (m: Member) => { setSelected(m); setDeleteOpen(true); };

  const filtered = useMemo(() => {
    if (!members) return [];
    return members.filter(m => {
      const phone = m.contactNumber || m.phone || "";
      const q = search.toLowerCase();
      const matchSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        phone.includes(q) ||
        (m.idNo ?? "").toLowerCase().includes(q) ||
        (m.trainer ?? "").toLowerCase().includes(q) ||
        (m.salesPerson ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || m.memberStatus === statusFilter;
      const matchTrain  = trainFilter  === "ALL" || m.trainingType === trainFilter;
      return matchSearch && matchStatus && matchTrain;
    });
  }, [members, search, statusFilter, trainFilter]);

  return (
    <div className={styles.page}>
      <MemberModal open={modalOpen} onClose={() => setModalOpen(false)} existing={selected} />
      <DeleteMemberDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        member={selected}
      />

      <motion.div className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Members</h1>
          <p className={styles.pageDesc}>Manage gym members, plans, and payments.</p>
        </div>
        {canCreate && (
          <button className={styles.btnPrimary} onClick={openCreate}>+ Add Member</button>
        )}
      </motion.div>

      <motion.div className={styles.card} custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />All Members</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search name, ID, phone, trainer…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select className={styles.filterSelect} value={trainFilter} onChange={e => setTrainFilter(e.target.value)}>
              <option value="ALL">All Training</option>
              <option value="PT">PT</option>
              <option value="GT">GT</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && <p style={{ padding: "1.5rem 22px", color: "var(--text-2)", fontSize: 13 }}>Loading members…</p>}
          {isError   && <p style={{ padding: "1.5rem 22px", color: "#e63946", fontSize: 13 }}>Failed to load members. Please refresh.</p>}

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
                  <tr><td colSpan={13} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-2)", fontSize: 13 }}>
                    {members?.length === 0 ? "No members yet. Add one to get started." : "No members match your filters."}
                  </td></tr>
                )}
                {filtered.map((m) => (
                  <tr key={m._id}>
                    <td className={styles.cellMono} style={{ color: "var(--text-3)", fontSize: 11 }}>{m.idNo ?? "—"}</td>
                    <td>
                      <div className={styles.avatarCell}>
                        <div className={styles.avatar}>{initials(m.name)}</div>
                        <div>
                          <div className={styles.avatarName}>{m.name}</div>
                          {m.instagramHandle && <div className={styles.avatarSub}>{m.instagramHandle}</div>}
                        </div>
                      </div>
                    </td>
                    <td className={styles.cellMono}>{m.contactNumber || m.phone || "—"}</td>
                    <td className={styles.cellMono}>{m.membershipPlan ?? "—"}</td>
                    <td>
                      {m.trainingType ? (
                        <span className={`${styles.badge} ${trainingBadgeClass(m.trainingType, styles)}`}>
                          {m.trainingType}
                        </span>
                      ) : "—"}
                    </td>
                    <td className={styles.cellPerson}>{m.trainer ?? "—"}</td>
                    <td className={styles.cellPerson}>{m.salesPerson ?? "—"}</td>
                    <td className={styles.cellMono}>
                      <MoneyWithGst
                        amount={m.amount}
                        taxPercentage={taxPercentage}
                        taxMode={taxMode}
                      />
                    </td>
                    <td className={`${styles.cellMono} ${styles.cellGreen}`}>
                      <MoneyWithGst
                        amount={m.received}
                        taxPercentage={taxPercentage}
                        taxMode={taxMode}
                      />
                    </td>
                    <td className={`${styles.cellMono} ${(m.pending ?? 0) > 0 ? styles.cellRed : ""}`}>
                      {(m.pending ?? 0) > 0 ? (
                        <MoneyWithGst
                          amount={m.pending}
                          taxPercentage={taxPercentage}
                          taxMode={taxMode}
                        />
                      ) : (
                        <span style={{ color: "var(--text-3)" }}>Nil</span>
                      )}
                    </td>
                    <td className={styles.cellMono}>{formatDate(m.expiryDate)}</td>
                    <td>
                      <span className={`${styles.badge} ${statusBadgeClass(m.memberStatus, styles)}`}>
                        {m.memberStatus}
                      </span>
                    </td>
                    <td>
                      <RowActions
                        actions={[
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
            {filtered.length !== members?.length
              ? `Showing ${filtered.length} of ${members?.length ?? 0} members`
              : `${members?.length ?? 0} member${members?.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
