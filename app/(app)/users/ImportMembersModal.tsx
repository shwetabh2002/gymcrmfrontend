"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateMember } from "@/services/members/members.hook";
import {
  parseExcelFile,
  validateExcelFile,
} from "@/services/members/members.excel-handler";
import { createPayloadToRegisterPayload } from "@/services/members/members.import-export";
import styles from "./ImportMembersModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportMembersModal({ open, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const { mutate: createMember } = useCreateMember();

  useEffect(() => { setMounted(true); }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");
    setPreview([]);
    setProgress(0);

    // Validate file
    const validation = await validateExcelFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setFile(selectedFile);

    try {
      // Parse and preview
      const members = await parseExcelFile(selectedFile);
      setPreview(members.slice(0, 5));
    } catch (err: any) {
      setError(err.message || "Failed to parse file");
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setImporting(true);
    setError("");
    setProgress(0);

    try {
      const members = await parseExcelFile(file);

      if (members.length === 0) {
        setError("No valid members found in the file");
        setImporting(false);
        return;
      }

      // Import members one by one
      let imported = 0;
      for (const member of members) {
        try {
          await new Promise<void>((resolve, reject) => {
            createMember(createPayloadToRegisterPayload(member), {
              onSuccess: () => {
                imported++;
                setProgress(Math.round((imported / members.length) * 100));
                resolve();
              },
              onError: (err: any) => {
                // Log error but continue with next member
                console.error(`Failed to import ${member.name}:`, err);
                imported++;
                setProgress(Math.round((imported / members.length) * 100));
                resolve();
              },
            });
          });
        } catch (err) {
          console.error(`Import error for ${member.name}:`, err);
        }
      }

      setProgress(100);
      setTimeout(() => {
        onClose();
        resetModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Import failed");
      setImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setProgress(0);
    setError("");
    setPreview([]);
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

              {/* Preview */}
              {preview.length > 0 && (
                <div className={styles.previewSection}>
                  <h3 className={styles.previewTitle}>Preview (first 5 members)</h3>
                  <div className={styles.previewTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Package</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((member, idx) => (
                          <tr key={idx}>
                            <td>{member.name}</td>
                            <td>{member.contactNumber}</td>
                            <td>{member.membershipPlan || "—"}</td>
                            <td>₹{member.amount?.toLocaleString() || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress */}
              {importing && (
                <div className={styles.progressSection}>
                  <p className={styles.progressLabel}>Importing members...</p>
                  <div className={styles.progressBar}>
                    <motion.div
                      className={styles.progressFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className={styles.progressPercent}>{progress}%</p>
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
                {importing ? "Importing..." : "Cancel"}
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleImport}
                disabled={!file || importing}
              >
                {importing ? `Importing (${progress}%)` : "Import Members"}
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
