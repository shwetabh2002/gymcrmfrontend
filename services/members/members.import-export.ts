import { Member, CreateMemberPayload, RegisterMemberPayload } from "@/services/members/members.api";

/**
 * Excel import/export utilities for member data
 * Format matches the gym dashboard Excel sheet structure
 */

export interface ExcelMemberRow {
  "ID. NO": string;
  "Date": string;
  "Client Name": string;
  "Phone Number": string;
  "DOB": string;
  "INSTAGRAM @": string;
  "PACKAGE": string;
  "AMOUNT": number;
  "RECEIVED": number;
  "BAL AMOUNT": number;
  "MOP": string;
  "SALES": string;
  "TRAINING TYPE": string;
  "Trainer assigned": string;
  "MEMBER TYPE": string;
  "STARTING DATE": string;
  "EXPIRY DATE": string;
}

/**
 * Convert Excel row to Member payload
 */
export function excelRowToMember(row: Partial<ExcelMemberRow>): CreateMemberPayload | null {
  if (!row["Client Name"] || !row["Phone Number"]) {
    return null; // Skip invalid rows
  }

  return {
    idNo: row["ID. NO"] || "",
    date: row["Date"] ? formatDateForDb(row["Date"]) : new Date().toISOString().split("T")[0],
    name: String(row["Client Name"]).trim(),
    contactNumber: String(row["Phone Number"]).trim(),
    dob: row["DOB"] ? formatDateForDb(row["DOB"]) : undefined,
    instagramHandle: row["INSTAGRAM @"] ? String(row["INSTAGRAM @"]).trim() : undefined,
    membershipPlan: row["PACKAGE"] ? String(row["PACKAGE"]).trim() : undefined,
    amount: row["AMOUNT"] ? Number(row["AMOUNT"]) : undefined,
    received: row["RECEIVED"] ? Number(row["RECEIVED"]) : undefined,
    pending: row["BAL AMOUNT"] ? Number(row["BAL AMOUNT"]) : undefined,
    mop: row["MOP"] ? String(row["MOP"]).trim() : undefined,
    salesPerson: row["SALES"] ? String(row["SALES"]).trim() : undefined,
    trainingType: normalizeTrainingType(row["TRAINING TYPE"]),
    trainer: row["Trainer assigned"] ? String(row["Trainer assigned"]).trim() : undefined,
    memberType: normalizeMemberType(row["MEMBER TYPE"]),
    startingDate: row["STARTING DATE"] ? formatDateForDb(row["STARTING DATE"]) : undefined,
    expiryDate: row["EXPIRY DATE"] ? formatDateForDb(row["EXPIRY DATE"]) : undefined,
    memberStatus: determineMemberStatus(row["EXPIRY DATE"]),
  };
}

/**
 * Convert CreateMemberPayload to RegisterMemberPayload for API
 */
export function createPayloadToRegisterPayload(payload: CreateMemberPayload): RegisterMemberPayload {
  const contactNumber = payload.contactNumber || payload.phone || "";
  const amount = payload.amount ?? payload.membershipAmount ?? 0;
  const received = payload.received ?? 0;

  return {
    date: payload.date || new Date().toISOString().split('T')[0],
    name: payload.name,
    contactNumber,
    membershipMonths: payload.membershipMonths ?? 1,
    amount,
    received,
    mop: payload.mop ?? "cash",
    startingDate: payload.startingDate || new Date().toISOString().split('T')[0],
    expiryDate: payload.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dob: payload.dob,
    instagramHandle: payload.instagramHandle,
    salesPerson: payload.salesPerson,
    trainingType: payload.trainingType ?? "GT",
    trainer: payload.trainer,
    memberType: payload.memberType ?? "New",
    address: payload.address,
    emergencyContact: payload.emergencyContact,
    transactionId: payload.transactionId,
  };
}

/**
 * Convert Member to Excel row
 */
export function memberToExcelRow(member: Member): ExcelMemberRow {
  return {
    "ID. NO": member.idNo || "",
    "Date": member.date ? formatDateForDisplay(member.date) : "",
    "Client Name": member.name,
    "Phone Number": member.contactNumber || member.phone || "",
    "DOB": member.dob ? formatDateForDisplay(member.dob) : "",
    "INSTAGRAM @": member.instagramHandle || "",
    "PACKAGE": member.membershipPlan || "",
    "AMOUNT": member.amount || 0,
    "RECEIVED": member.received || 0,
    "BAL AMOUNT": member.pending || 0,
    "MOP": member.mop || "",
    "SALES": member.salesPerson || "",
    "TRAINING TYPE": member.trainingType || "",
    "Trainer assigned": member.trainer || "",
    "MEMBER TYPE": member.memberType || "",
    "STARTING DATE": member.startingDate ? formatDateForDisplay(member.startingDate) : "",
    "EXPIRY DATE": member.expiryDate ? formatDateForDisplay(member.expiryDate) : "",
  };
}

/**
 * Format date from various formats to YYYY-MM-DD
 */
function formatDateForDb(dateStr: string | number | Date): string {
  if (!dateStr) return "";
  
  try {
    let date: Date;
    
    if (typeof dateStr === "number") {
      // Excel serial date
      // Excel epoch is 1900-01-01, but with leap year bug
      const excelEpoch = new Date(1900, 0, 1);
      date = new Date(excelEpoch.getTime() + (dateStr - 1) * 24 * 60 * 60 * 1000);
    } else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
      return "";
    }
    
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Format date from DB format to display format (DD/MM/YY)
 */
function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Normalize training type to standard values
 */
function normalizeTrainingType(value: string | undefined): "GT" | "PT" | "OTHER" {
  if (!value) return "GT";
  const normalized = String(value).toUpperCase().trim();
  if (normalized === "PT" || normalized.includes("PERSONAL")) return "PT";
  if (normalized === "GT" || normalized.includes("GROUP")) return "GT";
  return "OTHER";
}

/**
 * Normalize member type to standard values
 */
function normalizeMemberType(value: string | undefined): "New" | "Old" | "Renewal" {
  if (!value) return "New";
  const normalized = String(value).trim();
  if (normalized.toLowerCase() === "old") return "Old";
  if (normalized.toLowerCase() === "renewal") return "Renewal";
  return "New";
}

/**
 * Determine member status based on expiry date
 */
function determineMemberStatus(expiryDate: string | undefined): "ACTIVE" | "INACTIVE" | "EXPIRED" {
  if (!expiryDate) return "ACTIVE";
  
  try {
    const expiry = new Date(formatDateForDb(expiryDate));
    const now = new Date();
    
    if (isNaN(expiry.getTime())) return "ACTIVE";
    
    return expiry < now ? "EXPIRED" : "ACTIVE";
  } catch {
    return "ACTIVE";
  }
}

/**
 * Validate member data before import
 */
export function validateMemberRow(
  row: Partial<ExcelMemberRow>,
  rowIndex: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row["Client Name"]) {
    errors.push(`Row ${rowIndex}: Client Name is required`);
  }

  if (!row["Phone Number"]) {
    errors.push(`Row ${rowIndex}: Phone Number is required`);
  } else if (!/^\d{10}$/.test(String(row["Phone Number"]).replace(/\D/g, ""))) {
    errors.push(`Row ${rowIndex}: Phone Number must be 10 digits`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
