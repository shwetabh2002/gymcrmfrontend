"use client";

import { useEffect, useState } from "react";
import {
  EXPORT_PERIOD_OPTIONS,
  ExportPeriodPreset,
  buildExportFilename,
  resolveExportPeriod,
} from "@/lib/export/date-period";

interface ExportExcelBarProps {
  moduleName: string;
  buttonClassName?: string;
  selectClassName?: string;
  /** Current period from page filters — export uses the same range */
  period: ExportPeriodPreset;
  customFrom?: string;
  customTo?: string;
  onPeriodChange?: (preset: ExportPeriodPreset) => void;
  onCustomFromChange?: (value: string) => void;
  onCustomToChange?: (value: string) => void;
  /** Fetch all rows matching active filters + period */
  resolveRowsForExport: () => Promise<Record<string, unknown>[]>;
  /** Optional fixed column order */
  columns?: string[];
  sheetName?: string;
  /** Hide period controls when page owns them elsewhere */
  hidePeriodControls?: boolean;
}

export default function ExportExcelBar({
  moduleName,
  buttonClassName = "",
  selectClassName = "",
  period,
  customFrom = "",
  customTo = "",
  onPeriodChange,
  onCustomFromChange,
  onCustomToChange,
  resolveRowsForExport,
  columns,
  sheetName,
  hidePeriodControls = false,
}: ExportExcelBarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const handleExport = async () => {
    setIsExporting(true);
    setError("");
    try {
      if (period === "custom" && !customFrom && !customTo) {
        throw new Error("Select a from and to date for custom export");
      }
      if (period === "custom" && customFrom && customTo && customFrom > customTo) {
        throw new Error("From date must be on or before to date");
      }
      const rows = await resolveRowsForExport();
      const range = resolveExportPeriod(period, customFrom, customTo);
      const filename = buildExportFilename(moduleName, period, range);
      const { downloadExcelRows } = await import("@/lib/export/excel");
      await downloadExcelRows(
        rows,
        sheetName ?? moduleName,
        filename,
        columns,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Export failed";
      setError(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {!hidePeriodControls && onPeriodChange && (
        <>
          <select
            className={selectClassName}
            value={period}
            onChange={(e) =>
              onPeriodChange(e.target.value as ExportPeriodPreset)
            }
            title="Export period"
          >
            {EXPORT_PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {period === "custom" && (
            <>
              <input
                className={selectClassName}
                type="date"
                value={customFrom}
                onChange={(e) => onCustomFromChange?.(e.target.value)}
                title="From date"
              />
              <input
                className={selectClassName}
                type="date"
                value={customTo}
                onChange={(e) => onCustomToChange?.(e.target.value)}
                title="To date"
              />
            </>
          )}
        </>
      )}
      <button
        type="button"
        className={buttonClassName}
        onClick={handleExport}
        disabled={isExporting}
        title={`Export ${moduleName} to Excel`}
      >
        {isExporting ? "Exporting…" : "⬇ Export Excel"}
      </button>
      {error && (
        <span style={{ fontSize: 12, color: "#e63946", fontFamily: "monospace" }}>
          {error}
        </span>
      )}
    </div>
  );
}
