"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Invoices.module.css";
import { useInvoices, useDeleteInvoice } from "@/services/invoices/invoices.hooks";
import { Invoice } from "@/services/invoices/invoices.api";
import InvoiceTemplate from "./InvoiceTemplate";
import InvoiceGeneratorModal, { InvoiceGeneratorData } from "@/app/(app)/invoices/InvoiceGeneratorModal";
import { useInvoiceGenerator } from "@/services/invoices/invoices.generator.hook";
import { createPortal } from "react-dom";
import { invoiceBrandFromLocation, getInvoiceLocation } from "@/lib/invoice-location";
import { RowActions } from "@/components/RowActions";

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

function getMember(inv: Invoice) {
  if (typeof inv.memberId === "object" && inv.memberId !== null) return inv.memberId;
  return null;
}

export default function InvoicesPage() {
  const { data: invoices, isLoading, isError } = useInvoices();
  const { mutate: deleteInvoice } = useDeleteInvoice();
  const { isOpen: invoiceOpen, invoiceData, openGenerator, closeGenerator } = useInvoiceGenerator();

  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const total        = invoices?.length ?? 0;
  const totalAmount  = invoices?.reduce((sum, i) => sum + i.totalAmount, 0) ?? 0;
  const avgAmount    = total > 0 ? Math.round(totalAmount / total) : 0;
  const thisMonth    = invoices?.filter(i => {
    const invDate = new Date(i.invoiceDate);
    const now = new Date();
    return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
  }).length ?? 0;

  const filtered = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      const member = getMember(inv);
      const q = search.toLowerCase();
      return !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        member?.name.toLowerCase().includes(q) ||
        (member?.phone ?? "").includes(q);
    });
  }, [invoices, search]);

  const STATS = [
    { label: "Total Invoices", val: String(total),                       sub: "all time" },
    { label: "Total Amount",   val: `₹${totalAmount.toLocaleString()}`,  sub: "billed" },
    { label: "This Month",     val: String(thisMonth),                   sub: "invoices" },
    { label: "Avg Invoice",    val: `₹${avgAmount.toLocaleString()}`,    sub: "per invoice" },
  ];

  const handleGenerateInvoice = (inv: Invoice) => {
    const member = getMember(inv);
    const brand = invoiceBrandFromLocation(inv);
    const data: InvoiceGeneratorData = {
      invoiceNumber: inv.invoiceNumber,
      invoiceDate:   inv.invoiceDate,
      dueDate:       inv.dueDate,
      memberId:      typeof inv.memberId === "object" ? inv.memberId._id : inv.memberId,
      memberName:    member?.name  ?? "Unknown",
      memberContact:   member?.phone ?? "—",
      memberInstagram: undefined,
      items:         inv.items,
      subtotal:      inv.subtotal,
      taxPercentage: inv.taxPercentage,
      taxAmount:     inv.taxAmount ?? 0,
      totalAmount:   inv.totalAmount,
      notes:         inv.notes ?? undefined,
      taxMode:       inv.taxMode,
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

      <motion.div className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
      >
        <div>
          <p className={styles.eyebrow}>Admin Panel</p>
          <h1 className={styles.pageTitle}>Invoices</h1>
          <p className={styles.pageDesc}>Auto-generated invoices for all member payments.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>⬇ Export PDF</button>
        </div>
      </motion.div>

      <motion.div className={styles.statStrip} custom={0} variants={fadeUp} initial="hidden" animate="visible">
        {STATS.map((st) => (
          <div key={st.label} className={styles.statCell}>
            <span className={styles.statLabel}><span className={styles.statLabelDot} />{st.label}</span>
            <span className={styles.statVal}>{st.val}</span>
            <span className={styles.statSub}>{st.sub}</span>
          </div>
        ))}
      </motion.div>

      <motion.div className={styles.card} custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}><span className={styles.cardTitleBar} />All Invoices</h2>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchInput} placeholder="Search invoice or member…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading && <p style={{ padding: "1rem", color: "#555" }}>Loading invoices…</p>}
          {isError   && <p style={{ padding: "1rem", color: "#e63946" }}>Failed to load invoices.</p>}

          {!isLoading && !isError && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th><th>Member</th><th>Location</th><th>Items</th>
                  <th>Subtotal</th><th>Tax</th><th>Total</th>
                  <th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: "#444" }}>
                    {invoices?.length === 0 ? "No invoices found. Create one to get started." : "No invoices match your search."}
                  </td></tr>
                )}
                {filtered.map((inv) => {
                  const member = getMember(inv);
                  const loc = getInvoiceLocation(inv);
                  return (
                    <tr key={inv._id}>
                      <td className={styles.cellId}>{inv.invoiceNumber}</td>
                      <td>
                        <div className={styles.cellName}>{member?.name ?? "—"}</div>
                        <div className={styles.cellEmail}>{member?.phone ?? "—"}</div>
                      </td>
                      <td style={{ color: "#666", fontSize: "0.82rem" }}>
                        {loc?.name ?? "—"}
                      </td>
                      <td style={{ color: "#666", fontSize: "0.82rem" }}>
                        {inv.items.map(it => it.description).join(", ")}
                      </td>
                      <td className={styles.cellAmount}>₹{inv.subtotal.toLocaleString()}</td>
                      <td style={{ color: "#666" }}>{inv.taxPercentage > 0 ? `${inv.taxPercentage}%` : "—"}</td>
                      <td className={styles.cellAmount}>₹{inv.totalAmount.toLocaleString()}</td>
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
            {filtered.length !== invoices?.length
              ? `Showing ${filtered.length} of ${invoices?.length ?? 0} invoices`
              : `${invoices?.length ?? 0} invoice${invoices?.length !== 1 ? "s" : ""}`}
          </span>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn} disabled>‹</button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
            <button className={styles.pageBtn} disabled>›</button>
          </div>
        </div>
      </motion.div>

      {mounted && selectedInvoice && createPortal(
        <AnimatePresence>
          {selectedInvoice && (
            <>
              <motion.div
                className={styles.backdrop}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                  <h2 className={styles.invoiceViewTitle}>Invoice {selectedInvoice.invoiceNumber}</h2>
                  <button className={styles.closeBtn} onClick={() => setSelectedInvoice(null)}>✕</button>
                </div>
                <div className={styles.invoiceViewContent}>
                  <InvoiceTemplate
                    invoiceNumber={selectedInvoice.invoiceNumber}
                    invoiceDate={selectedInvoice.invoiceDate}
                    dueDate={selectedInvoice.dueDate}
                    memberName={getMember(selectedInvoice)?.name || ""}
                    memberContact={getMember(selectedInvoice)?.phone || ""}
                    memberInstagram={undefined}
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
        document.body
      )}
    </div>
  );
}