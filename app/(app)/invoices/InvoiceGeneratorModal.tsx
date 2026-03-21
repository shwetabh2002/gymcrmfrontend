"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import InvoiceTemplate from "./InvoiceTemplate";
import { generateInvoicePDF, printInvoice } from "@/lib/pdf-generator";
import styles from "./InvoiceGeneratorModal.module.css";
import { FaEye } from "react-icons/fa";

export interface InvoiceGeneratorData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  memberId: string;
  memberName: string;
  memberContact: string;
  memberInstagram?: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  gymName?: string;
  gymAddress?: string;
  gymEmail?: string;
  gymPhone?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceData: InvoiceGeneratorData | null;
}

export default function InvoiceGeneratorModal({ open, onClose, invoiceData }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleGeneratePDF = async () => {
    if (!invoiceData) return;
    setIsGenerating(true);
    try {
      await generateInvoicePDF({
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate,
        memberName: invoiceData.memberName,
        memberContact: invoiceData.memberContact,
        memberInstagram: invoiceData.memberInstagram,
        items: invoiceData.items,
        subtotal: invoiceData.subtotal,
        taxPercentage: invoiceData.taxPercentage,
        taxAmount: invoiceData.taxAmount,
        totalAmount: invoiceData.totalAmount,
        notes: invoiceData.notes,
        gymName: invoiceData.gymName,
        gymAddress: invoiceData.gymAddress,
        gymEmail: invoiceData.gymEmail,
        gymPhone: invoiceData.gymPhone,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!invoiceData) return;
    await printInvoice("invoice-template");
  };

  if (!invoiceData) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Invoice Generator</h2>
                <p className={styles.modalSub}>
                  Invoice #{invoiceData.invoiceNumber} for {invoiceData.memberName}
                </p>
              </div>
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles.tabsContainer}>
              <button
                className={`${styles.tab} ${!showPreview ? styles.tabActive : ""}`}
                onClick={() => setShowPreview(false)}
              >
                🔧 Configure
              </button>
              <button
                className={`${styles.tab} ${showPreview ? styles.tabActive : ""}`}
                onClick={() => setShowPreview(true)}
              >
                <FaEye /> Preview
              </button>
            </div>

            <div className={styles.modalContent}>
              {showPreview ? (
                <div className={styles.previewSection}>
                  <InvoiceTemplate
                    invoiceNumber={invoiceData.invoiceNumber}
                    invoiceDate={invoiceData.invoiceDate}
                    dueDate={invoiceData.dueDate}
                    memberName={invoiceData.memberName}
                    memberContact={invoiceData.memberContact}
                    memberInstagram={invoiceData.memberInstagram}
                    items={invoiceData.items}
                    subtotal={invoiceData.subtotal}
                    taxPercentage={invoiceData.taxPercentage}
                    taxAmount={invoiceData.taxAmount}
                    totalAmount={invoiceData.totalAmount}
                    notes={invoiceData.notes}
                    gymName={invoiceData.gymName}
                    gymAddress={invoiceData.gymAddress}
                    gymEmail={invoiceData.gymEmail}
                    gymPhone={invoiceData.gymPhone}
                    showActions={false}
                  />
                </div>
              ) : (
                <div className={styles.configSection}>
                  <div className={styles.configGrid}>
                    <div className={styles.configItem}>
                      <label className={styles.configLabel}>Invoice Number</label>
                      <div className={styles.configValue}>{invoiceData.invoiceNumber}</div>
                    </div>

                    <div className={styles.configItem}>
                      <label className={styles.configLabel}>Invoice Date</label>
                      <div className={styles.configValue}>
                        {new Date(invoiceData.invoiceDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className={styles.configItem}>
                      <label className={styles.configLabel}>Member Name</label>
                      <div className={styles.configValue}>{invoiceData.memberName}</div>
                    </div>

                    <div className={styles.configItem}>
                      <label className={styles.configLabel}>Member Email</label>
                      <div className={styles.configValue}>{invoiceData.memberContact}</div>
                    </div>

                    <div className={styles.configItem}>
                      <label className={styles.configLabel}>Subtotal</label>
                      <div className={styles.configValue}>
                        ₹{invoiceData.subtotal.toLocaleString()}
                      </div>
                    </div>

                    <div className={styles.configItem}>
                      <label className={styles.configLabel}>Tax ({invoiceData.taxPercentage}%)</label>
                      <div className={styles.configValue}>
                        ₹{invoiceData.taxAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className={`${styles.configItem} ${styles.span2}`}>
                      <label className={styles.configLabel}>Total Amount</label>
                      <div className={styles.configValueLarge}>
                        ₹{invoiceData.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {invoiceData.notes && (
                    <div className={styles.notesBox}>
                      <label className={styles.configLabel}>Notes</label>
                      <p className={styles.notesText}>{invoiceData.notes}</p>
                    </div>
                  )}

                  <div className={styles.itemsBox}>
                    <label className={styles.configLabel}>Invoice Items</label>
                    <div className={styles.itemsList}>
                      {invoiceData.items.map((item, idx) => (
                        <div key={idx} className={styles.itemRow}>
                          <span className={styles.itemDesc}>{item.description}</span>
                          <span className={styles.itemAmount}>
                            ₹{item.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>
                Close
              </button>
              <div className={styles.actionButtons}>
                <button
                  className={styles.btnSecondary}
                  onClick={handlePrint}
                  disabled={isGenerating}
                >
                  🖨 Print
                </button>
                <button
                  className={styles.btnPrimary}
                  onClick={handleGeneratePDF}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "⬇ Download PDF"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : null;
}
