"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import styles from "./TrainingTypes.module.css";
import { useTrainingTypes } from "@/services/training-types/training-types.hook";
import { TrainingType } from "@/services/training-types/training-types.api";
import TrainingTypeModal from "./TrainingTypeModal";
import DeleteTrainingTypeDialog from "./DeleteTrainingTypeDialog";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function statusBadgeClass(status: string, styles: any) {
  if (status === "ACTIVE")   return styles.badgeActive;
  return styles.badgeInactive;
}

export default function TrainingTypesPage() {
  const { data: trainingTypes, isLoading, isError } = useTrainingTypes();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [selected,    setSelected]    = useState<TrainingType | null>(null);
  const [search,      setSearch]      = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (tt: TrainingType) => { setSelected(tt); setModalOpen(true); };
  const openDelete = (tt: TrainingType) => { setSelected(tt); setDeleteOpen(true); };

  const filtered = useMemo(() => {
    if (!trainingTypes) return [];
    return trainingTypes.filter(tt => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        tt.name.toLowerCase().includes(q) ||
        (tt.description ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || tt.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [trainingTypes, search, statusFilter]);

  return (
    <div className={styles.page}>
      <TrainingTypeModal open={modalOpen} onClose={() => setModalOpen(false)} existing={selected} />
      <DeleteTrainingTypeDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} trainingType={selected} />

      {/* Header */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <h1 className={styles.pageTitle}>Training Types</h1>
          <p className={styles.pageSubtitle}>Manage available training types and programs</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>+ Add Training Type</button>
      </motion.div>

      {/* Stats & Filters */}
      <motion.div
        className={styles.filtersSection}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Types</span>
            <span className={styles.statValue}>{trainingTypes?.length ?? 0}</span>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search by name..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className={styles.content}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {isLoading ? (
          <div className={styles.empty}>Loading training types...</div>
        ) : isError ? (
          <div className={styles.empty}>Error loading training types</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No training types found</p>
            {search && <button onClick={() => setSearch("")} className={styles.linkBtn}>Clear search</button>}
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Duration</th>
                  <th>Max Members</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trainingType, i) => (
                  <motion.tr
                    key={trainingType._id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                  >
                    <td><strong>{trainingType.name}</strong></td>
                    <td>{trainingType.description || "—"}</td>
                    <td>{trainingType.duration ? `${trainingType.duration} min` : "—"}</td>
                    <td>{trainingType.maxMembersPerBatch || "—"}</td>
                    <td>{trainingType.price ? `₹${trainingType.price}` : "—"}</td>
                    <td>
                      <span className={`${styles.badge} ${statusBadgeClass(trainingType.status, styles)}`}>
                        {trainingType.status}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      <button onClick={() => openEdit(trainingType)} className={styles.btnIcon}>Edit</button>
                      <button onClick={() => openDelete(trainingType)} className={styles.btnIconDanger}>Delete</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
