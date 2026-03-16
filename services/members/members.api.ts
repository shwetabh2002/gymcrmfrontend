import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export interface Member {
  _id: string;
  idNo: string;
  date: string;
  name: string;
  contactNumber: string;
  dob?: string;
  instagramHandle?: string;
  membershipPlan: string;
  amount: number;
  received: number;
  pending: number;
  mop: string;
  salesPerson: string;
  trainingType: "GT" | "PT" | "OTHER";
  trainer: string;
  memberType: "New" | "Old" | "Renewal";
  startingDate: string;
  expiryDate: string;
  memberStatus: "ACTIVE" | "INACTIVE" | "EXPIRED";
  currentSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberPayload {
  idNo?: string;
  date?: string;
  name: string;
  contactNumber: string;
  dob?: string;
  instagramHandle?: string;
  membershipPlan?: string;
  amount?: number;
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
}

export interface UpdateMemberPayload extends Partial<CreateMemberPayload> {}

export const membersApi = {
  getMembers: () =>
    requestService.get<Member[]>(API_CONFIG.MEMBERS.BASE),

  getMemberById: (id: string) =>
    requestService.get<Member>(API_CONFIG.MEMBERS.BY_ID(id)),

  createMember: (payload: CreateMemberPayload) =>
    requestService.post<Member, CreateMemberPayload>(API_CONFIG.MEMBERS.BASE, payload),

  updateMember: (id: string, payload: UpdateMemberPayload) =>
    requestService.put<Member, UpdateMemberPayload>(API_CONFIG.MEMBERS.BY_ID(id), payload),

  deleteMember: (id: string) =>
    requestService.delete<{ message: string }>(API_CONFIG.MEMBERS.BY_ID(id)),
};