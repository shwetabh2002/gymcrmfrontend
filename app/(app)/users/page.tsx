"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./Users.module.css";
import { useMembersList } from "@/services/members/members.hook";
import { Member, membersApi, normalizeMember } from "@/services/members/members.api";
import MemberModal from "./MemberModal";
import DeleteMemberDialog from "./DeleteMemberDialog";
import ImportMembersModal from "./ImportMembersModal";
import ExportExcelBar from "../components/export/ExportExcelBar";
import AddPaymentModal from "./AddPaymentModal";
import { useExportPeriod } from "@/lib/export/use-export-period";
import { fetchAllPaginated } from "@/lib/export/excel";
import {
  membersToExportRows,
  MEMBER_EXPORT_COLUMNS,
} from "@/lib/export/export-mappers";
import { ExportPeriodPreset } from "@/lib/export/date-period";
import MemberHistoryModal from "./MemberHistoryModal";
import RenewalModal from "./RenewalModal";

const PAGE_SIZE = 10;

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

function statusBadgeClass(status: string | undefined, styles: any) {
  if (status === "ACTIVE")   return styles.badgeActive;
  if (status === "EXPIRED")  return styles.badgeExpired;
  return styles.badgeInactive;
}

function memberTypeBadgeClass(type: string | undefined, styles: any) {
  if (type === "New")     return styles.badgeNew;
  if (type === "Old")     return styles.badgeOld;
  return styles.badgeRenewal;
}

