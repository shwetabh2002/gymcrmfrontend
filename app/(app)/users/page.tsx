"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import styles from "./Users.module.css";
import { useMembers } from "@/services/members/members.hook";
import { Member } from "@/services/members/members.api";
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
  if (status === "EXPIRED")  return styles.badgeExpired;
  return styles.badgeInactive;
}

function memberTypeBadgeClass(type: string, styles: any) {
  if (type === "New")     return styles.badgeNew;
  if (type === "Old")     return styles.badgeOld;
  return styles.badgeRenewal;
}

function trainingBadgeClass(type: string, styles: any) {
  if (type === "PT") return styles.badgePT;
  if (type === "GT") return styles.badgeGT;
  return styles.badgePending;
}

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

export default function UsersPage() {
  const { data: members, isLoading, isError } = useMembers();

  const [modalOpen,    setModalOpen]    = useState(false);
  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [selected,     setSelected]     = useState<Member | null>(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter,   setTypeFilter]   = useState("ALL");
  const [trainFilter,  setTrainFilter]  = useState("ALL");

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (m: Member) => { setSelected(m); setModalOpen(true); };
  const openDelete = (m: Member) => { setSelected(m); setDeleteOpen(true); };

  const filtered = useMemo(() => {
    if (!members) return [];
    return members.filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        m.contactNumber.includes(q) ||
        (m.idNo ?? "").toLowerCase().includes(q) ||
        (m.trainer ?? "").toLowerCase().includes(q) ||
        (m.salesPerson ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || m.memberStatus === statusFilter;
      const matchType   = typeFilter   === "ALL" || m.memberType === typeFilter;
      const matchTrain  = trainFilter  === "ALL" || m.trainingType === trainFilter;
      return matchSearch && matchStatus && matchType && matchTrain;
    });
  }, [members, search, statusFilter, typeFilter, trainFilter]);

  const totalPending  = filtered.reduce((s, m) => s + (m.pending  ?? 0), 0);
  const totalReceived = filtered.reduce((s, m) => s + (m.received ?? 0), 0);

  return (
    <div className={styles.page}>
      <MemberModal open={modalOpen} onClose={() => setModalOpen(false)} existing={selected} />
      <DeleteMemberDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} member={selected} />

      {/* Header */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Members</h1>
          <p className={styles.pageDesc}>Manage all registered gym members and their details.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>⬇ Export</button>
          <button className={styles.btnPrimary} onClick={openCreate}>+ Add Member</button>
        </div>
      </motion.div>

      {/* Stat Strip */}
      <motion.div className={styles.statStrip} custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Total Members</span>
          <span className={styles.statVal}>{members?.length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Active</span>
          <span className={styles.statVal}>{members?.filter(m => m.memberStatus === "ACTIVE").length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Total Received</span>
          <span className={`${styles.statVal} ${styles.statValGreen}`}>{formatCurrency(totalReceived)}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Total Pending</span>
          <span className={`${styles.statVal} ${styles.statValRed}`}>{formatCurrency(totalPending)}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />PT Members</span>
          <span className={styles.statVal}>{members?.filter(m => m.trainingType === "PT").length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />GT Members</span>
          <span className={styles.statVal}>{members?.filter(m => m.trainingType === "GT").length ?? "—"}</span>
        </div>
      </motion.div>

      {/* Table Card */}
      <motion.div className={styles.card} custom={1} variants={fadeUp} initial="hidden" animate="visible">
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
              <option value="EXPIRED">Expired</option>
            </select>
            <select className={styles.filterSelect} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="New">New</option>
              <option value="Old">Old</option>
              <option value="Renewal">Renewal</option>
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
                  <th>Amount</th>
                  <th>Received</th>
                  <th>Pending</th>
                  <th>MOP</th>
                  <th>Type</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={14} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-2)", fontSize: 13 }}>
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
                    <td className={styles.cellMono}>{m.contactNumber}</td>
                    <td className={styles.cellMono}>{m.membershipPlan ?? "—"}</td>
                    <td>
                      <span className={`${styles.badge} ${trainingBadgeClass(m.trainingType, styles)}`}>
                        {m.trainingType}
                      </span>
                    </td>
                    <td className={styles.cellPerson}>{m.trainer ?? "—"}</td>
                    <td className={styles.cellMono}>{formatCurrency(m.amount)}</td>
                    <td className={`${styles.cellMono} ${styles.cellGreen}`}>{formatCurrency(m.received)}</td>
                    <td className={`${styles.cellMono} ${m.pending > 0 ? styles.cellRed : ""}`}>
                      {m.pending > 0 ? formatCurrency(m.pending) : <span style={{ color: "var(--text-3)" }}>Nil</span>}
                    </td>
                    <td className={styles.cellMono} style={{ fontSize: 11 }}>{m.mop ?? "—"}</td>
                    <td>
                      <span className={`${styles.badge} ${memberTypeBadgeClass(m.memberType, styles)}`}>
                        {m.memberType}
                      </span>
                    </td>
                    <td className={styles.cellMono}>{formatDate(m.expiryDate)}</td>
                    <td>
                      <span className={`${styles.badge} ${statusBadgeClass(m.memberStatus, styles)}`}>
                        {m.memberStatus}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={styles.iconBtn} onClick={() => openEdit(m)} title="Edit">✎</button>
                        <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => openDelete(m)} title="Delete">✕</button>
                      </div>
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
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn} disabled>‹</button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
            <button className={styles.pageBtn} disabled>›</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
