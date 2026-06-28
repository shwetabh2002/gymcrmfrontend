import { Member } from "@/services/members/members.api";
import { PaymentRecord } from "@/services/invoices/invoices.api";
import { Payment } from "@/services/payments/payments.api";
import { Employee } from "@/services/employees/employees.api";
import { AttendanceRecord } from "@/services/attendance/attendance.api";
import { MemberSubscription } from "@/services/subscriptions/subscriptions.api";
import { Plan } from "@/services/plans/plans.api";
import { memberToExcelRow } from "@/services/members/members.import-export";
import { formatDateForExport } from "./date-period";

function activeMembership(member: Member) {
  return member.memberships?.find((m) => m.status === "ACTIVE") ?? null;
}

export function membersToExportRows(members: Member[]): Record<string, unknown>[] {
  return members.map((m) => {
    const base = memberToExcelRow(m);
    const active = activeMembership(m);
    return {
      ...base,
      Status: m.memberStatus ?? "",
      Email: m.email ?? "",
      Address: m.address ?? "",
      "Emergency Contact": m.emergencyContact ?? "",
      "Pending Due Date": formatDateForExport(
        active?.pendingDueDate ?? m.pendingDueDate ?? undefined,
      ),
      "Membership Status": active?.status ?? m.memberStatus ?? "",
      "Payment Count": m.paymentSummary?.paymentCount ?? "",
      "Last Payment Date": formatDateForExport(
        m.paymentSummary?.lastPaymentDate ?? undefined,
      ),
    };
  });
}

export const MEMBER_EXPORT_COLUMNS = [
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
  "Status",
  "Email",
  "Address",
  "Emergency Contact",
  "Pending Due Date",
  "Membership Status",
  "Payment Count",
  "Last Payment Date",
];

export function paymentRecordsToExportRows(
  payments: PaymentRecord[],
): Record<string, unknown>[] {
  return payments.map((p) => {
    const member =
      p.memberId && typeof p.memberId === "object" ? p.memberId : null;
    return {
      "Transaction ID": p.transactionId || `INV-${p._id.slice(-6).toUpperCase()}`,
      "Member Name": member?.name ?? "",
      Phone: member?.phone ?? "",
      Email: member?.email ?? "",
      "Membership Plan": member?.membershipPlan ?? "",
      Amount: p.amount,
      Received: p.received,
      Pending: p.pending,
      MOP: p.mop?.toUpperCase() ?? "",
      "Payment Date": formatDateForExport(p.paymentDate),
      Notes: p.notes ?? "",
      "Created At": formatDateForExport(p.createdAt),
    };
  });
}

export const INVOICE_EXPORT_COLUMNS = [
  "Transaction ID",
  "Member Name",
  "Phone",
  "Email",
  "Membership Plan",
  "Amount",
  "Received",
  "Pending",
  "MOP",
  "Payment Date",
  "Notes",
  "Created At",
];

export function legacyPaymentsToExportRows(
  payments: Payment[],
): Record<string, unknown>[] {
  return payments.map((p) => {
    const member =
      typeof p.memberId === "object" && p.memberId !== null ? p.memberId : null;
    return {
      "Payment ID": p._id,
      "Member Name": member?.name ?? "",
      Phone: member?.phone ?? "",
      Email: member?.email ?? "",
      Amount: p.amount,
      "Payment Mode": p.paymentMode,
      "Payment Date": formatDateForExport(p.paymentDate),
      "Transaction ID": p.transactionId ?? "",
      Notes: p.notes ?? "",
      "Created At": formatDateForExport(p.createdAt),
    };
  });
}

export function employeesToExportRows(
  employees: Employee[],
): Record<string, unknown>[] {
  return employees.map((e) => ({
    "Employee ID": e.employeeId,
    Name: e.name,
    Email: e.email,
    Phone: e.phone,
    Type: e.employeeType,
    Status: e.status,
    Salary: e.salary,
    "Joining Date": formatDateForExport(e.joiningDate),
    DOB: formatDateForExport(e.dob),
    Gender: e.gender ?? "",
    "Device User ID": e.deviceUserId ?? "",
    Address: e.address ?? "",
    "Document Type": e.documentType ?? "",
    "Document Number": e.documentNumber ?? "",
    Qualification: e.academicQualification ?? "",
    "Trainer Certificate": e.trainerCertificateNumber ?? "",
    "Created At": formatDateForExport(e.createdAt),
  }));
}

export function attendanceToExportRows(
  rows: AttendanceRecord[],
): Record<string, unknown>[] {
  return rows.map((r) => {
    const emp =
      r.employeeId && typeof r.employeeId === "object"
        ? (r.employeeId as { name?: string; employeeId?: string })
        : null;
    return {
      Date: formatDateForExport(r.date),
      Employee: emp?.name ?? r.employeeName ?? "",
      "Device User ID": r.deviceUserId ?? "",
      "Check-in": r.checkInTime
        ? new Date(r.checkInTime).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      "Check-out": r.checkOutTime
        ? new Date(r.checkOutTime).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      Status: r.status,
      "Working Hours": r.workingHours ?? "",
      Late: r.isLate ? "Yes" : "No",
      Remarks: r.remarks ?? "",
      "Device Serial": r.deviceSerialNumber ?? "",
    };
  });
}

export function subscriptionsToExportRows(
  subs: MemberSubscription[],
): Record<string, unknown>[] {
  return subs.map((s) => {
    const member =
      typeof s.memberId === "object" && s.memberId !== null ? s.memberId : null;
    const plan =
      typeof s.planId === "object" && s.planId !== null ? s.planId : null;
    return {
      "Member Name": member?.name ?? "",
      Phone: (member as { phone?: string })?.phone ?? "",
      Plan: plan?.name ?? "",
      "Plan Price": s.planPrice,
      "Total Paid": s.totalPaid,
      Pending: s.pendingAmount,
      "Start Date": formatDateForExport(s.startDate),
      "Expiry Date": formatDateForExport(s.expiryDate),
      "Subscription Status": s.subscriptionStatus,
      "Payment Status": s.paymentStatus,
      "Created At": formatDateForExport(s.createdAt),
    };
  });
}

export function plansToExportRows(plans: Plan[]): Record<string, unknown>[] {
  return plans.map((p) => ({
    Name: p.name,
    Duration: p.duration,
    "Duration Type": p.durationType,
    Price: p.price,
    Description: p.description ?? "",
    Status: p.status,
    "Created At": formatDateForExport(p.createdAt),
  }));
}

export function trainersToExportRows(
  trainers: import("@/services/trainers/trainers.api").Trainer[],
): Record<string, unknown>[] {
  return trainers.map((t) => ({
    Name: t.name,
    Email: t.email ?? "",
    Phone: t.contactNumber ?? "",
    Specialization: t.specialization ?? "",
    Experience: t.experience ?? "",
    Certification: t.certification ?? "",
    Status: t.status,
    Bio: t.bio ?? "",
    "Created At": formatDateForExport(t.createdAt),
  }));
}
