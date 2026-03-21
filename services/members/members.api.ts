import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export interface Member {
  _id: string;
  idNo?: string;
  date?: string;
  name: string;
  contactNumber?: string;
  phone?: string;
  email?: string;
  dob?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMemberPayload {
  idNo?: string;
  date?: string;
  name: string;
  contactNumber?: string;
  phone?: string;
  email?: string;
  dob?: string;
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
  userType?: "MEMBER" | "TRAINER" | "ADMIN";
  role?: "USER" | "ADMIN";
}

export interface UpdateMemberPayload extends Partial<CreateMemberPayload> {}

export interface RegisterMemberPayload {
  date: string;
  name: string;
  contactNumber: string;
  membershipMonths: number;
  amount: number;
  received: number;
  mop: string;
  startingDate: string;
  expiryDate: string;
  idNo?: string;
  dob?: string;
  instagramHandle?: string;
  pending?: number;
  transactionId?: string;
  salesPerson?: string;
  trainingType?: "GT" | "PT" | "OTHER";
  trainer?: string;
  memberType?: "New" | "Old" | "Renewal";
  memberStatus?: "ACTIVE" | "INACTIVE" | "EXPIRED";
  address?: string;
  emergencyContact?: string;
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
};