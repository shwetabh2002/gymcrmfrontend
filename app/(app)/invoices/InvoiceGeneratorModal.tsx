"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import InvoiceTemplate from "./InvoiceTemplate";
import { generateInvoicePDF, printInvoice } from "@/lib/pdf-generator";
import styles from "./InvoiceGeneratorModal.module.css";
import { FaEye } from "react-icons/fa";
import { IoSettings } from "react-icons/io5";

export interface InvoiceGeneratorData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  memberId: string;
  memberName: string;
  memberContact: string;
  memberInstagram?: string;
  membershipPlan?: string;
  duration?: string;
  membershipFee?: number;
  personalTrainingFee?: number;
  otherCharges?: number;
  paymentMode?: "CASH" | "UPI" | "CARD";
  items: Array<{ description: string; amount: number }>;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  gymName?: string;
  gymAddress?: string;
  gymEmail?: string;
  gymPhone?: string;
  gymGST?: string;
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
        membershipPlan: invoiceData.membershipPlan,
        duration: invoiceData.duration,
        membershipFee: invoiceData.membershipFee,
        personalTrainingFee: invoiceData.personalTrainingFee,
        otherCharges: invoiceData.otherCharges,
        paymentMode: invoiceData.paymentMode,
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
        gymGST: invoiceData.gymGST,
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
            className={`${styles.modal} ${showPreview ? styles.modalWide : ""}`}
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
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
            </div>

            <div className={styles.tabsContainer}>
              <button
                className={`${styles.tab} ${!showPreview ? styles.tabActive : ""}`}
                onClick={() => setShowPreview(false)}
              >
                <IoSettings /> Configure
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
                    membershipPlan={invoiceData.membershipPlan}
                    duration={invoiceData.duration}
                    membershipFee={invoiceData.membershipFee}
                    personalTrainingFee={invoiceData.personalTrainingFee}
                    otherCharges={invoiceData.otherCharges}
                    paymentMode={invoiceData.paymentMode}
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
                    gymGST={invoiceData.gymGST}
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
                      <label className={styles.configLabel}>Member Phone</label>
                      <div className={styles.configValue}>{invoiceData.memberContact}</div>
                    </div>
                    {invoiceData.membershipPlan && (
                      <div className={styles.configItem}>
                        <label className={styles.configLabel}>Membership Plan</label>
                        <div className={styles.configValue}>{invoiceData.membershipPlan}</div>
                      </div>
                    )}
                    {invoiceData.duration && (
                      <div className={styles.configItem}>
                        <label className={styles.configLabel}>Duration</label>
                        <div className={styles.configValue}>{invoiceData.duration}</div>
                      </div>
                    )}
                    {invoiceData.paymentMode && (
                      <div className={styles.configItem}>
                        <label className={styles.configLabel}>Payment Mode</label>
                        <div className={styles.configValue}>{invoiceData.paymentMode}</div>
                      </div>
                    )}
                    {invoiceData.membershipFee !== undefined && (
                      <div className={styles.configItem}>
                        <label className={styles.configLabel}>Membership Fee</label>
                        <div className={styles.configValue}>₹{invoiceData.membershipFee.toLocaleString()}</div>
                      </div>
                    )}
                    {invoiceData.personalTrainingFee !== undefined && invoiceData.personalTrainingFee > 0 && (
                      <div className={styles.configItem}>
                        <label className={styles.configLabel}>Personal Training</label>
                        <div className={styles.configValue}>₹{invoiceData.personalTrainingFee.toLocaleString()}</div>
                      </div>
                    )}
                    {invoiceData.otherCharges !== undefined && invoiceData.otherCharges > 0 && (
                      <div className={styles.configItem}>
                        <label className={styles.configLabel}>Other Charges</label>
                        <div className={styles.configValue}>₹{invoiceData.otherCharges.toLocaleString()}</div>
                      </div>
                    )}
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
                          <span className={styles.itemAmount}>₹{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>Close</button>
              <div className={styles.actionButtons}>
                <button className={styles.btnSecondary} onClick={handlePrint} disabled={isGenerating}>
                  🖨 Print
                </button>
                <button className={styles.btnPrimary} onClick={handleGeneratePDF} disabled={isGenerating}>
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