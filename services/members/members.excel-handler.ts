/**
 * Excel file handling utilities
 * Handles reading and writing Excel files for member data import/export
 */

import { ExcelMemberRow, excelRowToMember, memberToExcelRow } from "./members.import-export";
import { Member, CreateMemberPayload } from "./members.api";

/**
 * Parse Excel file and extract member data
 * Supports .xlsx files via client-side parsing
 */
export async function parseExcelFile(file: File): Promise<CreateMemberPayload[]> {
  // Dynamic import to avoid dependency issues
  const XLSX = await import("xlsx");

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("No sheets found in Excel file");
    }

    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with proper typing
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    
    // Extract headers and data
    if (rows.length < 2) {
      throw new Error("Excel file must contain headers and at least one data row");
    }

    const headers = rows[0] as string[];
    const dataRows = rows.slice(1) as any[][];

    // Map rows to objects with headers
    const members: CreateMemberPayload[] = [];
    const errors: string[] = [];

    dataRows.forEach((rowData: any[], idx: number) => {
      // Create object from row data
      const row: Partial<ExcelMemberRow> = {};
      headers.forEach((header: string, colIdx: number) => {
        row[header as keyof ExcelMemberRow] = rowData[colIdx];
      });

      // Skip empty rows
      if (!row["Client Name"] && !row["Phone Number"]) {
        return;
      }

      // Convert to member payload
      const member = excelRowToMember(row as ExcelMemberRow);
      if (member) {
        members.push(member);
      } else {
        errors.push(`Row ${idx + 2}: Invalid member data (missing name or phone)`);
      }
    });

    if (members.length === 0 && errors.length > 0) {
      throw new Error(`No valid members found:\n${errors.join("\n")}`);
    }

    return members;
  } catch (error: any) {
    throw new Error(`Failed to parse Excel file: ${error?.message || "Unknown error"}`);
  }
}

/**
 * Generate Excel file from member data
 */
export async function generateExcelFile(members: Member[], filename: string = "gym_members.xlsx"): Promise<void> {
  const XLSX = await import("xlsx");

  try {
    // Convert members to Excel rows
    const excelRows = members.map(memberToExcelRow);

    // Define column order
    const columns = [
      "ID. NO",
      "Date",
      "Client Name",
      "Phone Number",
      "DOB",
      "INSTAGRAM @",
      "PACKAGE",
      "AMOUNT",
      "RECEIVED",
      "BAL AMOUNT",
      "MOP",
      "SALES",
      "TRAINING TYPE",
      "Trainer assigned",
      "MEMBER TYPE",
      "STARTING DATE",
      "EXPIRY DATE",
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelRows, { header: columns });

    // Set column widths
    const colWidths = {
      "A": 12, // ID. NO
      "B": 12, // Date
      "C": 20, // Client Name
      "D": 15, // Phone Number
      "E": 12, // DOB
      "F": 16, // INSTAGRAM @
      "G": 15, // PACKAGE
      "H": 12, // AMOUNT
      "I": 12, // RECEIVED
      "J": 12, // BAL AMOUNT
      "K": 12, // MOP
      "L": 15, // SALES
      "M": 15, // TRAINING TYPE
      "N": 18, // Trainer assigned
      "O": 14, // MEMBER TYPE
      "P": 15, // STARTING DATE
      "Q": 15, // EXPIRY DATE
    };

    worksheet["!cols"] = Object.values(colWidths).map(width => ({ wch: width }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

    // Generate file and trigger download
    XLSX.writeFile(workbook, filename);
  } catch (error: any) {
    throw new Error(`Failed to generate Excel file: ${error?.message || "Unknown error"}`);
  }
}

/**
 * Validate Excel file before processing
 */
export async function validateExcelFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file type
  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    return {
      valid: false,
      error: "Only .xlsx and .xls files are supported",
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size must be less than 5MB",
    };
  }

  return { valid: true };
}
