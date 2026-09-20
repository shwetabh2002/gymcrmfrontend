"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Invoices.module.css";
import {
  useInvoicesPaged,
  useDeleteInvoice,
} from "@/services/invoices/invoices.hooks";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { Invoice } from "@/services/invoices/invoices.api";
import InvoiceTemplate from "./InvoiceTemplate";
import InvoiceGeneratorModal, {
  InvoiceGeneratorData,
} from "@/app/(app)/invoices/InvoiceGeneratorModal";
import InvoiceTaxEditModal from "./InvoiceTaxEditModal";
import { useInvoiceGenerator } from "@/services/invoices/invoices.generator.hook";
import { createPortal } from "react-dom";
import {
  invoiceBrandFromLocation,
  getInvoiceLocation,
} from "@/lib/invoice-location";
import { RowActions } from "@/components/RowActions";
import { EASE_OUT_EXPO } from "@/config/motion";
import {
  FilterBar,
  FilterField,
  FilterSearch,
  FilterSelect,
  FilterInput,
} from "@/components/FilterBar/FilterBar";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: EASE_OUT_EXPO },
  }),
};

function getMember(inv: Invoice) {
  if (typeof inv.memberId === "object" && inv.memberId !== null)
    return inv.memberId;
  return null;
}

/**
 * Pulls the plan period, member number and what was actually collected off the
 * populated invoice, so the document can say more than "an amount was billed".
 */
function invoiceDocumentDetails(inv: Invoice) {
  const member = getMember(inv);
  const sub =
    typeof inv.subscriptionId === "object" && inv.subscriptionId !== null
      ? inv.subscriptionId
      : null;
  const payment =
    typeof inv.paymentId === "object" && inv.paymentId !== null
      ? inv.paymentId
      : null;
  const plan =
    sub && typeof sub.planId === "object" && sub.planId !== null
      ? sub.planId
      : null;

  return {
    memberIdNo: member?.idNo ?? null,
    planName: plan?.name ?? null,
    planFrom: sub?.startDate ?? null,
    planTo: sub?.expiryDate ?? null,
    amountPaid: payment?.amount ?? null,
    paymentMode: payment?.paymentMode ?? null,
    paymentDate: payment?.paymentDate ?? null,
    paymentReference: payment?.transactionId ?? null,
  };
}

