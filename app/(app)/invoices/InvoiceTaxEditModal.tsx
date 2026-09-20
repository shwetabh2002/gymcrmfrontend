"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Invoice } from "@/services/invoices/invoices.api";
import { useUpdateInvoice } from "@/services/invoices/invoices.hooks";
import {
  InvoiceTaxMode,
  computeTaxBreakdown,
  isInvoiceTaxMode,
} from "@/lib/tax";
import { EASE_OUT_EXPO } from "@/config/motion";
import styles from "./Invoices.module.css";

interface Props {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
}

function money(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

export default function InvoiceTaxEditModal({
  open,
  invoice,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const updateInvoice = useUpdateInvoice();
  const [taxMode, setTaxMode] = useState<InvoiceTaxMode>("excluded");
  const [taxPercentage, setTaxPercentage] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!invoice) return;
    setTaxMode(
      isInvoiceTaxMode(invoice.taxMode) ? invoice.taxMode : "excluded",
    );
    setTaxPercentage(Number(invoice.taxPercentage) || 0);
  }, [invoice]);

  const baseAmount = useMemo(() => {
    if (!invoice) return 0;
    const payment =
      typeof invoice.paymentId === "object" && invoice.paymentId
        ? invoice.paymentId.amount
        : null;
    if (typeof payment === "number") return payment;
    // Standalone: flip around the amount that was configured at create time
    return invoice.taxMode === "included"
      ? invoice.totalAmount
      : invoice.subtotal;
  }, [invoice]);

  const preview = useMemo(
    () => computeTaxBreakdown(baseAmount, taxPercentage, taxMode),
    [baseAmount, taxPercentage, taxMode],
  );

  const save = async () => {
    if (!invoice) return;
    try {
      await updateInvoice.mutateAsync({
        id: invoice._id,
        payload: { taxMode, taxPercentage },
      });
      toast.success("Invoice GST updated");
      onClose();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Could not update invoice GST",
      );
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && invoice ? (
        <>
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modalPanel}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              translate: "-50% -50%",
              zIndex: 120,
              width: 420,
              maxWidth: "calc(100vw - 2rem)",
              background: "var(--surface, #111)",
              border: "1px solid var(--border, #242424)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>
              Edit GST — {invoice.invoiceNumber}
            </h3>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: 12,
                color: "var(--text-2, #888)",
              }}
            >
              Switch included ↔ excluded without changing the payment amount (
              {money(baseAmount)}).
            </p>

            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "#888",
                marginBottom: 6,
              }}
            >
              GST mode
            </label>
            <select
              value={taxMode}
              onChange={(e) => setTaxMode(e.target.value as InvoiceTaxMode)}
              style={{
                width: "100%",
                marginBottom: 12,
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #2a2a2a",
                background: "#161616",
                color: "#eee",
              }}
            >
              <option value="included">Included in amount</option>
              <option value="excluded">Excluded — add on top</option>
            </select>

            <label
              style={{
                display: "block",
                fontSize: 11,
                color: "#888",
                marginBottom: 6,
              }}
            >
              GST %
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={taxPercentage}
              onChange={(e) => setTaxPercentage(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                marginBottom: 14,
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #2a2a2a",
                background: "#161616",
                color: "#eee",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                fontSize: 12,
                color: "#aaa",
                lineHeight: 1.6,
                marginBottom: 16,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #242424",
              }}
            >
              <div>Taxable {money(preview.subtotal)}</div>
              <div>
                GST {money(preview.taxAmount)} ({taxPercentage}% {taxMode})
              </div>
              <div style={{ color: "#eee", fontWeight: 600 }}>
                Invoice total {money(preview.totalAmount)}
              </div>
            </div>

            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button type="button" className={styles.btnGhost} onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={save}
                disabled={updateInvoice.isPending}
              >
                {updateInvoice.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
