import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";
import apiClient from "@/services/apiClient";

export type PaymentMode = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "ONLINE";

export interface Member {
  _id: string;
  idNo?: string | null;
  name: string;
  email?: string;
  phone?: string | null;
  contactNumber?: string;
  dob?: string | null;
  instagramHandle?: string | null;
  photoUrl?: string | null;
  registrationDate?: string | null;
  date?: string | null;
  trainingType?: "GT" | "PT" | "OTHER" | null;
  trainerId?: string | null;
  salesPersonId?: string | null;
  trainer?: string | null;
  salesPerson?: string | null;
  membershipPlan?: string | null;
  planId?: string | null;
  amount?: number | null;
  received?: number | null;
  pending?: number | null;
  mop?: string | null;
  startingDate?: string | null;
  expiryDate?: string | null;
  memberStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "EXPIRED";
  locationId?: string | null;
  currentSubscriptionId?: string | null;
  /** Present on create response when initial payment was recorded */
  initialPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberPayload {
  name: string;
  phone: string;
  email?: string;
  registrationDate?: string;
  dob?: string;
  instagramHandle?: string;
  trainingType?: "GT" | "PT" | "OTHER";
  trainerId?: string;
  salesPersonId?: string;
  memberStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  planId?: string;
  startingDate?: string;
  expiryDate?: string;
  amount?: number;
  received?: number;
  paymentMode?: PaymentMode;
  locationId?: string;
  photoUrl?: string;
}

export type UpdateMemberPayload = Partial<
  Omit<CreateMemberPayload, "planId" | "startingDate" | "expiryDate" | "amount" | "received" | "paymentMode">
>;

async function postMultipartMemberPhoto(id: string, file: File): Promise<Member> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<Member>(API_CONFIG.MEMBERS.PHOTO(id), form, {
    transformRequest: [
      (body, headers) => {
        if (headers && typeof headers === "object") {
          delete (headers as Record<string, unknown>)["Content-Type"];
        }
        return body;
      },
    ],
  });
  return data;
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

  uploadPhoto: (id: string, file: File) => postMultipartMemberPhoto(id, file),

  deleteMember: (id: string) =>
    requestService.delete<{ message: string }>(API_CONFIG.MEMBERS.BY_ID(id)),
};