export default function InvoicesPage() {
  const { mutate: deleteInvoice } = useDeleteInvoice();
  const {
    isOpen: invoiceOpen,
    invoiceData,
    openGenerator,
    closeGenerator,
  } = useInvoiceGenerator();

  const [search, setSearch] = useState("");
  const [taxModeFilter, setTaxModeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [taxEditInvoice, setTaxEditInvoice] = useState<Invoice | null>(null);
  const [mounted, setMounted] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, taxModeFilter]);

  const { data: paged, isLoading, isError } = useInvoicesPaged({
    page,
    limit: 50,
    search: debouncedSearch || undefined,
    taxMode: taxModeFilter === "ALL" ? undefined : taxModeFilter,
  });

  const invoices = paged?.items;
  const pages = paged?.pages ?? 1;
  const listTotal = paged?.total ?? 0;

  const activeFilterCount = [
    search.trim() !== "",
    taxModeFilter !== "ALL",
    dateFrom !== "",
    dateTo !== "",
    amountMin !== "",
    amountMax !== "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setTaxModeFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setPage(1);
  };

  // Stats from current page (lightweight); full-ledger totals stay on analytics.
  const total = listTotal;
  const totalAmount = invoices?.reduce((sum, i) => sum + i.totalAmount, 0) ?? 0;
  const avgAmount =
    (invoices?.length ?? 0) > 0
      ? Math.round(totalAmount / (invoices?.length ?? 1))
      : 0;
  const thisMonth =
    invoices?.filter((i) => {
      const invDate = new Date(i.invoiceDate);
      const now = new Date();
      return (
        invDate.getMonth() === now.getMonth() &&
        invDate.getFullYear() === now.getFullYear()
      );
    }).length ?? 0;

  const filtered = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter((inv) => {
      const invDay = inv.invoiceDate?.slice(0, 10) ?? "";
      const matchesFrom = !dateFrom || invDay >= dateFrom;
      const matchesTo = !dateTo || invDay <= dateTo;
      const min = amountMin !== "" ? Number(amountMin) : null;
      const max = amountMax !== "" ? Number(amountMax) : null;
      const matchesMin =
        min == null || Number.isNaN(min) || inv.totalAmount >= min;
      const matchesMax =
        max == null || Number.isNaN(max) || inv.totalAmount <= max;
      return matchesFrom && matchesTo && matchesMin && matchesMax;
    });
  }, [invoices, dateFrom, dateTo, amountMin, amountMax]);

  const STATS = [
    { label: "Total Invoices", val: String(total), sub: "all time" },
    {
      label: "Total Amount",
      val: `₹${totalAmount.toLocaleString()}`,
      sub: "billed",
    },
    { label: "This Month", val: String(thisMonth), sub: "invoices" },
    {
      label: "Avg Invoice",
      val: `₹${avgAmount.toLocaleString()}`,
      sub: "per invoice",
    },
  ];

  const handleGenerateInvoice = (inv: Invoice) => {
    const member = getMember(inv);
    const brand = invoiceBrandFromLocation(inv);
    const data: InvoiceGeneratorData = {
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      memberId:
        typeof inv.memberId === "object" ? inv.memberId._id : inv.memberId,
      memberName: member?.name ?? "Unknown",
      memberContact: member?.phone ?? "—",
      memberInstagram: undefined,
      items: inv.items,
      subtotal: inv.subtotal,
      taxPercentage: inv.taxPercentage,
      taxAmount: inv.taxAmount ?? 0,
      totalAmount: inv.totalAmount,
      notes: inv.notes ?? undefined,
      taxMode: inv.taxMode,
      ...brand,
    };
    openGenerator(data);
  };

  return (
    <div className={styles.page}>
      <InvoiceGeneratorModal
        open={invoiceOpen}
        onClose={closeGenerator}
        invoiceData={invoiceData}
      />

      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Invoices</h1>
          <p className={styles.pageDesc}>
            Auto-generated invoices for all member payments.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>⬇ Export PDF</button>
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
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            All Invoices
          </h2>
        </div>
        <FilterBar
          title="Invoice filters"
          activeCount={activeFilterCount}
          onClear={clearFilters}
        >
          <FilterField label="Search" grow>
            <FilterSearch
              value={search}
              onChange={setSearch}
              placeholder="Invoice #, member, phone…"
            />
          </FilterField>
          <FilterField label="GST mode">
            <FilterSelect value={taxModeFilter} onChange={setTaxModeFilter}>
              <option value="ALL">All GST modes</option>
              <option value="included">GST included</option>
              <option value="excluded">GST excluded</option>
            </FilterSelect>
          </FilterField>
          <FilterField label="From date">
            <FilterInput
              type="date"
              value={dateFrom}
              onChange={setDateFrom}
            />
          </FilterField>
          <FilterField label="To date">
            <FilterInput type="date" value={dateTo} onChange={setDateTo} />
          </FilterField>
          <FilterField label="Min amount (₹)">
            <FilterInput
              type="number"
              value={amountMin}
              onChange={setAmountMin}
              placeholder="0"
              min={0}
            />
          </FilterField>
          <FilterField label="Max amount (₹)">
            <FilterInput
              type="number"
              value={amountMax}
              onChange={setAmountMax}
              placeholder="Any"
              min={0}
            />
          </FilterField>
        </FilterBar>

        <div className={styles.tableWrap}>
          {isLoading && (
            <p style={{ padding: "1rem", color: "#555" }}>Loading invoices…</p>
          )}
          {isError && (
            <p style={{ padding: "1rem", color: "#e63946" }}>
              Failed to load invoices.
            </p>
          )}

          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Member</th>
                  <th>Location</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "#444",
                      }}
                    >
                      {invoices?.length === 0
                        ? "No invoices found. Create one to get started."
                        : "No invoices match these filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((inv) => {
                  const member = getMember(inv);
                  const loc = getInvoiceLocation(inv);
                  return (
                    <tr key={inv._id}>
                      <td className={styles.cellId}>{inv.invoiceNumber}</td>
                      <td>
                        <div className={styles.cellName}>
                          {member?.name ?? "—"}
                        </div>
                        <div className={styles.cellEmail}>
                          {member?.phone ?? "—"}
                        </div>
                      </td>
                      <td style={{ color: "#666", fontSize: "0.82rem" }}>
                        {loc?.name ?? "—"}
                      </td>
                      <td style={{ color: "#666", fontSize: "0.82rem" }}>
                        {inv.items.map((it) => it.description).join(", ")}
                      </td>
                      <td className={styles.cellAmount}>
                        ₹{inv.subtotal.toLocaleString()}
                      </td>
                      <td style={{ color: "#666" }}>
                        {inv.taxPercentage > 0
                          ? `${inv.taxPercentage}% ${inv.taxMode === "included" ? "incl." : "excl."}`
                          : "—"}
                      </td>
                      <td className={styles.cellAmount}>
                        ₹{inv.totalAmount.toLocaleString()}
                      </td>
                      <td className={styles.cellMono}>
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </td>
                      <td>
                        <RowActions
                          actions={[
                            {
                              label: "View",
                              onClick: () => setSelectedInvoice(inv),
                            },
                            {
                              label: "Edit GST",
                              onClick: () => setTaxEditInvoice(inv),
                            },
                            {
                              label: "PDF",
                              onClick: () => handleGenerateInvoice(inv),
                            },
                            {
                              label: "Delete",
                              onClick: () => deleteInvoice(inv._id),
                              tone: "danger",
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Page {paged?.page ?? page} of {pages} · {listTotal} invoices
            {filtered.length !== (invoices?.length ?? 0)
              ? ` · ${filtered.length} on this page after filters`
              : ""}
          </span>
          <div className={styles.paginationBtns}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((x) => Math.max(1, x - 1))}
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.pageBtn} ${styles.pageBtnActive}`}
            >
              {page}
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page >= pages}
              onClick={() => setPage((x) => x + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </motion.div>

      {mounted &&
        selectedInvoice &&
        createPortal(
          <AnimatePresence>
            {selectedInvoice && (
              <>
                <motion.div
                  className={styles.backdrop}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedInvoice(null)}
                />
                <motion.div
                  className={styles.invoiceViewModal}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={styles.invoiceViewHeader}>
                    <h2 className={styles.invoiceViewTitle}>
                      Invoice {selectedInvoice.invoiceNumber}
                    </h2>
                    <button
                      className={styles.closeBtn}
                      onClick={() => setSelectedInvoice(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className={styles.invoiceViewContent}>
                    <InvoiceTemplate
                      invoiceNumber={selectedInvoice.invoiceNumber}
                      invoiceDate={selectedInvoice.invoiceDate}
                      dueDate={selectedInvoice.dueDate}
                      memberName={getMember(selectedInvoice)?.name || ""}
                      memberContact={getMember(selectedInvoice)?.phone || ""}
                      memberInstagram={undefined}
                      {...invoiceDocumentDetails(selectedInvoice)}
                      items={selectedInvoice.items}
                      subtotal={selectedInvoice.subtotal}
                      taxPercentage={selectedInvoice.taxPercentage}
                      taxAmount={selectedInvoice.taxAmount || 0}
                      totalAmount={selectedInvoice.totalAmount}
                      notes={selectedInvoice.notes}
                      {...invoiceBrandFromLocation(selectedInvoice)}
                      taxMode={selectedInvoice.taxMode}
                      showActions={true}
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}

      <InvoiceTaxEditModal
        open={!!taxEditInvoice}
        invoice={taxEditInvoice}
        onClose={() => setTaxEditInvoice(null)}
      />
    </div>
  );
}
