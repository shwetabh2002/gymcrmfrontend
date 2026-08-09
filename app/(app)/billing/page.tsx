"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Billing.module.css";
import { usePaymentsPaged } from "@/services/payments/payments.hooks";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useRevenueAnalytics } from "@/services/analytics/analytics.hooks";
import { useSubscriptionsPaged } from "@/services/subscriptions/subscriptions.hook";
import { Payment } from "@/services/payments/payments.api";
import { MemberSubscription } from "@/services/subscriptions/subscriptions.api";
import { BillingModal, BillingMode } from "./BillingModal";
import { PaymentEditModal } from "./PaymentEditModal";
import { CancelMembershipModal } from "./CancelMembershipModal";
import { VoidPaymentModal } from "./VoidPaymentModal";
import { useAuth } from "@/lib/context/AuthContext";
import {
  canRecordPayments,
  hasPermission,
  normalizePermissions,
} from "@/lib/rbac";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import { resolveInvoiceTax, formatAmountWithGstInline } from "@/lib/tax";
import { MoneyWithGst } from "@/components/MoneyWithGst";
import { RowActions } from "@/components/RowActions";
import { EASE_OUT_EXPO } from "@/config/motion";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.07,
      ease: EASE_OUT_EXPO,
    },
  }),
};

function getPaymentMember(p: Payment) {
  return typeof p.memberId === "object" && p.memberId !== null
    ? p.memberId
    : null;
}

function getMember(sub: MemberSubscription) {
  return typeof sub.memberId === "object" && sub.memberId !== null
    ? sub.memberId
    : null;
}

function getPlan(sub: MemberSubscription) {
  return typeof sub.planId === "object" && sub.planId !== null
    ? sub.planId
    : null;
}

function memberIdOf(sub: MemberSubscription) {
  return typeof sub.memberId === "object" && sub.memberId
    ? sub.memberId._id
    : String(sub.memberId);
}

function mopBadgeClass(mode: string) {
  const m = mode?.toUpperCase();
  if (m === "CASH") return styles.badgeCash;
  if (m === "UPI") return styles.badgeUpi;
  if (m === "CARD") return styles.badgeCard;
  return styles.badgePaid;
}

type BillingLaunch = {
  mode: BillingMode;
  memberId?: string;
  subscriptionId?: string;
};

/** Rows per page in both billing tabs. */
const BILLING_PAGE_SIZE = 25;

export default function BillingPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Loading…</div>}>
      <BillingPageInner />
    </Suspense>
  );
}

function BillingPageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { user } = useAuth();
  const perms = normalizePermissions(user?.permissions ?? null);
  const { data: gymSettings } = useGymSettings();
  const { taxPercentage, taxMode } = resolveInvoiceTax(gymSettings);

  const canPay = canRecordPayments(user?.role, user?.permissions);
  const canSell = hasPermission(perms, "subscriptions_create");
  const canEditPay = hasPermission(perms, "payments_update");
  const canVoidPay = hasPermission(perms, "payments_delete");
  const canEditSub = hasPermission(perms, "subscriptions_update");

  const initialTab =
    tabParam === "payments" || tabParam === "memberships"
      ? tabParam
      : "memberships";

  const [tab, setTab] = useState<"memberships" | "payments">(initialTab);
  const [launch, setLaunch] = useState<BillingLaunch | null>(null);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [cancelSub, setCancelSub] = useState<MemberSubscription | null>(null);
  const [voidPay, setVoidPay] = useState<Payment | null>(null);

  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  /** Typing now reaches the database, so wait for the typing to settle. */
  const debouncedSearch = useDebouncedValue(search, 300);

  const {
    data: pagedPayments,
    isLoading: payLoading,
    isError: payError,
  } = usePaymentsPaged({
    page: tab === "payments" ? page : 1,
    limit: BILLING_PAGE_SIZE,
    search: debouncedSearch || undefined,
    mode: modeFilter,
  });
  const {
    data: pagedSubs,
    isLoading: subLoading,
    isError: subError,
  } = useSubscriptionsPaged({
    page: tab === "memberships" ? page : 1,
    limit: BILLING_PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter,
  });
  const { data: revenue } = useRevenueAnalytics();

  const payments = pagedPayments?.items;
  const subs = pagedSubs?.items;
  const activePaged = tab === "payments" ? pagedPayments : pagedSubs;
  const total = activePaged?.total ?? 0;
  const pages = activePaged?.pages ?? 1;

  // Switching tab or narrowing the list makes the current page number stale.
  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, modeFilter, statusFilter]);

  // Search, mode and status are applied by the server, so these are simply the
  // rows this page was handed.
  const filteredPayments = payments ?? [];
  const filteredSubs = subs ?? [];

  const STATS = [
    {
      label: "Total Collected",
      val: revenue ? `₹${revenue.totalRevenue.toLocaleString("en-IN")}` : "—",
      sub: "all time",
    },
    {
      label: "This Month",
      val: revenue
        ? `₹${revenue.currentMonth.revenue.toLocaleString("en-IN")}`
        : "—",
      sub: `${revenue?.currentMonth.payments ?? 0} payments`,
    },
    {
      label: "Active Plans",
      val: String(
        subs?.filter((s) => s.subscriptionStatus === "ACTIVE").length ?? "—",
      ),
      sub: `${subs?.length ?? 0} total assignments`,
    },
    {
      label: "Pending Dues",
      val: revenue ? `₹${revenue.pending.amount.toLocaleString("en-IN")}` : "—",
      sub: `${revenue?.pending.subscriptions ?? 0} subscriptions`,
    },
  ];

  return (
    <div className={styles.page}>
      <AnimatePresence>
        {launch && (
          <BillingModal
            initialMode={launch.mode}
            initialMemberId={launch.memberId}
            initialSubscriptionId={launch.subscriptionId}
            onClose={() => setLaunch(null)}
          />
        )}
      </AnimatePresence>
      {editPayment ? (
        <PaymentEditModal
          payment={editPayment}
          onClose={() => setEditPayment(null)}
        />
      ) : null}
      {cancelSub ? (
        <CancelMembershipModal
          subscription={cancelSub}
          onClose={() => setCancelSub(null)}
        />
      ) : null}
      {voidPay ? (
        <VoidPaymentModal payment={voidPay} onClose={() => setVoidPay(null)} />
      ) : null}

      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Memberships & Payments</h1>
          <p className={styles.pageDesc}>
            Assign or renew a membership plan, collect pending dues, and review
            payment history.
          </p>
        </div>
        <div className={styles.headerActions}>
          {canPay && (
            <button
              className={styles.btnSecondary}
              onClick={() => setLaunch({ mode: "collect" })}
            >
              Collect dues
            </button>
          )}
          {canSell && (
            <button
              className={styles.btnPrimary}
              onClick={() => setLaunch({ mode: "sell" })}
            >
              + Sell / Renew
            </button>
          )}
        </div>
      </motion.div>

      <motion.div
        className={styles.statStrip}
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        {STATS.map((st) => (
          <div key={st.label} className={styles.statCell}>
            <span className={styles.statLabel}>
              <span className={styles.statLabelDot} />
              {st.label}
            </span>
            <span className={styles.statVal}>{st.val}</span>
            <span className={styles.statSub}>{st.sub}</span>
          </div>
        ))}
      </motion.div>

      <motion.div
        className={styles.card}
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${tab === "memberships" ? styles.tabOn : ""}`}
            onClick={() => setTab("memberships")}
          >
            Memberships
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === "payments" ? styles.tabOn : ""}`}
            onClick={() => setTab("payments")}
          >
            Payment history
          </button>
        </div>

        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            {tab === "memberships" ? "Plan assignments" : "Transactions"}
          </h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.searchInput}
                placeholder="Search member…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {tab === "payments" ? (
              <select
                className={styles.filterSelect}
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
              >
                <option value="ALL">All Modes</option>
                {["CASH", "CARD", "UPI", "BANK_TRANSFER"].map((m) => (
                  <option key={m} value={m}>
                    {m.replace("_", " ")}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            )}
          </div>
        </div>

        <div className={styles.tableWrap}>
          {tab === "memberships" && (
            <>
              {subLoading && (
                <p
                  style={{
                    padding: "1.5rem 22px",
                    color: "var(--text-2)",
                    fontSize: 13,
                  }}
                >
                  Loading…
                </p>
              )}
              {subError && (
                <p
                  style={{
                    padding: "1.5rem 22px",
                    color: "#c45c5c",
                    fontSize: 13,
                  }}
                >
                  Failed to load memberships.
                </p>
              )}
              {!subLoading && !subError && (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Plan</th>
                      <th>Period</th>
                      <th>Paid / Pending</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            padding: "2.5rem",
                            textAlign: "center",
                            color: "#444",
                            fontSize: 13,
                          }}
                        >
                          No memberships yet. Use Sell / Renew to assign a plan.
                        </td>
                      </tr>
                    )}
                    {filteredSubs.map((s) => {
                      const member = getMember(s);
                      const plan = getPlan(s);
                      const mid = memberIdOf(s);
                      return (
                        <tr key={s._id}>
                          <td>
                            <div className={styles.cellName}>
                              {member?.name ?? "—"}
                            </div>
                            <div className={styles.cellSub}>
                              {member?.contactNumber ?? member?.phone ?? ""}
                            </div>
                          </td>
                          <td className={styles.cellMono}>
                            {plan?.name ?? "—"}
                            <div className={styles.cellSub}>
                              {formatAmountWithGstInline(
                                s.planPrice,
                                taxPercentage,
                                taxMode,
                              )}
                            </div>
                          </td>
                          <td className={styles.cellMono}>
                            {new Date(s.startDate).toLocaleDateString("en-IN")}{" "}
                            →{" "}
                            {new Date(s.expiryDate).toLocaleDateString("en-IN")}
                          </td>
                          <td className={styles.cellMono}>
                            <div>
                              {formatAmountWithGstInline(
                                s.totalPaid,
                                taxPercentage,
                                taxMode,
                              )}
                            </div>
                            <div className={styles.cellSub}>
                              pending{" "}
                              {formatAmountWithGstInline(
                                s.pendingAmount,
                                taxPercentage,
                                taxMode,
                              )}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                s.subscriptionStatus === "ACTIVE"
                                  ? styles.badgePaid
                                  : styles.badgePending
                              }`}
                            >
                              {s.subscriptionStatus}
                            </span>
                          </td>
                          <td>
                            <RowActions
                              actions={[
                                ...(canPay && s.pendingAmount > 0
                                  ? [
                                      {
                                        label: "Collect dues",
                                        onClick: () =>
                                          setLaunch({
                                            mode: "collect" as const,
                                            memberId: mid,
                                            subscriptionId: s._id,
                                          }),
                                      },
                                    ]
                                  : []),
                                ...(canSell
                                  ? [
                                      {
                                        label: "Sell / Renew",
                                        onClick: () =>
                                          setLaunch({
                                            mode: "sell" as const,
                                            memberId: mid,
                                          }),
                                      },
                                    ]
                                  : []),
                                ...(canEditSub &&
                                s.subscriptionStatus === "ACTIVE"
                                  ? [
                                      {
                                        label: "Cancel membership",
                                        onClick: () => setCancelSub(s),
                                        tone: "danger" as const,
                                      },
                                    ]
                                  : []),
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === "payments" && (
            <>
              {payLoading && (
                <p
                  style={{
                    padding: "1.5rem 22px",
                    color: "var(--text-2)",
                    fontSize: 13,
                  }}
                >
                  Loading…
                </p>
              )}
              {payError && (
                <p
                  style={{
                    padding: "1.5rem 22px",
                    color: "#c45c5c",
                    fontSize: 13,
                  }}
                >
                  Failed to load payments.
                </p>
              )}
              {!payLoading && !payError && (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Contact</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Date</th>
                      <th>Proof / Notes</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            padding: "2.5rem",
                            textAlign: "center",
                            color: "#444",
                            fontSize: 13,
                          }}
                        >
                          No payments yet.
                        </td>
                      </tr>
                    )}
                    {filteredPayments.map((p) => {
                      const member = getPaymentMember(p);
                      return (
                        <tr key={p._id}>
                          <td>
                            <div className={styles.cellName}>
                              {member?.name ?? "—"}
                            </div>
                          </td>
                          <td className={styles.cellMono}>
                            {member?.phone ?? "—"}
                          </td>
                          <td className={styles.cellAmount}>
                            <MoneyWithGst
                              amount={p.amount}
                              taxPercentage={taxPercentage}
                              taxMode={taxMode}
                            />
                          </td>
                          <td>
                            <span
                              className={`${styles.badge} ${mopBadgeClass(p.paymentMode)}`}
                            >
                              {p.paymentMode.replace("_", " ")}
                            </span>
                          </td>
                          <td className={styles.cellMono}>
                            {new Date(p.paymentDate).toLocaleDateString(
                              "en-IN",
                            )}
                          </td>
                          <td style={{ color: "#666", fontSize: "0.82rem" }}>
                            {p.proofUrl ? (
                              <a
                                href={p.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "var(--text)",
                                  marginRight: 8,
                                }}
                              >
                                Proof
                              </a>
                            ) : null}
                            {p.notes ?? (p.proofUrl ? "" : "—")}
                          </td>
                          <td>
                            <RowActions
                              actions={[
                                ...(canEditPay
                                  ? [
                                      {
                                        label: "Edit",
                                        onClick: () => setEditPayment(p),
                                      },
                                    ]
                                  : []),
                                ...(canVoidPay
                                  ? [
                                      {
                                        label: "Void",
                                        onClick: () => setVoidPay(p),
                                        tone: "danger" as const,
                                      },
                                    ]
                                  : []),
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* Server-side paging: the table only ever holds one page. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 0 4px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>
              {total === 0
                ? "Nothing to show"
                : `Showing ${(page - 1) * BILLING_PAGE_SIZE + 1}–${
                    (page - 1) * BILLING_PAGE_SIZE +
                    (tab === "payments"
                      ? filteredPayments.length
                      : filteredSubs.length)
                  } of ${total}`}
            </span>

            {pages > 1 ? (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginLeft: "auto",
                }}
              >
                <button
                  type="button"
                  className={styles.pageNav}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>
                  Page {page} of {pages}
                </span>
                <button
                  type="button"
                  className={styles.pageNav}
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                >
                  Next →
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
