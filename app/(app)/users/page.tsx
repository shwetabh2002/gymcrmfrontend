 "use client";

import { motion } from "framer-motion";
import styles from "./Users.module.css";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

const users = [
  { id: "USR-001", name: "Sarah Chen",     email: "sarah.chen@example.com",  role: "Member",  plan: "Pro",   status: "Active",   joined: "Jan 12, 2025" },
  { id: "USR-002", name: "Mark Torres",    email: "mark.t@domain.io",        role: "Member",  plan: "Basic", status: "Inactive", joined: "Nov 3, 2024"  },
  { id: "USR-003", name: "Lena Kovacs",    email: "lena.k@gymmail.com",      role: "Trainer", plan: "Pro",   status: "Active",   joined: "Feb 28, 2025" },
  { id: "USR-004", name: "David Osei",     email: "d.osei@fitness.net",      role: "Member",  plan: "Basic", status: "Pending",  joined: "Mar 1, 2025"  },
  { id: "USR-005", name: "Priya Sharma",   email: "priya.s@example.com",     role: "Member",  plan: "Elite", status: "Active",   joined: "Dec 15, 2024" },
  { id: "USR-006", name: "James Whitfield",email: "jw@example.com",          role: "Admin",   plan: "Elite", status: "Active",   joined: "Oct 7, 2024"  },
  { id: "USR-007", name: "Aiko Tanaka",    email: "aiko.t@domain.jp",        role: "Member",  plan: "Pro",   status: "Inactive", joined: "Jan 20, 2025" },
];

const STATS = [
  { label: "Total Users",  val: "1,250", sub: "+48 this week"  },
  { label: "Active",       val: "1,104", sub: "88.3% of total" },
  { label: "Inactive",     val: "134",   sub: "10.7% of total" },
  { label: "Pending",      val: "12",    sub: "awaiting setup"  },
];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function badgeClass(status: string) {
  if (status === "Active")   return styles.badgeActive;
  if (status === "Inactive") return styles.badgeInactive;
  return styles.badgePending;
}

export default function UsersPage() {
  return (
    <div className={styles.page}>

      <motion.div className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Users</h1>
          <p className={styles.pageDesc}>Manage all registered gym members and staff.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>⬇ Export</button>
          <button className={styles.btnPrimary}>+ Add User</button>
        </div>
      </motion.div>

      <motion.div className={styles.statStrip}
        custom={0} variants={fadeUp} initial="hidden" animate="visible"
      >
        {STATS.map((st) => (
          <div key={st.label} className={styles.statCell}>
            <span className={styles.statLabel}><span className={styles.statLabelDot} />{st.label}</span>
            <span className={styles.statVal}>{st.val}</span>
            <span className={styles.statSub}>{st.sub}</span>
          </div>
        ))}
      </motion.div>

      <motion.div className={styles.card}
        custom={1} variants={fadeUp} initial="hidden" animate="visible"
      >
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />All Users</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search users…" />
            </div>
            <select className={styles.filterSelect}>
              <option>All Roles</option>
              <option>Member</option><option>Trainer</option><option>Admin</option>
            </select>
            <select className={styles.filterSelect}>
              <option>All Status</option>
              <option>Active</option><option>Inactive</option><option>Pending</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th><th>ID</th><th>Role</th>
                <th>Plan</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className={styles.avatarCell}>
                      <div className={styles.avatar}>{initials(u.name)}</div>
                      <div>
                        <div className={styles.avatarName}>{u.name}</div>
                        <div className={styles.avatarEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.cellMono}>{u.id}</td>
                  <td>{u.role}</td>
                  <td>{u.plan}</td>
                  <td><span className={`${styles.badge} ${badgeClass(u.status)}`}>{u.status}</span></td>
                  <td className={styles.cellMono}>{u.joined}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.iconBtn}>◎</button>
                      <button className={styles.iconBtn}>✎</button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>Showing 1–7 of 1,250 users</span>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn}>‹</button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
            <button className={styles.pageBtn}>2</button>
            <button className={styles.pageBtn}>3</button>
            <button className={styles.pageBtn}>›</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}