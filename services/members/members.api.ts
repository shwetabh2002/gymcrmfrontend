import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";
import apiClient from "../apiClient";

export interface PaymentSummary {
  totalReceived: number;
  totalPending: number;
  hasPendingBalance: boolean;
  lastPaymentDate: string | null;
  lastPaymentAmount: number;
  paymentCount: number;
}

export interface Membership {
  _id: string;
  startDate: string;
  expiryDate: string;
  months: number;
  totalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  package?: string;
  trainingType?: string;
  trainer?: string;
  salesPerson?: string;
  memberType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Member {
  _id: string;
  idNo?: string;
  date?: string;
  name: string;
  contactNumber?: string;
  phone?: string;
  email?: string;
  dob?: string;
  anniversaryDate?: string;
  instagramHandle?: string;
  membershipPlan?: string;
  membershipMonths?: number;
  amount?: number;
  membershipAmount?: number;
  received?: number;
  pending?: number;
  mop?: string;
  salesPerson?: string;
  trainingType?: "GT" | "PT" | "OTHER";
  trainer?: string;
  memberType?: "New" | "Old" | "Renewal";
  startingDate?: string;
  expiryDate?: string;
  memberStatus?: "ACTIVE" | "INACTIVE" | "EXPIRED";
  currentSubscriptionId?: string;
  address?: string;
  emergencyContact?: string;
  /** Legacy % off list price; ignored when discountAmount is set */
  discount?: number;
  /** ₹ off list price (preferred) */
  discountAmount?: number | null;
  discountApprovedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentSummary?: PaymentSummary;
  memberships?: Membership[]; // NEW: Array of memberships
}

export interface CreateMemberPayload {
  idNo?: string;
  date?: string;
  name: string;
  contactNumber?: string;
  phone?: string;
  email?: string;
  dob?: string;
  anniversaryDate?: string;
  instagramHandle?: string;
  membershipPlan?: string;
  membershipMonths?: number;
  amount?: number;
  membershipAmount?: number;
  received?: number;
  pending?: number;
  mop?: string;
  transactionId?: string;
  salesPerson?: string;
  trainingType?: "GT" | "PT" | "OTHER";
  trainer?: string;
  memberType?: "New" | "Old" | "Renewal";
  startingDate?: string;
  expiryDate?: string;
  memberStatus?: "ACTIVE" | "INACTIVE" | "EXPIRED";
  address?: string;
  emergencyContact?: string;
  discount?: number;
  discountAmount?: number;
  discountApprovedBy?: string;
  userType?: "MEMBER" | "TRAINER" | "ADMIN";
  role?: "USER" | "ADMIN";
}

export interface UpdateMemberPayload extends Partial<CreateMemberPayload> {}

export interface AddPaymentPayload {
  memberId: string;
  amount: number;
  received: number;
  pending?: number;
  mop: string;
  paymentDate: string;
  transactionId?: string;
  notes?: string;
  renewalMonths?: number;
  newExpiryDate?: string;
}

export interface RegisterMemberPayload {
  date: string;
  name: string;
  contactNumber: string;
  email?: string;
  membershipMonths: number;
  amount: number;
  received: number;
  mop: string;
  startingDate: string;
  expiryDate: string;
  idNo?: string;
  dob?: string;
  anniversaryDate?: string;
  instagramHandle?: string;
  membershipPlan?: string;
  pending?: number;
  transactionId?: string;
  salesPerson?: string;
  trainingType?: "GT" | "PT" | "OTHER";
  trainer?: string;
  memberType?: "New" | "Old" | "Renewal";
  memberStatus?: "ACTIVE" | "INACTIVE" | "EXPIRED";
  address?: string;
  emergencyContact?: string;
  discount?: number;
  discountAmount?: number;
  discountApprovedBy?: string;
}

export const normalizeMember = (m: Partial<Member>): Member => {
  const contactNumber = m.contactNumber || m.phone || "";
  const amount = m.amount ?? m.membershipAmount ?? 0;
  const received = m.received ?? 0;
  const pending = m.pending ?? Math.max(0, amount - received);

  return {
    ...m,
    contactNumber,
    phone: contactNumber,
    membershipAmount: m.membershipAmount ?? m.amount ?? 0,
    amount,
    received,
    pending,
    membershipMonths: m.membershipMonths ?? 0,
    memberStatus: m.memberStatus ?? "ACTIVE",
    trainingType: m.trainingType ?? "OTHER",
    memberType: m.memberType ?? "New",
    membershipPlan: m.membershipPlan ?? "",
  } as Member;
};
export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  imported: Array<{
    member: Member;
    payment: any;
  }>;
  errors: Array<{
    row: number;
    error: string;
  }>;
  skippedMembers: Array<{
    row: number;
    name: string;
    reason: string;
  }>;
}

export const membersApi = {
  getMembers: () =>
    requestService.get<Member[]>(API_CONFIG.MEMBERS.BASE),

  getMemberById: (id: string) =>
    requestService.get<Member>(API_CONFIG.MEMBERS.BY_ID(id)),

  createMember: (payload: CreateMemberPayload) =>
    requestService.post<Member, CreateMemberPayload>(API_CONFIG.MEMBERS.BASE, payload),

  registerMember: (payload: RegisterMemberPayload) =>
    requestService.post<Member, RegisterMemberPayload>(API_CONFIG.MEMBERS.REGISTER, payload),

  updateMember: (id: string, payload: UpdateMemberPayload) =>
    requestService.put<Member, UpdateMemberPayload>(API_CONFIG.MEMBERS.BY_ID(id), payload),

  deleteMember: (id: string) =>
    requestService.delete<{ message: string }>(API_CONFIG.MEMBERS.BY_ID(id)),

  addPayment: (payload: AddPaymentPayload) =>
    requestService.post<{ payment: any; member: Member }, AddPaymentPayload>(
      API_CONFIG.MEMBERS.PAYMENTS,
      payload
    ),

  importMembers: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ImportResult>(
      API_CONFIG.MEMBERS.IMPORT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },
};