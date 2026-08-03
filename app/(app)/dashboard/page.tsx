"use client";

import Link from "next/link";
import { motion, Variants, Easing } from "framer-motion";
import styles from "./Dashboard.module.css";
import { useDashboard, usePaymentTrends } from "@/services/analytics/analytics.hooks";
import type { ActivityFeedItem, PaymentModeRow } from "@/services/analytics/analytics.api";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import {
  computeTaxBreakdown,
  formatAmountWithGstInline,
  resolveInvoiceTax,
  type InvoiceTaxMode,
} from "@/lib/tax";

const customEase: Easing = [0.16, 1, 0.3, 1] as any;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: customEase },
  }),
};

function inr(n?: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

/** Ledger amount → display total + GST split for dashboard money cards */
function moneyGst(
  amount: number | null | undefined,
  taxPercentage: number,
  taxMode: InvoiceTaxMode,
) {
  if (amount == null || Number.isNaN(amount)) {
    return { primary: "—", gstLine: null as string | null, tax: 0, total: 0 };
  }
  if (taxPercentage <= 0) {
    return {
      primary: inr(amount),
      gstLine: null,
      tax: 0,
      total: amount,
    };
  }
  const b = computeTaxBreakdown(amount, taxPercentage, taxMode);
  if (taxMode === "included") {
    return {
      primary: inr(b.totalAmount),
      gstLine: `GST ${inr(b.taxAmount)} included`,
      tax: b.taxAmount,
      total: b.totalAmount,
    };
  }
  return {
    primary: inr(b.totalAmount),
    gstLine: `base ${inr(b.subtotal)} · GST ${inr(b.taxAmount)}`,
    tax: b.taxAmount,
    total: b.totalAmount,
  };
}

function relativeTime(iso?: string) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN");
}

function feedDotClass(action: string) {
  if (action.includes("PAYMENT")) return styles.payment;
  if (action.includes("MEMBER")) return styles.user;
  if (action.includes("INVOICE")) return styles.invoice;
  if (action.includes("RENEWAL") || action.includes("SUBSCRIPTION")) return styles.sub;
  return styles.user;
}

