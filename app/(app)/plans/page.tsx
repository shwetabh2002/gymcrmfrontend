"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./Plans.module.css";
import { usePlans } from "@/services/plans/plans.hook";
import { Plan } from "@/services/plans/plans.api";
import PlanModal from "./PlanModal";
import DeletePlanDialog from "./DeletePlanDialog";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function badgeClass(status: string, styles: any) {
  if (status === "ACTIVE")   return styles.badgeActive;
  if (status === "INACTIVE") return styles.badgeInactive;
  return styles.badgePending;
}

function durationLabel(duration: number, type: string) {
  return `${duration} ${type.charAt(0) + type.slice(1).toLowerCase()}`;
}

export default function PlansPage() {
  const { data: plans, isLoading, isError } = usePlans();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected,   setSelected]   = useState<Plan | null>(null);

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (p: Plan) => { setSelected(p); setModalOpen(true); };
  const openDelete = (p: Plan) => { setSelected(p); setDeleteOpen(true); };

  return (
    <div className={styles.page}>

      <PlanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        existing={selected}
      />

      <DeletePlanDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        plan={selected}
      />

      {/* Header */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Subscription Plans</h1>
          <p className={styles.pageDesc}>Manage plans, pricing and member subscriptions.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>⬇ Export</button>
          <button className={styles.btnPrimary} onClick={openCreate}>+ New Plan</button>
        </div>
      </motion.div>

      {/* Stats Strip */}
      <motion.div
        className={styles.statStrip}
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
      >
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Total Plans</span>
          <span className={styles.statVal}>{plans?.length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Active</span>
          <span className={styles.statVal}>{plans?.filter((p) => p.status === "ACTIVE").length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Inactive</span>
          <span className={styles.statVal}>{plans?.filter((p) => p.status === "INACTIVE").length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}><span className={styles.statLabelDot} />Archived</span>
          <span className={styles.statVal}>{plans?.filter((p) => p.status === "ARCHIVED").length ?? "—"}</span>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <motion.div
        className={styles.plansGrid}
        custom={1} variants={fadeUp} initial="hidden" animate="visible"
      >
        {isLoading && <p style={{ padding: "1rem" }}>Loading plans…</p>}
        {isError   && <p style={{ padding: "1rem", color: "red" }}>Failed to load plans.</p>}

        {!isLoading && !isError && plans?.map((plan) => (
          <div key={plan._id} className={styles.planCard}>
            <div
              className={styles.planAccent}
              style={{ background: `linear-gradient(90deg, var(--red), transparent)` }}
            />
            <div className={styles.planBody}>
              <div className={styles.planTop}>
                <span className={styles.planName}>{plan.name}</span>
                <span className={styles.planPrice} style={{ color: "var(--red)" }}>
                  ₹{plan.price}
                </span>
              </div>
              <div className={styles.planMembers}>
                {durationLabel(plan.duration, plan.durationType)}
              </div>
              {plan.description && (
                <div className={styles.planFeatures}>
                  <div className={styles.planFeature}>
                    <span className={styles.planFeatureCheck} style={{ color: "var(--red)" }}>✓</span>
                    {plan.description}
                  </div>
                </div>
              )}
              <div className={styles.planActions}>
                <span className={`${styles.badge} ${badgeClass(plan.status, styles)}`}>
                  {plan.status}
                </span>
                <button
                  className={styles.btnSecondary}
                  onClick={() => openEdit(plan)}
                >
                  ✎ Edit
                </button>
                <button
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  onClick={() => openDelete(plan)}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        className={styles.card}
        custom={2} variants={fadeUp} initial="hidden" animate="visible"
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />All Plans
          </h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search plans…" />
            </div>
            <select className={styles.filterSelect}>
              <option>All Status</option>
              <option>ACTIVE</option>
              <option>INACTIVE</option>
              <option>ARCHIVED</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && <p style={{ padding: "1rem" }}>Loading…</p>}
          {isError   && <p style={{ padding: "1rem", color: "red" }}>Failed to load plans.</p>}

          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans?.map((plan) => (
                  <tr key={plan._id}>
                    <td className={styles.cellName}>{plan.name}</td>
                    <td className={styles.cellMono}>
                      {durationLabel(plan.duration, plan.durationType)}
                    </td>
                    <td className={styles.cellAmount}>₹{plan.price}</td>
                    <td>
                      <span className={`${styles.badge} ${badgeClass(plan.status, styles)}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td className={styles.cellMono}>
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => openEdit(plan)}
                          title="Edit"
                        >✎</button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => openDelete(plan)}
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
            Showing {plans?.length ?? 0} plans
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
