"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import {
  useGymSettings,
  useUpdateGymSettings,
  useUploadGymAsset,
} from "@/services/gym-settings/gym-settings.hooks";
import { canEditGymSettings } from "@/lib/rbac";
import {
  resolveUploadLimits,
  validateImageFile,
  UPLOAD_ACCEPT,
} from "@/lib/upload";
import {
  INVOICE_LAYOUTS,
  INVOICE_LAYOUT_LABELS,
  INVOICE_STAMP_ALIGNS,
  INVOICE_STAMP_ALIGN_LABELS,
  type InvoiceLayout,
  type InvoiceStampAlign,
} from "@/config/invoice";
import { COUNTRIES, DEFAULT_COUNTRY_CODE } from "@/config/countries";
import {
  computeTaxBreakdown,
  INVOICE_TAX_MODE_LABELS,
  type InvoiceTaxMode,
} from "@/lib/tax";
import InvoiceTemplate from "@/app/(app)/invoices/InvoiceTemplate";
import styles from "@/app/(app)/profile/Profile.module.css";

const SAMPLE_PLAN_PRICE = 5000;

/**
 * Per-company branding + invoice PDF options.
 * Each gym admin configures their own — saved against their companyId.
 */
export default function GymBrandingSettings() {
  const { user } = useAuth();
  const canEdit = canEditGymSettings(user?.role, user?.permissions);
  const { data: settings, isLoading } = useGymSettings(!!user?.companyId);
  const updateSettings = useUpdateGymSettings();
  const uploadAsset = useUploadGymAsset();

  const [prefix, setPrefix] = useState("GYM");
  const [gymName, setGymName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#c0392b");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoicePhone, setInvoicePhone] = useState("");
  const [invoiceGstin, setInvoiceGstin] = useState("");
  const [invoiceFooter, setInvoiceFooter] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [invoiceLayout, setInvoiceLayout] = useState<InvoiceLayout>("classic");
  const [stampAlign, setStampAlign] = useState<InvoiceStampAlign>("right");
  const [showLogo, setShowLogo] = useState(true);
  const [showStamp, setShowStamp] = useState(true);
  const [showGstin, setShowGstin] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showContact, setShowContact] = useState(true);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [taxMode, setTaxMode] = useState<InvoiceTaxMode>("excluded");

  useEffect(() => {
    if (!settings) return;
    setPrefix(settings.memberIdPrefix || "GYM");
    setGymName(settings.gymName || "");
    setPrimaryColor(settings.primaryColor || "#c0392b");
    setInvoiceAddress(settings.invoiceAddress || "");
    setInvoiceEmail(settings.invoiceEmail || "");
    setInvoicePhone(settings.invoicePhone || "");
    setInvoiceGstin(settings.invoiceGstin || "");
    setInvoiceFooter(settings.invoiceFooter || "");
    setWebsiteUrl(settings.websiteUrl || "");
    setInvoiceLayout((settings.invoiceLayout as InvoiceLayout) || "classic");
    setStampAlign(
      settings.invoiceStampAlign === "left" ||
        settings.invoiceStampAlign === "center" ||
        settings.invoiceStampAlign === "right"
        ? settings.invoiceStampAlign
        : "right",
    );
    setShowLogo(settings.invoiceShowLogo !== false);
    setShowStamp(settings.invoiceShowStamp !== false);
    setShowGstin(settings.invoiceShowGstin !== false);
    setShowAddress(settings.invoiceShowAddress !== false);
    setShowContact(settings.invoiceShowContact !== false);
    setCountryCode(settings.countryCode || DEFAULT_COUNTRY_CODE);
    // 0 in DB = unset for new gyms; default sample/config to 18% so breakdown is visible
    setTaxPercentage(
      typeof settings.invoiceTaxPercentage === "number" &&
        settings.invoiceTaxPercentage > 0
        ? settings.invoiceTaxPercentage
        : 18,
    );
    setTaxMode(
      settings.invoiceTaxMode === "included" ? "included" : "excluded",
    );
  }, [settings]);

  const sampleBreakdown = computeTaxBreakdown(
    SAMPLE_PLAN_PRICE,
    taxPercentage,
    taxMode,
  );

  const handleSave = async () => {
    if (!prefix.trim()) {
      toast.error("Member ID prefix is required");
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor.trim())) {
      toast.error("Brand color must be hex like #c0392b");
      return;
    }
    try {
      await updateSettings.mutateAsync({
        memberIdPrefix: prefix.trim(),
        gymName: gymName.trim() || undefined,
        primaryColor: primaryColor.trim(),
        invoiceAddress: invoiceAddress.trim(),
        invoiceEmail: invoiceEmail.trim(),
        invoicePhone: invoicePhone.trim(),
        invoiceGstin: invoiceGstin.trim(),
        invoiceFooter: invoiceFooter.trim(),
        websiteUrl: websiteUrl.trim(),
        invoiceLayout,
        invoiceStampAlign: stampAlign,
        invoiceShowLogo: showLogo,
        invoiceShowStamp: showStamp,
        invoiceShowGstin: showGstin,
        invoiceShowAddress: showAddress,
        invoiceShowContact: showContact,
        invoiceTaxPercentage: taxPercentage,
        invoiceTaxMode: taxMode,
        countryCode,
      });
      toast.success("Saved for this gym — invoices & app will use these settings");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save");
    }
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "logo" | "favicon" | "stamp",
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const limits = resolveUploadLimits(settings?.upload);
    const err = validateImageFile(file, limits);
    if (err) {
      toast.error(err);
      return;
    }
    try {
      await uploadAsset.mutateAsync({ file, kind });
      const label =
        kind === "favicon" ? "Favicon" : kind === "stamp" ? "Stamp" : "Logo";
      toast.success(`${label} uploaded for this gym`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Upload failed");
    }
  };

  if (!user?.companyId) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleBar} />
            Gym settings
          </h2>
        </div>
        <p style={{ padding: "16px 22px", fontSize: 13, color: "var(--text-2)" }}>
          Select a gym first to configure branding and invoices.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-2)" }}>Loading gym settings…</p>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <span className={styles.cardTitleBar} />
          Branding &amp; invoices
        </h2>
        <span className={styles.cardBadge}>
          {user.companyName || "This gym"} only
        </span>
      </div>

      <p
        style={{
          padding: "0 22px",
          marginTop: 12,
          fontSize: 12,
          color: "var(--text-2)",
          lineHeight: 1.45,
        }}
      >
        Configure name, logo, stamp, colors, and invoice PDF layout for{" "}
        <strong style={{ color: "var(--text)" }}>
          {user.companyName || "your gym"}
        </strong>
        . Other gyms keep their own settings. Logo/stamp are optional — invoices
        still generate without them.
      </p>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Member ID Prefix</label>
          <input
            className={styles.formInput}
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            placeholder="GYM"
            maxLength={20}
            disabled={!canEdit}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Preview</label>
          <input
            className={styles.formInput}
            value={`${(prefix || "GYM").trim().toUpperCase() || "GYM"}-0001`}
            disabled
          />
        </div>
        <div className={styles.formGroupFull}>
          <label className={styles.formLabel}>Gym / Brand Name</label>
          <input
            className={styles.formInput}
            value={gymName}
            onChange={(e) => setGymName(e.target.value)}
            placeholder="Shown in sidebar, invoices, browser title"
            disabled={!canEdit}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Country</label>
          <select
            className={styles.formInput}
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={!canEdit}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.currency})
              </option>
            ))}
          </select>
          <span style={{ fontSize: "0.72rem", color: "#888", marginTop: 4 }}>
            Sets currency & date format for invoices (e.g. ₹ / $ / AED)
          </span>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Brand Color</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              disabled={!canEdit}
              style={{
                width: 40,
                height: 36,
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            />
            <input
              className={styles.formInput}
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#c0392b"
              maxLength={7}
              disabled={!canEdit}
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Website</label>
          <input
            className={styles.formInput}
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourgym.com"
            disabled={!canEdit}
          />
        </div>

        {canEdit && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Logo (optional)</label>
              {settings?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  style={{
                    maxHeight: 48,
                    maxWidth: 120,
                    objectFit: "contain",
                    marginBottom: 8,
                    display: "block",
                  }}
                />
              ) : null}
              <input
                type="file"
                accept={UPLOAD_ACCEPT}
                onChange={(e) => handleUpload(e, "logo")}
                disabled={uploadAsset.isPending}
              />
              <span style={{ fontSize: "0.72rem", color: "#888" }}>
                Max {resolveUploadLimits(settings?.upload).maxFileMb}MB
              </span>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Favicon (optional)</label>
              {settings?.faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.faviconUrl}
                  alt="Favicon"
                  style={{
                    maxHeight: 32,
                    maxWidth: 32,
                    objectFit: "contain",
                    marginBottom: 8,
                    display: "block",
                  }}
                />
              ) : null}
              <input
                type="file"
                accept={UPLOAD_ACCEPT}
                onChange={(e) => handleUpload(e, "favicon")}
                disabled={uploadAsset.isPending}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Invoice stamp (optional)</label>
              {settings?.stampUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.stampUrl}
                  alt="Stamp"
                  style={{
                    maxHeight: 64,
                    maxWidth: 100,
                    objectFit: "contain",
                    marginBottom: 8,
                    display: "block",
                  }}
                />
              ) : null}
              <input
                type="file"
                accept={UPLOAD_ACCEPT}
                onChange={(e) => handleUpload(e, "stamp")}
                disabled={uploadAsset.isPending}
              />
            </div>
          </>
        )}

        <div className={styles.formGroupFull}>
          <label className={styles.formLabel}>Invoice Address (optional)</label>
          <textarea
            className={styles.formTextarea}
            value={invoiceAddress}
            onChange={(e) => setInvoiceAddress(e.target.value)}
            placeholder="Street, city, pincode"
            disabled={!canEdit}
            rows={2}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Invoice Email</label>
          <input
            className={styles.formInput}
            value={invoiceEmail}
            onChange={(e) => setInvoiceEmail(e.target.value)}
            placeholder="billing@yourgym.com"
            disabled={!canEdit}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Invoice Phone</label>
          <input
            className={styles.formInput}
            value={invoicePhone}
            onChange={(e) => setInvoicePhone(e.target.value)}
            placeholder="+91 …"
            disabled={!canEdit}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>GSTIN</label>
          <input
            className={styles.formInput}
            value={invoiceGstin}
            onChange={(e) => setInvoiceGstin(e.target.value)}
            placeholder="22AAAAA0000A1Z5"
            disabled={!canEdit}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>GST rate (%)</label>
          <input
            className={styles.formInput}
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={taxPercentage}
            onChange={(e) =>
              setTaxPercentage(Math.max(0, Number(e.target.value) || 0))
            }
            disabled={!canEdit}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>GST on plan price</label>
          <select
            className={styles.formInput}
            value={taxMode}
            onChange={(e) => setTaxMode(e.target.value as InvoiceTaxMode)}
            disabled={!canEdit}
          >
            {(Object.keys(INVOICE_TAX_MODE_LABELS) as InvoiceTaxMode[]).map(
              (m) => (
                <option key={m} value={m}>
                  {INVOICE_TAX_MODE_LABELS[m]}
                </option>
              ),
            )}
          </select>
        </div>
        <div className={styles.formGroupFull}>
          <label className={styles.formLabel}>Invoice Footer (optional)</label>
          <textarea
            className={styles.formTextarea}
            value={invoiceFooter}
            onChange={(e) => setInvoiceFooter(e.target.value)}
            placeholder="Thank you note / payment terms"
            disabled={!canEdit}
            rows={2}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Invoice PDF layout</label>
          <select
            className={styles.formInput}
            value={invoiceLayout}
            onChange={(e) => setInvoiceLayout(e.target.value as InvoiceLayout)}
            disabled={!canEdit}
          >
            {INVOICE_LAYOUTS.map((l) => (
              <option key={l} value={l}>
                {INVOICE_LAYOUT_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Stamp position</label>
          <select
            className={styles.formInput}
            value={stampAlign}
            onChange={(e) =>
              setStampAlign(e.target.value as InvoiceStampAlign)
            }
            disabled={!canEdit || !showStamp}
          >
            {INVOICE_STAMP_ALIGNS.map((a) => (
              <option key={a} value={a}>
                {INVOICE_STAMP_ALIGN_LABELS[a]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroupFull}>
          <label className={styles.formLabel}>
            Show on invoice (when uploaded / filled)
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 18px",
              marginTop: 4,
            }}
          >
            {(
              [
                ["Logo", showLogo, setShowLogo],
                ["Stamp", showStamp, setShowStamp],
                ["GSTIN", showGstin, setShowGstin],
                ["Address", showAddress, setShowAddress],
                ["Email / phone / web", showContact, setShowContact],
              ] as const
            ).map(([label, checked, set]) => (
              <label
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: "var(--text-2)",
                  cursor: canEdit ? "pointer" : "default",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => set(e.target.checked)}
                  disabled={!canEdit}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          margin: "8px 22px 20px",
          padding: "16px 18px 20px",
          borderRadius: 10,
          border: "1px solid var(--border, rgba(0,0,0,0.08))",
          background: "var(--bg-2, #fafafa)",
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-3, #888)",
          }}
        >
          Live sample preview
        </p>
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 13,
            color: "var(--text-2, #555)",
            lineHeight: 1.45,
          }}
        >
          Example ₹{SAMPLE_PLAN_PRICE.toLocaleString()} plan · GST{" "}
          {taxPercentage}% ({taxMode})
          {taxMode === "included"
            ? ` — GST taken out of ₹${SAMPLE_PLAN_PRICE.toLocaleString()}.`
            : ` — GST added on top of ₹${SAMPLE_PLAN_PRICE.toLocaleString()} → total ₹${sampleBreakdown.totalAmount.toLocaleString()}.`}{" "}
          Save to apply on real invoices.
        </p>
        <div
          style={{
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.06)",
            background: "#fff",
            overflow: "hidden",
            // zoom shrinks layout too (no inner scrollbar / empty gap)
            zoom: 0.78,
          }}
        >
          <InvoiceTemplate
            invoiceNumber="SAMPLE-001"
            invoiceDate={new Date().toISOString()}
            memberName="Sample Member"
            memberContact="99999 00000"
            items={[
              {
                description: "Sample plan — Payment",
                amount: sampleBreakdown.subtotal,
              },
            ]}
            subtotal={sampleBreakdown.subtotal}
            taxPercentage={sampleBreakdown.taxPercentage}
            taxAmount={sampleBreakdown.taxAmount}
            totalAmount={sampleBreakdown.totalAmount}
            taxMode={sampleBreakdown.taxMode}
            gymName={gymName.trim() || settings?.gymName || "Your Gym"}
            gymAddress={showAddress ? invoiceAddress || undefined : undefined}
            gymEmail={showContact ? invoiceEmail || undefined : undefined}
            gymPhone={showContact ? invoicePhone || undefined : undefined}
            gymLogoUrl={showLogo ? settings?.logoUrl ?? null : null}
            gymStampUrl={showStamp ? settings?.stampUrl ?? null : null}
            gymGstin={showGstin ? invoiceGstin || null : null}
            gymFooter={invoiceFooter || null}
            gymWebsite={showContact ? websiteUrl || null : null}
            primaryColor={primaryColor}
            layout={invoiceLayout}
            showLogo={showLogo}
            showStamp={showStamp}
            stampAlign={stampAlign}
            showGstin={showGstin}
            showAddress={showAddress}
            showContact={showContact}
            notes={
              taxMode === "included"
                ? "Sample: plan price includes GST"
                : "Sample: GST added on plan price"
            }
            showActions={false}
          />
        </div>
      </div>

      {canEdit && (
        <div className={styles.formActions}>
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? "Saving…" : "Save for this gym"}
          </button>
        </div>
      )}

      {!canEdit && (
        <p
          style={{
            padding: "0 22px 20px",
            fontSize: 12,
            color: "var(--text-3)",
          }}
        >
          View only — ask your gym admin to change branding.
        </p>
      )}
    </div>
  );
}