function buildPath(data: number[], w: number, h: number, allData: number[], pad = 40): string {
  const min = Math.min(...allData) * 0.9;
  const max = Math.max(...allData) * 1.02 || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - ((v - min) / (max - min || 1)) * h;
    return [x, y] as [number, number];
  });
  return pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${d} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, "");
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function RevenueChart({
  trends,
}: {
  trends: { revenue: number; payments: number; year: number; month: number }[];
}) {
  const W = 600;
  const H = 140;
  if (!trends || trends.length < 2) {
    return (
      <div className={styles.chartBody} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140, color: "var(--text-3)", fontSize: "0.85rem" }}>
        Not enough data yet
      </div>
    );
  }

  const revenues = trends.map((t) => t.revenue);
  const mainPath = buildPath(revenues, W, H, revenues);
  const areaPath = mainPath + ` L ${W - 40} ${H} L 40 ${H} Z`;

  return (
    <div className={styles.chartBody}>
      <div className={styles.chartWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.chartSvg} preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c0392b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#c0392b" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={40}
              y1={H * f}
              x2={W - 40}
              y2={H * f}
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="1"
            />
          ))}
          <path d={areaPath} fill="url(#areaGrad)" />
          <path d={mainPath} fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" />
          {revenues.map((v, i) => {
            const min = Math.min(...revenues) * 0.9;
            const max = Math.max(...revenues) * 1.02 || 1;
            const x = 40 + (i / Math.max(revenues.length - 1, 1)) * (W - 80);
            const y = H - ((v - min) / (max - min || 1)) * H;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="#fff" stroke="#c0392b" strokeWidth="2" />
                <circle cx={x} cy={y} r="2" fill="#c0392b" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className={styles.chartXLabels}>
        {trends.map((t) => (
          <span key={`${t.year}-${t.month}`}>{MONTH_NAMES[t.month - 1]}</span>
        ))}
      </div>
    </div>
  );
}

function ModeBars({
  rows,
  taxPercentage,
  taxMode,
}: {
  rows: PaymentModeRow[];
  taxPercentage: number;
  taxMode: InvoiceTaxMode;
}) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  if (!rows.length) {
    return <p className={styles.emptyHint}>No payment data yet</p>;
  }
  return (
    <div className={styles.modeList}>
      {rows.map((r) => (
        <div key={r.mode} className={styles.modeRow}>
          <div className={styles.modeMeta}>
            <span className={styles.modeName}>{r.mode}</span>
            <span className={styles.modeNums}>
              {formatAmountWithGstInline(r.total, taxPercentage, taxMode)} ·{" "}
              {r.count} txns
            </span>
          </div>
          <div className={styles.modeTrack}>
            <div
              className={styles.modeFill}
              style={{ width: `${Math.max((r.total / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityList({ items }: { items: ActivityFeedItem[] }) {
  if (!items.length) {
    return <p className={styles.emptyHint}>Actions will appear here as staff work</p>;
  }
  return (
    <ul className={styles.feedList}>
      {items.map((a) => (
        <li key={a.id} className={styles.feedItem}>
          <span className={`${styles.feedDot} ${feedDotClass(a.action)}`} />
          <div className={styles.feedContent}>
            <div className={styles.feedAction}>
              <span className={styles.actorName}>{a.actorName}</span>
            </div>
            <div className={styles.feedDetail}>{a.summary}</div>
          </div>
          <span className={styles.feedTime}>{relativeTime(a.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useDashboard();
  const { data: trendsData } = usePaymentTrends();
  const { data: gymSettings } = useGymSettings();
  const { taxPercentage, taxMode } = resolveInvoiceTax(gymSettings);

  const counts = dashboard?.counts;
  const mom = counts?.revenueMomPct ?? 0;
  const momTrend = mom > 0 ? "up" : mom < 0 ? "down" : "neutral";

  const monthly = moneyGst(counts?.monthlyRevenue, taxPercentage, taxMode);
  const lifetime = moneyGst(counts?.totalRevenue, taxPercentage, taxMode);
  const pendingMoney = moneyGst(
    counts?.totalPendingAmount,
    taxPercentage,
    taxMode,
  );
  const lastMonth = moneyGst(counts?.lastMonthRevenue, taxPercentage, taxMode);

  const stats = [
    {
      title: "Total Members",
      value: counts?.totalMembers ?? "—",
      sub: `${counts?.newMembersThisMonth ?? 0} new this month`,
      badge: "+new",
      trend: "up" as const,
      gstLine: null as string | null,
    },
    {
      title: "Active Subs",
      value: counts?.activeSubscriptions ?? "—",
      sub: `${counts?.expiredSubscriptions ?? 0} expired`,
      badge: "active",
      trend: "neutral" as const,
      gstLine: null,
    },
    {
      title: "Monthly Revenue",
      value: monthly.primary,
      sub: `${counts?.monthlyPaymentsCount ?? 0} payments · vs last ${lastMonth.primary}`,
      badge: mom === 0 ? "flat" : `${mom > 0 ? "+" : ""}${mom}%`,
      trend: momTrend,
      gstLine: monthly.gstLine,
    },
    {
      title: "Pending Dues",
      value: pendingMoney.primary,
      sub: `${counts?.membersWithPendingPayments ?? 0} members owing`,
      badge: "dues",
      trend: "down" as const,
      gstLine: pendingMoney.gstLine,
    },
    {
      title: "Expiring (7d)",
      value: counts?.membersNearExpiry ?? "—",
      sub: `${counts?.membersExpiringIn30Days ?? 0} in next 30 days`,
      badge: "urgent",
      trend: "down" as const,
      gstLine: null,
    },
    {
      title: "Follow-ups Open",
      value: counts?.renewalsOpen ?? "—",
      sub: `${counts?.renewalsPromised ?? 0} promised · ${counts?.renewalsRenewed ?? 0} renewed`,
      badge: "queue",
      trend: "neutral" as const,
      gstLine: null,
    },
    {
      title: "Lifetime Revenue",
      value: lifetime.primary,
      sub: `${counts?.totalPaymentsCount ?? 0} payments all time`,
      badge: "total",
      trend: "up" as const,
      gstLine: lifetime.gstLine,
    },
    {
      title: taxPercentage > 0 ? "GST Collected" : "Follow-ups Lost",
      value:
        taxPercentage > 0
          ? inr(lifetime.tax)
          : (counts?.renewalsLost ?? "—"),
      sub:
        taxPercentage > 0
          ? taxMode === "included"
            ? `${taxPercentage}% included in prices`
            : `${taxPercentage}% on collections (excl.)`
          : `${counts?.renewalsContacted ?? 0} contacted in queue`,
      badge: taxPercentage > 0 ? "gst" : "lost",
      trend: "down" as const,
      gstLine:
        taxPercentage > 0
          ? `this month ${inr(monthly.tax)}`
          : null,
    },
  ];

  const recentPayments = dashboard?.recentPayments ?? [];
  const nearExpiry = dashboard?.membersNearExpiry ?? [];
  const pending = dashboard?.membersWithPendingPayments ?? [];
  const modes = dashboard?.paymentModeBreakdown ?? [];
  const activity = dashboard?.activityFeed ?? [];
  const renewals = dashboard?.renewalsBreakdown;

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Operations</p>
          <h1 className={styles.heading}>Dashboard</h1>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.liveDot} />
          {isLoading ? "Loading…" : "Live · auto-refresh 60s"}
        </div>
      </motion.div>

      <div className={styles.statsWide}>
        {stats.map((s, i) => (
          <motion.div
            key={s.title}
            className={styles.statCard}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <div className={styles.statIcon}>
              <span className={styles.statIconDot} />
              {s.title}
            </div>
            <div className={styles.statValue}>{isLoading ? "…" : String(s.value)}</div>
            {s.gstLine ? (
              <div className={styles.statGst}>{s.gstLine}</div>
            ) : null}
            <div className={styles.statFooter}>
              <span className={`${styles.statBadge} ${styles[s.trend]}`}>{s.badge}</span>
              <span>{s.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={styles.lowerGrid3}>
        <motion.div className={styles.section} custom={8} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />
              Revenue trend
            </h2>
            <span className={styles.sectionBadge}>Last 6 months</span>
          </div>
          <RevenueChart trends={trendsData?.monthlyTrends ?? []} />
        </motion.div>

        <motion.div className={styles.section} custom={9} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />
              Payment modes
            </h2>
            <span className={styles.sectionBadge}>All time</span>
          </div>
          <div className={styles.panelPad}>
            <ModeBars
              rows={modes}
              taxPercentage={taxPercentage}
              taxMode={taxMode}
            />
          </div>
        </motion.div>

        <motion.div className={styles.section} custom={10} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />
              Expiry follow-up pipeline
            </h2>
            <Link href="/renewals" className={styles.inlineLink}>
              Open follow-ups →
            </Link>
          </div>
          <div className={styles.panelPad}>
            <div className={styles.pipeline}>
              {[
                ["Pending", renewals?.PENDING ?? counts?.renewalsOpen ?? 0],
                ["Contacted", renewals?.CONTACTED ?? counts?.renewalsContacted ?? 0],
                ["Promised", renewals?.PROMISED ?? counts?.renewalsPromised ?? 0],
                ["Renewed", renewals?.RENEWED ?? counts?.renewalsRenewed ?? 0],
                ["Lost", renewals?.LOST ?? counts?.renewalsLost ?? 0],
              ].map(([label, val]) => (
                <div key={String(label)} className={styles.pipeCell}>
                  <div className={styles.pipeVal}>{val}</div>
                  <div className={styles.pipeLabel}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className={styles.lowerGrid}>
        <motion.div className={styles.section} custom={11} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />
              Activity · who did what
            </h2>
            <span className={styles.sectionBadge}>{activity.length} recent</span>
          </div>
          <ActivityList items={activity} />
        </motion.div>

        <motion.div className={styles.section} custom={12} variants={fadeUp} initial="hidden" animate="visible">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />
              Recent payments
            </h2>
            <span className={styles.sectionBadge}>{recentPayments.length}</span>
          </div>
          {isLoading ? (
            <p className={styles.emptyHint}>Loading…</p>
          ) : (
            <ul className={styles.feedList}>
              {recentPayments.length === 0 && (
                <li className={styles.feedItem}>
                  <span className={styles.emptyHint}>No payments yet.</span>
                </li>
              )}
              {recentPayments.map((p, i) => (
                <li key={i} className={styles.feedItem}>
                  <span className={`${styles.feedDot} ${styles.payment}`} />
                  <div className={styles.feedContent}>
                    <div className={styles.feedAction}>
                      {p.memberName} ·{" "}
                      {formatAmountWithGstInline(
                        p.amount,
                        taxPercentage,
                        taxMode,
                      )}
                    </div>
                    <div className={styles.feedDetail}>
                      {p.paymentMode}
                      {p.receivedByName ? ` · by ${p.receivedByName}` : ""}
                    </div>
                  </div>
                  <span className={styles.feedTime}>
                    {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {(nearExpiry.length > 0 || pending.length > 0 || isLoading) && (
        <div className={styles.tablesGrid}>
          {(nearExpiry.length > 0 || isLoading) && (
            <motion.div className={styles.section} custom={13} variants={fadeUp} initial="hidden" animate="visible">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionTitleBar} />
                  Expiring soon
                </h2>
                <div className={styles.headerActions}>
                  <span className={styles.sectionBadgeWarn}>{nearExpiry.length} members</span>
                  <Link href="/renewals" className={styles.inlineLink}>
                    Queue →
                  </Link>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {["Member", "Plan", "Days", "Pending"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nearExpiry.map((m, i) => (
                      <tr key={i}>
                        <td>
                          <div className={styles.tdPrimary}>{m.memberName}</div>
                          <div className={styles.tdMuted}>{m.phone}</div>
                        </td>
                        <td>{m.planName}</td>
                        <td>
                          <span className={m.daysRemaining <= 3 ? styles.danger : styles.warn}>
                            {m.daysRemaining}d
                          </span>
                        </td>
                        <td>
                          {m.pendingAmount > 0
                            ? formatAmountWithGstInline(
                                m.pendingAmount,
                                taxPercentage,
                                taxMode,
                              )
                            : "Paid"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {pending.length > 0 && (
            <motion.div className={styles.section} custom={14} variants={fadeUp} initial="hidden" animate="visible">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionTitleBar} />
                  Highest dues
                </h2>
                <span className={styles.sectionBadge}>{pending.length} shown</span>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {["Member", "Plan", "Paid", "Due"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((m, i) => (
                      <tr key={i}>
                        <td>
                          <div className={styles.tdPrimary}>{m.memberName}</div>
                          <div className={styles.tdMuted}>{m.phone}</div>
                        </td>
                        <td>{m.planName}</td>
                        <td>
                          {formatAmountWithGstInline(
                            m.totalPaid,
                            taxPercentage,
                            taxMode,
                          )}
                        </td>
                        <td className={styles.warn}>
                          {formatAmountWithGstInline(
                            m.pendingAmount,
                            taxPercentage,
                            taxMode,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
