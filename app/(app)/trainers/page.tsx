"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import styles from "./Trainers.module.css";
import { useTrainers } from "@/services/trainers/trainers.hook";
import { Trainer } from "@/services/trainers/trainers.api";
import TrainerModal from "./TrainerModal";
import DeleteTrainerDialog from "./DeleteTrainerDialog";

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

export default function TrainersPage() {
  const { data: trainers, isLoading, isError } = useTrainers();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [selected,    setSelected]    = useState<Trainer | null>(null);
  const [search,      setSearch]      = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit   = (t: Trainer) => { setSelected(t); setModalOpen(true); };
  const openDelete = (t: Trainer) => { setSelected(t); setDeleteOpen(true); };

  const filtered = useMemo(() => {
    if (!trainers) return [];
    return trainers.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        (t.specialization ?? "").toLowerCase().includes(q) ||
        (t.email ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [trainers, search, statusFilter]);

  return (
    <div className={styles.page}>
      <TrainerModal open={modalOpen} onClose={() => setModalOpen(false)} existing={selected} />
      <DeleteTrainerDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} trainer={selected} />

      {/* Header */}
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <h1 className={styles.pageTitle}>Trainers</h1>
          <p className={styles.pageSubtitle}>Manage your gym trainers and their details</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>+ Add Trainer</button>
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
            <span className={styles.statLabel}>Total Trainers</span>
            <span className={styles.statValue}>{trainers?.length ?? 0}</span>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search by name, specialization..."
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
          <div className={styles.empty}>Loading trainers...</div>
        ) : isError? (
          <div className={styles.empty}>Error loading trainers</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No trainers found</p>
            {search && <button onClick={() => setSearch("")} className={styles.linkBtn}>Clear search</button>}
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trainer, i) => (
                  <motion.tr
                    key={trainer._id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                  >
                    <td><strong>{trainer.name}</strong></td>
                    <td>{trainer.specialization || "—"}</td>
                    <td>{trainer.experience ? `${trainer.experience} yrs` : "—"}</td>
                    <td>{trainer.contactNumber || trainer.email || "—"}</td>
                    <td>
                      <span className={`${styles.badge} ${statusBadgeClass(trainer.status, styles)}`}>
                        {trainer.status}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      <button onClick={() => openEdit(trainer)} className={styles.btnIcon}>Edit</button>
                      <button onClick={() => openDelete(trainer)} className={styles.btnIconDanger}>Delete</button>
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
