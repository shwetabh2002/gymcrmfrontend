"use client";

import { useState, useMemo } from "react";
import { motion, Variants, Easing } from "framer-motion";
import styles from "./Dashboard.module.css";
import { useDashboard, usePaymentTrends, useExpiringIn7Days, usePaymentUpdates } from "@/services/analytics/analytics.hooks";
import { DashboardFilters } from "@/services/analytics/analytics.api";
import { useUpcomingBirthdays, useUpcomingAnniversaries } from "@/services/employees/employees.hook";

const customEase: Easing = [0.16, 1, 0.3, 1] as any;

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: customEase },
  }),
};

/* ─── Revenue Chart ───────────────────────────────────────── */
function buildPath(data: number[], w: number, h: number, allData: number[], pad = 40): string {
  const min = Math.min(...allData) * 0.9;
  const max = Math.max(...allData) * 1.02;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y] as [number, number];
  });
  return pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${d} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, "");
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function RevenueChart({ trends }: { trends: { revenue: number; payments: number; year: number; month: number }[] }) {
  const W = 600; const H = 140;
  if (!trends || trends.length < 2) {
    return <div className={styles.chartBody} style={{ display:"flex", alignItems:"center", justifyContent:"center", height: 140, color:"#444", fontSize:"0.85rem" }}>Not enough data</div>;
  }

  const revenues = trends.map(t => t.revenue);
  const allData = [...revenues];
  const mainPath = buildPath(revenues, W, H, allData);
  const areaPath = mainPath + ` L ${W - 40} ${H} L 40 ${H} Z`;

  return (
    <div className={styles.chartBody}>
      <div className={styles.chartWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg} preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#d42b2b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#d42b2b" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={40} y1={H * f} x2={W - 40} y2={H * f}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          <path d={areaPath} fill="url(#areaGrad)" />
          <path d={mainPath} fill="none" stroke="#d42b2b" strokeWidth="2" strokeLinecap="round" />
          {revenues.map((v, i) => {
            const min = Math.min(...allData) * 0.9;
            const max = Math.max(...allData) * 1.02;
            const x = 40 + (i / (revenues.length - 1)) * (W - 80);
            const y = H - ((v - min) / (max - min)) * H;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="#080808" stroke="#d42b2b" strokeWidth="2" />
                <circle cx={x} cy={y} r="2" fill="#d42b2b" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className={styles.chartXLabels}>
        {trends.map((t) => <span key={`${t.year}-${t.month}`}>{MONTH_NAMES[t.month - 1]}</span>)}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function DashboardPage() {
  const [filterType, setFilterType] = useState<'all' | 'month' | 'year' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filters: DashboardFilters | undefined = useMemo(() => {
    if (filterType === 'all') return undefined;
    if (filterType === 'month' && selectedMonth && selectedYear) {
      return { month: selectedMonth, year: selectedYear };
    }
    if (filterType === 'year' && selectedYear) {
      return { year: selectedYear };
    }
    if (filterType === 'custom' && startDate && endDate) {
      return { startDate, endDate };
    }
    return undefined;
  }, [filterType, selectedMonth, selectedYear, startDate, endDate]);

  const { data: dashboard, isLoading } = useDashboard(filters);
  const { data: trendsData } = usePaymentTrends();
  const { data: expiringData, isLoading: isLoadingExpiring } = useExpiringIn7Days();
  const { data: paymentUpdatesData, isLoading: isLoadingPaymentUpdates } = usePaymentUpdates();
  const { data: upcomingBirthdays, isLoading: isLoadingBirthdays } = useUpcomingBirthdays();
  const { data: upcomingAnniversaries, isLoading: isLoadingAnniversaries } = useUpcomingAnniversaries();

  const counts = dashboard?.counts;

  const stats = [
    { title: "Total Members",          value: counts?.totalMembers          ?? "—", sub: `${counts?.newMembersThisMonth ?? 0} new this month`,  badge: "+new",    trend: "up"      },
    { title: "Active Subscriptions",   value: counts?.activeSubscriptions   ?? "—", sub: `of ${counts?.totalMembers ?? 0} members`,              badge: "active",  trend: "neutral" },
    { title: "Monthly Revenue",        value: counts?.monthlyRevenue != null ? `₹${counts.monthlyRevenue.toLocaleString()}` : "—", sub: "this month", badge: "revenue", trend: "up"  },
    { title: "Pending Payments",       value: counts?.membersWithPendingPayments ?? "—", sub: `₹${counts?.totalPendingAmount?.toLocaleString() ?? 0} total`, badge: "pending", trend: "down" },
    { title: "Total Discount Given",   value: counts?.totalDiscountGiven != null ? `₹${Math.round(counts.totalDiscountGiven).toLocaleString()}` : "—", sub: `${counts?.discountedMembersCount ?? 0} members discounted`, badge: "discount", trend: "neutral" },
  ];

  const recentPayments = dashboard?.recentPayments ?? [];
  const nearExpiry     = dashboard?.membersNearExpiry ?? [];

  return (
    <div className={styles.container}>

      {/* Header */}
      <motion.div className={styles.header}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.heading}>Dashboard Overview</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fafaf8', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '6px', padding: '6px 10px' }}>
            <label style={{ fontSize: '0.75rem', color: '#777', fontWeight: 500 }}>Filter:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              style={{ fontSize: '0.8rem', padding: '4px 8px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}
            >
              <option value="all">All Time</option>
              <option value="month">By Month</option>
              <option value="year">By Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {filterType === 'month' && (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '4px 8px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}
                >
                  <option value="">Select Month</option>
                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m, i) => (
                    <option key={m} value={m}>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  placeholder="Year"
                  min="2020"
                  max="2030"
                  style={{ fontSize: '0.8rem', padding: '4px 8px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', background: '#fff', width: '80px' }}
                />
              </>
            )}

            {filterType === 'year' && (
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                placeholder="Year"
                min="2020"
                max="2030"
                style={{ fontSize: '0.8rem', padding: '4px 8px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', background: '#fff', width: '80px' }}
              />
            )}

            {filterType === 'custom' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '4px 8px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', background: '#fff' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#777' }}>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '4px 8px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', background: '#fff' }}
                />
              </>
            )}
          </div>

          <div className={styles.headerMeta}>
            <span className={styles.liveDot} />
            {isLoading ? "Loading…" : "Live · updated just now"}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className={styles.stats}>
        {stats.map((s, i) => (
          <motion.div key={s.title} className={styles.statCard}
            custom={i} variants={fadeUp} initial="hidden" animate="visible"
          >
            <div className={styles.statIcon}>
              <span className={styles.statIconDot} />{s.title}
            </div>
            <div className={styles.statValue}>{isLoading ? "…" : String(s.value)}</div>
            <div className={styles.statFooter}>
              <span className={`${styles.statBadge} ${styles[s.trend as "up"|"down"|"neutral"]}`}>
                {s.badge}
              </span>
              <span>{s.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Birthday & Anniversary Cards */}
      <div className={styles.lowerGrid} style={{ marginTop: "1.5rem" }}>

        {/* Upcoming Birthdays */}
        <motion.div className={styles.section} custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} style={{ background: "#4285f4" }} />
              Upcoming Birthdays
            </h2>
            <span className={styles.sectionBadge} style={{ color: "#4285f4", borderColor: "rgba(66,133,244,0.3)", background: "rgba(66,133,244,0.08)" }}>
              Tomorrow · {upcomingBirthdays?.length ?? 0}
            </span>
          </div>
          {isLoadingBirthdays ? (
            <p style={{ color: "#555", padding: "1rem", fontSize: "0.85rem" }}>Loading…</p>
          ) : upcomingBirthdays && upcomingBirthdays.length > 0 ? (
            <ul className={styles.feedList}>
              {upcomingBirthdays.map((emp, i) => (
                <li key={emp._id} className={styles.feedItem}>
                  <span className={styles.feedDot} style={{ background: "#4285f4" }} />
                  <div className={styles.feedContent}>
                    <div className={styles.feedAction}>{emp.name}</div>
                    <div className={styles.feedDetail}>
                      {emp.employeeType} · {emp.phone}
                      {emp.dob && ` · ${new Date(emp.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </div>
                  </div>
                  <span className={styles.feedTime} style={{ color: "#4285f4", fontWeight: 600 }}>
                    🎂
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#555", padding: "1rem", fontSize: "0.85rem" }}>No birthdays tomorrow.</p>
          )}
        </motion.div>

        {/* Upcoming Anniversaries */}
        <motion.div className={styles.section} custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} style={{ background: "#e91e63" }} />
              Upcoming Anniversaries
            </h2>
            <span className={styles.sectionBadge} style={{ color: "#e91e63", borderColor: "rgba(233,30,99,0.3)", background: "rgba(233,30,99,0.08)" }}>
              Tomorrow · {upcomingAnniversaries?.length ?? 0}
            </span>
          </div>
          {isLoadingAnniversaries ? (
            <p style={{ color: "#555", padding: "1rem", fontSize: "0.85rem" }}>Loading…</p>
          ) : upcomingAnniversaries && upcomingAnniversaries.length > 0 ? (
            <ul className={styles.feedList}>
              {upcomingAnniversaries.map((emp, i) => (
                <li key={emp._id} className={styles.feedItem}>
                  <span className={styles.feedDot} style={{ background: "#e91e63" }} />
                  <div className={styles.feedContent}>
                    <div className={styles.feedAction}>{emp.name}</div>
                    <div className={styles.feedDetail}>
                      {emp.employeeType} · {emp.phone}
                      {emp.anniversaryDate && ` · ${new Date(emp.anniversaryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </div>
                  </div>
                  <span className={styles.feedTime} style={{ color: "#e91e63", fontWeight: 600 }}>
                    💑
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#555", padding: "1rem", fontSize: "0.85rem" }}>No anniversaries tomorrow.</p>
          )}
        </motion.div>

      </div>

      {/* Lower grid */}
      <div className={styles.lowerGrid}>

        {/* Revenue chart */}
        <motion.div className={styles.section} custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />Revenue Overview
            </h2>
            <span className={styles.sectionBadge}>Last 6 months</span>
          </div>
          <RevenueChart trends={trendsData?.monthlyTrends ?? []} />
        </motion.div>

        {/* Activity feed — recent payments */}
        <motion.div className={styles.section} custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />Recent Payments
            </h2>
            <span className={styles.sectionBadge}>{recentPayments.length} latest</span>
          </div>
          {isLoading
            ? <p style={{ color: "#555", padding: "1rem", fontSize: "0.85rem" }}>Loading…</p>
            : (
              <ul className={styles.feedList}>
                {recentPayments.length === 0 && (
                  <li className={styles.feedItem} style={{ color: "#555" }}>No payments yet.</li>
                )}
                {recentPayments.map((p, i) => (
                  <li key={i} className={styles.feedItem}>
                    <span className={`${styles.feedDot} ${styles.payment}`} />
                    <div className={styles.feedContent}>
                      <div className={styles.feedAction}>{p.memberName}</div>
                      <div className={styles.feedDetail}>₹{p.amount} · {p.paymentMode}</div>
                    </div>
                    <span className={styles.feedTime}>
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )
          }
        </motion.div>

      </div>

      {/* NEW SECTIONS - Below Recent Payments */}
      <div className={styles.lowerGrid}>

        {/* Expiring in 7 Days */}
        <motion.div className={styles.section} custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />Expiring in 7 Days
            </h2>
            <span className={styles.sectionBadge} style={{ color: "#f0a44b", borderColor: "rgba(240,164,75,0.3)", background: "rgba(240,164,75,0.08)" }}>
              {expiringData?.count ?? 0} members
            </span>
          </div>
          {isLoadingExpiring
            ? <p style={{ color: "#555", padding: "1rem", fontSize: "0.85rem" }}>Loading…</p>
            : (expiringData?.members && expiringData.members.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                      {["Member","Contact","Plan","Expiry","Days Left","Pending"].map(h => (
                        <th key={h} style={{ padding: "0.6rem 1rem", textAlign: "left", color: "#555", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expiringData.members.map((m, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #161616" }}>
                        <td style={{ padding: "0.65rem 1rem", color: "#fff" }}>{m.memberName}</td>
                        <td style={{ padding: "0.65rem 1rem", color: "#666" }}>{m.phone}</td>
                        <td style={{ padding: "0.65rem 1rem", color: "#aaa" }}>{m.planName}</td>
                        <td style={{ padding: "0.65rem 1rem", color: "#aaa" }}>{new Date(m.expiryDate).toLocaleDateString()}</td>
                        <td style={{ padding: "0.65rem 1rem" }}>
                          <span style={{ color: m.daysRemaining <= 3 ? "#e63946" : "#f0a44b", fontWeight: 600 }}>
                            {m.daysRemaining}d
                          </span>
                        </td>
                        <td style={{ padding: "0.65rem 1rem", color: m.pendingAmount > 0 ? "#f0a44b" : "#3ec95a" }}>
                          {m.pendingAmount > 0 ? `₹${m.pendingAmount}` : "Paid"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "#555", padding: "1rem", fontSize: "0.85rem" }}>No memberships expiring in the next 7 days.</p>
            ))
          }
        </motion.div>

        {/* Payment Updates */}
        <motion.div className={styles.section} custom={7} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />Payment Updates
            </h2>
            <span className={styles.sectionBadge}>{paymentUpdatesData?.count ?? 0} latest</span>
          </div>
          {isLoadingPaymentUpdates
            ? <p style={{ color: "#555", padding: "1rem", fontSize: "0.85rem" }}>Loading…</p>
            : (
              <ul className={styles.feedList}>
                {!paymentUpdatesData?.payments || paymentUpdatesData.payments.length === 0 ? (
                  <li className={styles.feedItem} style={{ color: "#555" }}>No payment updates yet.</li>
                ) : (
                  paymentUpdatesData.payments.map((p, i) => (
                    <li key={i} className={styles.feedItem}>
                      <span className={`${styles.feedDot} ${styles.payment}`} />
                      <div className={styles.feedContent}>
                        <div className={styles.feedAction}>{p.memberName}</div>
                        <div className={styles.feedDetail}>
                          {p.flow === 'simplified' && p.received != null
                            ? `Received: ₹${p.received}${p.pending ? ` · Pending: ₹${p.pending}` : ''} · ${p.paymentMode}`
                            : `₹${p.amount} · ${p.paymentMode}`
                          }
                          {p.notes && ` · ${p.notes}`}
                        </div>
                      </div>
                      <span className={styles.feedTime}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            )
          }
        </motion.div>

      </div>

      {/* Expiring soon (old section from dashboard overview - keeping it for now) */}
      {(nearExpiry.length > 0 || isLoading) && (
        <motion.div className={styles.section} custom={6} variants={fadeUp} initial="hidden" animate="visible"
          style={{ marginTop: "1.5rem" }}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />Expiring Soon
            </h2>
            <span className={styles.sectionBadge} style={{ color: "#f0a44b", borderColor: "rgba(240,164,75,0.3)", background: "rgba(240,164,75,0.08)" }}>
              {nearExpiry.length} members
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                  {["Member","Contact","Plan","Expiry","Days Left","Pending"].map(h => (
                    <th key={h} style={{ padding: "0.6rem 1rem", textAlign: "left", color: "#555", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nearExpiry.map((m, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #161616" }}>
                    <td style={{ padding: "0.65rem 1rem", color: "#fff" }}>{m.memberName}</td>
                    <td style={{ padding: "0.65rem 1rem", color: "#666" }}>{m.phone}</td>
                    <td style={{ padding: "0.65rem 1rem", color: "#aaa" }}>{m.planName}</td>
                    <td style={{ padding: "0.65rem 1rem", color: "#aaa" }}>{new Date(m.expiryDate).toLocaleDateString()}</td>
                    <td style={{ padding: "0.65rem 1rem" }}>
                      <span style={{ color: m.daysRemaining <= 3 ? "#e63946" : "#f0a44b", fontWeight: 600 }}>
                        {m.daysRemaining}d
                      </span>
                    </td>
                    <td style={{ padding: "0.65rem 1rem", color: m.pendingAmount > 0 ? "#f0a44b" : "#3ec95a" }}>
                      {m.pendingAmount > 0 ? `₹${m.pendingAmount}` : "Paid"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}