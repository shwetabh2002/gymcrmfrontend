"use client";

import { motion, Variants, Easing } from "framer-motion";
import styles from "./Dashboard.module.css";

/* ─── Motion variants ─────────────────────────────────────── */

const customEase: Easing = [0.16, 1, 0.3, 1] as any;

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: customEase },
  }),
};

/* ─── Stat data ───────────────────────────────────────────── */
const stats = [
  { title: "Total Users",            value: "1,250", sub: "+48 this week",  badge: "+3.9%",  trend: "up"     },
  { title: "Active Subscriptions",   value: "870",   sub: "of 1,250 users", badge: "69.6%",  trend: "neutral"},
  { title: "Monthly Revenue",        value: "$24.5k",sub: "vs $21.2k prev", badge: "+15.6%", trend: "up"     },
  { title: "Pending Payments",       value: "12",    sub: "awaiting action",badge: "−2",     trend: "down"   },
];

/* ─── Activity feed data ──────────────────────────────────── */
const activity = [
  { type: "user",    action: "New user registered",       detail: "sarah.chen@example.com",   time: "2 min ago"  },
  { type: "payment", action: "Payment received",           detail: "$299 · Invoice #4821",     time: "14 min ago" },
  { type: "sub",     action: "Subscription renewed",       detail: "Pro Plan · 12 months",     time: "41 min ago" },
  { type: "invoice", action: "Invoice generated",          detail: "#4822 · $149",             time: "1 hr ago"   },
  { type: "user",    action: "User account deactivated",   detail: "mark.t@domain.io",         time: "2 hr ago"   },
  { type: "payment", action: "Refund processed",           detail: "$49 · Invoice #4809",      time: "3 hr ago"   },
];

/* ─── Revenue chart (SVG sparkline) ──────────────────────── */
const months  = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
const revenue = [18200, 19800, 17600, 22400, 21200, 24500];
const prevRev = [16100, 17200, 16900, 18800, 19400, 21200];

function buildPath(data: number[], w: number, h: number, pad = 40): string {
  const min = Math.min(...data, ...prevRev) * 0.9;
  const max = Math.max(...data, ...prevRev) * 1.02;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y] as [number, number];
  });
  // smooth cubic bezier
  return pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${d} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, "");
}

function RevenueChart() {
  const W = 600; const H = 140;
  const mainPath = buildPath(revenue, W, H);
  const prevPath = buildPath(prevRev, W, H);

  // area fill
  const areaPath = mainPath + ` L ${W - 40} ${H} L 40 ${H} Z`;

  return (
    <div className={styles.chartBody}>
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#d42b2b" }} />
          This period
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#3e3e3e" }} />
          Previous period
        </span>
      </div>

      <div className={styles.chartWrap}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={styles.chartSvg}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#d42b2b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#d42b2b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={40} y1={H * f}
              x2={W - 40} y2={H * f}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Previous period line */}
          <path
            d={prevPath}
            fill="none"
            stroke="#3e3e3e"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Main line */}
          <path
            d={mainPath}
            fill="none"
            stroke="#d42b2b"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Data points */}
          {revenue.map((v, i) => {
            const min = Math.min(...revenue, ...prevRev) * 0.9;
            const max = Math.max(...revenue, ...prevRev) * 1.02;
            const x = 40 + (i / (revenue.length - 1)) * (W - 80);
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
        {months.map((m) => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <div className={styles.container}>

      {/* Header */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.heading}>Dashboard Overview</h1>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.liveDot} />
          Live · last updated just now
        </div>
      </motion.div>

      {/* Stats */}
      <div className={styles.stats}>
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
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statFooter}>
              <span className={`${styles.statBadge} ${styles[s.trend as "up"|"down"|"neutral"]}`}>
                {s.badge}
              </span>
              <span>{s.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lower grid: chart + feed */}
      <div className={styles.lowerGrid}>

        {/* Revenue chart */}
        <motion.div
          className={styles.section}
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />
              Revenue Overview
            </h2>
            <span className={styles.sectionBadge}>Last 6 months</span>
          </div>
          <RevenueChart />
        </motion.div>

        {/* Activity feed */}
        <motion.div
          className={styles.section}
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionTitleBar} />
              Recent Activity
            </h2>
            <span className={styles.sectionBadge}>{activity.length} events</span>
          </div>
          <ul className={styles.feedList}>
            {activity.map((item, i) => (
              <li key={i} className={styles.feedItem}>
                <span className={`${styles.feedDot} ${styles[item.type as keyof typeof styles]}`} />
                <div className={styles.feedContent}>
                  <div className={styles.feedAction}>{item.action}</div>
                  <div className={styles.feedDetail}>{item.detail}</div>
                </div>
                <span className={styles.feedTime}>{item.time}</span>
              </li>
            ))}
          </ul>
        </motion.div>

      </div>
    </div>
  );
}