function trainingBadgeClass(type: string | undefined, styles: any) {
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

// Helper to get active membership from memberships array
function getActiveMembership(member: Member) {
  return member.memberships?.find(m => m.status === "ACTIVE") || null;
}

// Helper to get membership info with fallback to legacy fields
function getMembershipInfo(member: Member) {
  const activeMembership = getActiveMembership(member);

  if (activeMembership) {
    return {
      totalAmount: activeMembership.totalAmount,
      amountPaid: activeMembership.amountPaid,
      pendingAmount: activeMembership.pendingAmount,
      startDate: activeMembership.startDate,
      expiryDate: activeMembership.expiryDate,
      months: activeMembership.months,
      status: activeMembership.status,
    };
  }

  // Fallback to legacy fields or payment summary
  return {
    totalAmount: member.membershipAmount ?? member.amount ?? 0,
    amountPaid: member.paymentSummary?.totalReceived ?? member.received ?? 0,
    pendingAmount: member.paymentSummary?.totalPending ?? member.pending ?? 0,
    startDate: member.startingDate,
    expiryDate: member.expiryDate,
    months: member.membershipMonths,
    status: member.memberStatus,
  };
}

export default function UsersPage() {
  const [modalOpen,    setModalOpen]    = useState(false);
  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [importOpen,   setImportOpen]   = useState(false);
  const [paymentOpen,  setPaymentOpen]  = useState(false);
  const [renewalOpen,  setRenewalOpen]  = useState(false);
  const [historyOpen,  setHistoryOpen]  = useState(false);
  const [selected,     setSelected]     = useState<Member | null>(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter,  setStatusFilter]  = useState<"ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED">("ALL");
  const [typeFilter,    setTypeFilter]    = useState<"ALL" | "New" | "Old" | "Renewal">("ALL");
  const [trainFilter,   setTrainFilter]   = useState<"ALL" | "PT" | "GT" | "OTHER">("ALL");
  const [pendingFilter, setPendingFilter] = useState<"ALL" | "HAS_PENDING" | "FULLY_PAID">("ALL");
  const [pendingByDate, setPendingByDate] = useState("");
  const [page,          setPage]          = useState(1);
  const {
    period: exportPeriod,
    setPeriod: setExportPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    range: exportRange,
  } = useExportPeriod("all");

  const { data: listResp, isLoading, isError } = useMembersList({
    page,
    limit: PAGE_SIZE,
    search,
    status: statusFilter,
    type: typeFilter,
    training: trainFilter,
    pending: pendingFilter,
    pendingByDate,
    dateFrom: exportRange.dateFrom,
    dateTo: exportRange.dateTo,
  });
  const members = listResp?.data ?? [];
  const summary = listResp?.summary;
  const pagination = listResp?.pagination;

  const openCreate  = () => { setSelected(null); setModalOpen(true); };
  const openEdit    = (m: Member) => { setSelected(m); setModalOpen(true); };
  const openDelete  = (m: Member) => { setSelected(m); setDeleteOpen(true); };
  const openPayment = (m: Member) => { setSelected(m); setPaymentOpen(true); };
  const openRenewal = (m: Member) => { setSelected(m); setRenewalOpen(true); };
  const openHistory = (m: Member) => { setSelected(m); setHistoryOpen(true); };

  // Reset to page 1 whenever filters/search change
  const handleSearch  = (val: string) => { setSearch(val); setPage(1); };
  const handleStatus  = (val: "ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED") => { setStatusFilter(val); setPage(1); };
  const handleType    = (val: "ALL" | "New" | "Old" | "Renewal") => { setTypeFilter(val); setPage(1); };
  const handleTrain   = (val: "ALL" | "PT" | "GT" | "OTHER") => { setTrainFilter(val); setPage(1); };
  const handlePending = (val: "ALL" | "HAS_PENDING" | "FULLY_PAID") => { setPendingFilter(val); setPage(1); };
  const handlePendingByDate = (val: string) => { setPendingByDate(val); setPage(1); };
  const resetPendingByDate = () => { setPendingByDate(""); setPage(1); };
  const handleExportPeriod = (val: ExportPeriodPreset) => {
    setExportPeriod(val);
    setPage(1);
  };

  const exportAllFilteredMembers = async (): Promise<Record<string, unknown>[]> => {
    const all = await fetchAllPaginated(
      (params) =>
        membersApi.getMembersList({
          search,
          status: statusFilter,
          type: typeFilter,
          training: trainFilter,
          pending: pendingFilter,
          pendingByDate,
          dateFrom: exportRange.dateFrom,
          dateTo: exportRange.dateTo,
          ...params,
        }),
      {},
      100,
    );
    return membersToExportRows(all.map(normalizeMember));
  };

  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.total ?? 0;

  // Build page number buttons — show at most 5 around current page
  const pageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className={styles.page}>
      <MemberModal open={modalOpen} onClose={() => setModalOpen(false)} existing={selected} />
      <DeleteMemberDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} member={selected} />
      <ImportMembersModal open={importOpen} onClose={() => setImportOpen(false)} />
      <AddPaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} member={selected} />
      <RenewalModal open={renewalOpen} onClose={() => setRenewalOpen(false)} member={selected} />
      <MemberHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} member={selected} />

      {/* Header */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <h1 className={styles.pageTitle}>Members</h1>
          <p className={styles.pageSubtitle}>Manage gym members and their subscriptions</p>
        </div>
        <div className={styles.headerActions}>
          <ExportExcelBar
            moduleName="members"
            buttonClassName={styles.btnSecondary}
            selectClassName={styles.filterSelect}
            period={exportPeriod}
            customFrom={customFrom}
            customTo={customTo}
            onPeriodChange={handleExportPeriod}
            onCustomFromChange={(v) => { setCustomFrom(v); setPage(1); }}
            onCustomToChange={(v) => { setCustomTo(v); setPage(1); }}
            resolveRowsForExport={exportAllFilteredMembers}
            columns={MEMBER_EXPORT_COLUMNS}
            sheetName="Members"
            hidePeriodControls
          />
          <button className={styles.btnSecondary} onClick={() => setImportOpen(true)}>
            ⬆ Import Excel
          </button>
          <button className={styles.btnPrimary} onClick={openCreate}>
            + Add Member
          </button>
        </div>
      </motion.div>

      {/* Stat Strip */}
      <motion.div className={styles.statStrip} custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Total Members</span>
          <span className={styles.statVal}>{summary?.totalMembers ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Active</span>
          <span className={styles.statVal}>{summary?.activeMembers ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Total Received</span>
          <span className={`${styles.statVal} ${styles.statValGreen}`}>{formatCurrency(summary?.totalReceived)}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Total Pending</span>
          <span className={`${styles.statVal} ${styles.statValRed}`}>{formatCurrency(summary?.totalPending)}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />PT Members</span>
          <span className={styles.statVal}>{summary?.ptMembers ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />GT Members</span>
          <span className={styles.statVal}>{summary?.gtMembers ?? "—"}</span>
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
                value={search} onChange={e => handleSearch(e.target.value)} />
            </div>
            <select className={styles.filterSelect} value={statusFilter} onChange={e => handleStatus(e.target.value as "ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED")}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <select className={styles.filterSelect} value={typeFilter} onChange={e => handleType(e.target.value as "ALL" | "New" | "Old" | "Renewal")}>
              <option value="ALL">All Types</option>
              <option value="New">New</option>
              <option value="Old">Old</option>
              <option value="Renewal">Renewal</option>
            </select>
            <select className={styles.filterSelect} value={trainFilter} onChange={e => handleTrain(e.target.value as "ALL" | "PT" | "GT" | "OTHER")}>
              <option value="ALL">All Training</option>
              <option value="PT">PT</option>
              <option value="GT">GT</option>
              <option value="OTHER">Other</option>
            </select>
            <select className={styles.filterSelect} value={pendingFilter} onChange={e => handlePending(e.target.value as "ALL" | "HAS_PENDING" | "FULLY_PAID")}>
              <option value="ALL">All Payments</option>
              <option value="HAS_PENDING">⚠ Has Pending</option>
              <option value="FULLY_PAID">✓ Fully Paid</option>
            </select>
            <input
              className={styles.filterSelect}
              type="date"
              value={pendingByDate}
              onChange={e => handlePendingByDate(e.target.value)}
              title="Show pending members due by date"
            />
            <button className={styles.btnSecondary} onClick={resetPendingByDate}>
              Reset
            </button>
            <select
              className={styles.filterSelect}
              value={exportPeriod}
              onChange={(e) => handleExportPeriod(e.target.value as ExportPeriodPreset)}
              title="Filter & export period"
            >
              <option value="all">All time</option>
              <option value="this_week">This week</option>
              <option value="last_week">Last week</option>
              <option value="this_month">This month</option>
              <option value="last_month">Last month</option>
              <option value="custom">Custom range</option>
            </select>
            {exportPeriod === "custom" && (
              <>
                <input
                  className={styles.filterSelect}
                  type="date"
                  value={customFrom}
                  onChange={(e) => { setCustomFrom(e.target.value); setPage(1); }}
                />
                <input
                  className={styles.filterSelect}
                  type="date"
                  value={customTo}
                  onChange={(e) => { setCustomTo(e.target.value); setPage(1); }}
                />
              </>
            )}
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
                  <th>Type</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr><td colSpan={13} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-2)", fontSize: 13 }}>
                    {totalItems === 0 ? "No members match your filters." : "No members found on this page."}
                  </td></tr>
                )}
                {members.map((m) => (
                  <tr key={m._id} className={styles.clickableRow} onClick={() => openHistory(m)}>
                    <td className={styles.cellMono} style={{ color: "var(--text-3)", fontSize: 11 }}>{m.idNo ?? "—"}</td>
                    <td>
                      <div className={styles.avatarCell}>
                        <div className={styles.avatar}>{initials(m.name)}</div>
                        <div>
                          <div className={styles.avatarName}>
                            {m.name}
                            {getMembershipInfo(m).pendingAmount > 0 && (
                              <span style={{
                                marginLeft: '6px',
                                fontSize: '10px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 600
                              }}>
                                ⚠ Pending
                              </span>
                            )}
                          </div>
                          {m.instagramHandle && <div className={styles.avatarSub}>{m.instagramHandle}</div>}
                        </div>
                      </div>
                    </td>
                    <td className={styles.cellMono}>{m.contactNumber || m.phone || "—"}</td>
                    <td className={styles.cellMono}>{m.membershipPlan || (getMembershipInfo(m).months ? `${getMembershipInfo(m).months} months` : "—")}</td>
                    <td>
                      <span className={`${styles.badge} ${trainingBadgeClass(m.trainingType, styles)}`}>
                        {m.trainingType ?? "OTHER"}
                      </span>
                    </td>
                    <td className={styles.cellPerson}>{m.trainer ?? "—"}</td>
                    <td className={styles.cellMono}>{formatCurrency(getMembershipInfo(m).totalAmount)}</td>
                    <td className={`${styles.cellMono} ${styles.cellGreen}`}>
                      {formatCurrency(getMembershipInfo(m).amountPaid)}
                    </td>
                    <td className={`${styles.cellMono} ${getMembershipInfo(m).pendingAmount > 0 ? styles.cellRed : ""}`}>
                      {getMembershipInfo(m).pendingAmount > 0
                        ? formatCurrency(getMembershipInfo(m).pendingAmount)
                        : <span style={{ color: "var(--text-3)" }}>Nil</span>}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${memberTypeBadgeClass(m.memberType, styles)}`}>
                        {m.memberType ?? "Renewal"}
                      </span>
                    </td>
                    <td className={styles.cellMono}>{formatDate(getMembershipInfo(m).expiryDate)}</td>
                    <td>
                      <span className={`${styles.badge} ${statusBadgeClass(m.memberStatus, styles)}`}>
                        {m.memberStatus ?? "ACTIVE"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); openHistory(m); }} title="View History">◷</button>
                        <button className={styles.renewBtn} onClick={(e) => { e.stopPropagation(); openRenewal(m); }} title="Renewal">Renew</button>
                        <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); openPayment(m); }} title="Add Payment" style={{ fontSize: '14px' }}>₹</button>
                        <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); openEdit(m); }} title="Edit">✎</button>
                        <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={(e) => { e.stopPropagation(); openDelete(m); }} title="Delete">✕</button>
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
            {`Showing ${totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalItems)} of ${totalItems} members`}
          </span>
          <div className={styles.paginationBtns}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >‹</button>

            {pageNumbers().map(n => (
              <button
                key={n}
                className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ""}`}
                onClick={() => setPage(n)}
              >{n}</button>
            ))}

            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >›</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}