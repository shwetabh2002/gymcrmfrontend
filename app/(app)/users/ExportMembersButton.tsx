"use client";

import { useEffect, useState } from "react";
import { generateExcelFile } from "@/services/members/members.excel-handler";
import { Member } from "@/services/members/members.api";

interface Props {
  members?: Member[];
  resolveMembersForExport?: () => Promise<Member[]>;
  buttonClassName?: string;
}

export default function ExportMembersButton({
  members = [],
  resolveMembersForExport,
  buttonClassName = "",
}: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleExport = async () => {
    setIsExporting(true);
    setError("");

    try {
      const exportRows = resolveMembersForExport
        ? await resolveMembersForExport()
        : members;

      if (exportRows.length === 0) {
        setError("No members to export");
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `gym_members_${timestamp}.xlsx`;
      await generateExcelFile(exportRows, filename);
    } catch (err: any) {
      setError(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <button
        className={buttonClassName}
        onClick={handleExport}
        disabled={isExporting}
        title="Export members to Excel"
      >
        {isExporting ? "Exporting…" : "⬇ Export Excel"}
      </button>
      {error && (
        <span style={{ fontSize: "12px", color: "#ff9999", fontFamily: "monospace" }}>
          {error}
        </span>
      )}
    </div>
  );
}
