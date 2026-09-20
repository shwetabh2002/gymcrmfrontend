"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import styles from "./Plans.module.css";
import { usePlans } from "@/services/plans/plans.hook";
import { Plan } from "@/services/plans/plans.api";
import PlanModal from "./PlanModal";
import DeletePlanDialog from "./DeletePlanDialog";
import { RowActions } from "@/components/RowActions";
import { EASE_OUT_EXPO } from "@/config/motion";
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
    transition: { duration: 0.4, delay: i * 0.07, ease: EASE_OUT_EXPO },
  }),
};

function badgeClass(status: string, styles: any) {
  if (status === "ACTIVE") return styles.badgeActive;
  if (status === "INACTIVE") return styles.badgeInactive;
  return styles.badgePending;
}

function durationLabel(duration: number, type: string) {
  return `${duration} ${type.charAt(0) + type.slice(1).toLowerCase()}`;
}

export default function PlansPage() {
  const { data: plans, isLoading, isError } = usePlans();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [durationFilter, setDurationFilter] = useState("ALL");

  const filtered = useMemo(() => {
    const list = plans ?? [];
    const q = search.toLowerCase().trim();
    return list.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        String(p.price).includes(q);
      const matchesStatus =
        statusFilter === "ALL" || p.status === statusFilter;
      const matchesDuration =
        durationFilter === "ALL" || p.durationType === durationFilter;
      return matchesSearch && matchesStatus && matchesDuration;
    });
  }, [plans, search, statusFilter, durationFilter]);

  const activeFilterCount = [
    search.trim() !== "",
    statusFilter !== "ALL",
    durationFilter !== "ALL",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setDurationFilter("ALL");
  };

  const openCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };
  const openEdit = (p: Plan) => {
    setSelected(p);
    setModalOpen(true);
  };
  const openDelete = (p: Plan) => {
    setSelected(p);
    setDeleteOpen(true);
  };

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
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Subscription Plans</h1>
          <p className={styles.pageDesc}>
            Manage plans, pricing and member subscriptions.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>⬇ Export</button>
          <button className={styles.btnPrimary} onClick={openCreate}>
            + New Plan
          </button>
        </div>
      </motion.div>

      {/* Stats Strip */}
      <motion.div
        className={styles.statStrip}
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <span className={styles.statLabelDot} />
            Total Plans
          </span>
          <span className={styles.statVal}>{plans?.length ?? "—"}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <span className={styles.statLabelDot} />
            Active
          </span>
          <span className={styles.statVal}>
            {plans?.filter((p) => p.status === "ACTIVE").length ?? "—"}
          </span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <span className={styles.statLabelDot} />
            Inactive
          </span>
          <span className={styles.statVal}>
            {plans?.filter((p) => p.status === "INACTIVE").length ?? "—"}
          </span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <span className={styles.statLabelDot} />
            Archived
          </span>
          <span className={styles.statVal}>
            {plans?.filter((p) => p.status === "ARCHIVED").length ?? "—"}
          </span>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <motion.div
        className={styles.plansGrid}
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        {isLoading && <p style={{ padding: "1rem" }}>Loading plans…</p>}
        {isError && (
          <p style={{ padding: "1rem", color: "red" }}>Failed to load plans.</p>
        )}

        {!isLoading &&
          !isError &&
          plans?.map((plan) => (
            <div key={plan._id} className={styles.planCard}>
              <div
                className={styles.planAccent}
                style={{
                  background: `linear-gradient(90deg, var(--red), transparent)`,
                }}
              />
              <div className={styles.planBody}>
                <div className={styles.planTop}>
                  <span className={styles.planName}>{plan.name}</span>
                  <span
                    className={styles.planPrice}
                    style={{ color: "var(--red)" }}
                  >
                    ₹{plan.price}
                  </span>
                </div>
                <div className={styles.planMembers}>
                  {durationLabel(plan.duration, plan.durationType)}
                </div>
                {plan.description && (
                  <div className={styles.planFeatures}>
                    <div className={styles.planFeature}>
                      <span
                        className={styles.planFeatureCheck}
                        style={{ color: "var(--red)" }}
                      >
                        ✓
                      </span>
                      {plan.description}
                    </div>
                  </div>
                )}
                <div className={styles.planActions}>
                  <span
                    className={`${styles.badge} ${badgeClass(plan.status, styles)}`}
                  >
                    {plan.status}
                  </span>
                  <RowActions
                    actions={[
                      { label: "Edit", onClick: () => openEdit(plan) },
                      {
                        label: "Archive",
                        onClick: () => openDelete(plan),
                        tone: "danger",
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          ))}
      </motion.div>

      {/* Table */}
      <motion.div
        className={styles.card}
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            All Plans
          </h2>
        </div>
        <FilterBar
          title="Plan filters"
          activeCount={activeFilterCount}
          onClear={clearFilters}
        >
          <FilterField label="Search" grow>
            <FilterSearch
              value={search}
              onChange={setSearch}
              placeholder="Plan name or price…"
            />
          </FilterField>
          <FilterField label="Status">
            <FilterSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </FilterSelect>
          </FilterField>
          <FilterField label="Duration type">
            <FilterSelect value={durationFilter} onChange={setDurationFilter}>
              <option value="ALL">All durations</option>
              <option value="DAYS">Days</option>
              <option value="MONTHS">Months</option>
              <option value="YEARS">Years</option>
            </FilterSelect>
          </FilterField>
        </FilterBar>

        <div className={styles.tableWrap}>
          {isLoading && <p style={{ padding: "1rem" }}>Loading…</p>}
          {isError && (
            <p style={{ padding: "1rem", color: "red" }}>
              Failed to load plans.
            </p>
          )}

          {!isLoading && !isError && (
            <>
              {filtered.length === 0 ? (
                <p style={{ padding: "1.5rem 22px", color: "var(--text-2)", fontSize: 13 }}>
                  No plans match these filters.
                </p>
              ) : (
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
                {filtered.map((plan) => (
                  <tr key={plan._id}>
                    <td className={styles.cellName}>{plan.name}</td>
                    <td className={styles.cellMono}>
                      {durationLabel(plan.duration, plan.durationType)}
                    </td>
                    <td className={styles.cellAmount}>₹{plan.price}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${badgeClass(plan.status, styles)}`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className={styles.cellMono}>
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <RowActions
                        actions={[
                          { label: "Edit", onClick: () => openEdit(plan) },
                          {
                            label: "Archive",
                            onClick: () => openDelete(plan),
                            tone: "danger",
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              )}
            </>
          )}
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Showing {filtered.length}
            {filtered.length !== (plans?.length ?? 0)
              ? ` of ${plans?.length ?? 0}`
              : ""}{" "}
            plans
          </span>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn}>‹</button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>
              1
            </button>
            <button className={styles.pageBtn}>›</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
