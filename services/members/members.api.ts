import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export interface Member {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  emergencyContact?: string;
  memberStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  currentSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberPayload {
  name: string;
  email: string;
  phone: string;
  address?: string;
  emergencyContact?: string;
  memberStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface UpdateMemberPayload {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  memberStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

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