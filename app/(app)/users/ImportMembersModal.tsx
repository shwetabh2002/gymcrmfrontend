"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useImportMembers } from "@/services/members/members.hook";
import { ImportResult } from "@/services/members/members.api";
import styles from "./ImportMembersModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportMembersModal({ open, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { mutate: importMembers, isPending } = useImportMembers();

  useEffect(() => { setMounted(true); }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");
    setImportResult(null);

    // Validate file type
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
    if (!isExcel) {
      setError("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setImporting(true);
    setError("");
    setImportResult(null);

    importMembers(file, {
      onSuccess: (result) => {
        setImporting(false);
        setImportResult(result);

        // If all successful, close modal after a delay
        if (result.failed === 0 && result.errors.length === 0) {
          setTimeout(() => {
            onClose();
            resetModal();
          }, 2000);
        }
      },
      onError: (err: any) => {
        setImporting(false);
        setError(err?.response?.data?.message || err.message || "Import failed");
      },
    });
  };

  const resetModal = () => {
    setFile(null);
    setError("");
    setImportResult(null);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Import Members</h2>
                <p className={styles.modalSubtitle}>Upload an Excel file with member data</p>
              </div>
              <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.scrollBody}>
              {/* File Upload */}
              <div className={styles.uploadSection}>
                <div
                  className={`${styles.uploadBox} ${file ? styles.uploadBoxActive : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <div className={styles.uploadIcon}>📁</div>
                  {file ? (
                    <>
                      <p className={styles.uploadFileName}>{file.name}</p>
                      <p className={styles.uploadFileSize}>
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={styles.uploadText}>Click to select or drag and drop</p>
                      <p className={styles.uploadSubtext}>Excel files (.xlsx, .xls)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Import Result */}
              {importResult && (
                <div className={styles.resultSection}>
                  <h3 className={styles.resultTitle}>Import Results</h3>
                  <div className={styles.resultStats}>
                    <div className={styles.resultStat}>
                      <span className={styles.resultLabel}>Total:</span>
                      <span className={styles.resultValue}>{importResult.success + importResult.failed + importResult.skipped}</span>
                    </div>
                    <div className={`${styles.resultStat} ${styles.success}`}>
                      <span className={styles.resultLabel}>✓ Success:</span>
                      <span className={styles.resultValue}>{importResult.success}</span>
                    </div>
                    {importResult.failed > 0 && (
                      <div className={`${styles.resultStat} ${styles.failed}`}>
                        <span className={styles.resultLabel}>✗ Failed:</span>
                        <span className={styles.resultValue}>{importResult.failed}</span>
                      </div>
                    )}
                    {importResult.skipped > 0 && (
                      <div className={`${styles.resultStat} ${styles.skipped}`}>
                        <span className={styles.resultLabel}>⊘ Skipped:</span>
                        <span className={styles.resultValue}>{importResult.skipped}</span>
                      </div>
                    )}
                  </div>

                  {/* Errors */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className={styles.errorList}>
                      <h4>Errors:</h4>
                      <ul>
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>
                            Row {err.row}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skipped */}
                  {importResult.skippedMembers && importResult.skippedMembers.length > 0 && (
                    <div className={styles.skippedList}>
                      <h4>Skipped Members:</h4>
                      <ul>
                        {importResult.skippedMembers.map((skip, idx) => (
                          <li key={idx}>
                            Row {skip.row} - {skip.name}: {skip.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              {importing && (
                <div className={styles.progressSection}>
                  <p className={styles.progressLabel}>Importing members from Excel...</p>
                  <div className={styles.spinner}></div>
                </div>
              )}

              {/* Instructions */}
              <div className={styles.instructions}>
                <h4 className={styles.instructionsTitle}>Required Format:</h4>
                <ul className={styles.instructionsList}>
                  <li>Excel file with columns: ID. NO, Date, Client Name, Phone Number, DOB, INSTAGRAM @, PACKAGE, AMOUNT, RECEIVED, BAL AMOUNT, MOP, SALES, TRAINING TYPE, Trainer assigned, MEMBER TYPE, STARTING DATE, EXPIRY DATE</li>
                  <li>Client Name and Phone Number are required fields</li>
                  <li>Max file size: 5MB</li>
                  <li>Supports .xlsx and .xls formats</li>
                </ul>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose} disabled={importing}>
                {importResult ? "Close" : "Cancel"}
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleImport}
                disabled={!file || importing || !!importResult}
              >
                {importing ? "Importing..." : importResult ? "Import Complete" : "Import Members"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
