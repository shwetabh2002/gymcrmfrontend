"use client";

import { useState } from "react";
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

function badgeClass(status: string, styles: any) {
  if (status === "ACTIVE")   return styles.badgeActive;
  if (status === "INACTIVE") return styles.badgeInactive;
  return styles.badgePending;
}

export default function UsersPage() {
  const { data: members, isLoading, isError } = useMembers();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [selected,    setSelected]    = useState<Member | null>(null);

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (m: Member) => { setSelected(m); setModalOpen(true); };
  const openDelete = (m: Member) => { setSelected(m); setDeleteOpen(true); };

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

      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Users</h1>
          <p className={styles.pageDesc}>Manage all registered gym members and staff.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>⬇ Export</button>
          <button className={styles.btnPrimary} onClick={openCreate}>+ Add Member</button>
        </div>
      </motion.div>

      <motion.div
        className={styles.statStrip}
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
      >
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Total Members</span>
          <span className={styles.statVal}>{members?.length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Active</span>
          <span className={styles.statVal}>{members?.filter((m) => m.memberStatus === "ACTIVE").length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Inactive</span>
          <span className={styles.statVal}>{members?.filter((m) => m.memberStatus === "INACTIVE").length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Suspended</span>
          <span className={styles.statVal}>{members?.filter((m) => m.memberStatus === "SUSPENDED").length ?? "—"}</span>
        </div>
      </motion.div>

      <motion.div
        className={styles.card}
        custom={1} variants={fadeUp} initial="hidden" animate="visible"
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />All Members</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search members…" />
            </div>
            <select className={styles.filterSelect}>
              <option>All Status</option>
              <option>ACTIVE</option>
              <option>INACTIVE</option>
              <option>SUSPENDED</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && <p style={{ padding: "1rem" }}>Loading members…</p>}
          {isError   && <p style={{ padding: "1rem", color: "red" }}>Failed to load members.</p>}

          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members?.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <div className={styles.avatarCell}>
                        <div className={styles.avatar}>{initials(m.name)}</div>
                        <div>
                          <div className={styles.avatarName}>{m.name}</div>
                          <div className={styles.avatarEmail}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.cellMono}>{m.phone}</td>
                    <td>
                      <span className={`${styles.badge} ${badgeClass(m.memberStatus, styles)}`}>
                        {m.memberStatus}
                      </span>
                    </td>
                    <td className={styles.cellMono}>
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => openEdit(m)}
                          title="Edit"
                        >✎</button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => openDelete(m)}
                          title="Delete"
                        >✕</button>
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
            Showing {members?.length ?? 0} members
          </span>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn}>‹</button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
            <button className={styles.pageBtn}>›</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
