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
  /** Dial prefix, e.g. +91 */
  countryCode?: string | null;
  dob?: string | null;
  instagramHandle?: string | null;
  photoUrl?: string | null;
  registrationDate?: string | null;
  date?: string | null;
  trainingType?: "GT" | "PT" | "NONE" | "OTHER" | null;
  trainerId?: string | null;
  salesPersonId?: string | null;
  trainer?: string | null;
  salesPerson?: string | null;
  membershipPlan?: string | null;
  planId?: string | null;
  amount?: number | null;
  received?: number | null;
  pending?: number | null;
  dueReminderDate?: string | null;
  /** GST snapshot from current subscription (null = fall back to live settings) */
  taxPercentage?: number | null;
  taxMode?: "included" | "excluded" | string | null;
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
  /** Notify the member — both default true on the server. */
  sendWhatsApp?: boolean;
  sendEmail?: boolean;
  name: string;
  phone: string;
  /** Default +91 on the server if omitted */
  countryCode?: string;
  email?: string;
  registrationDate?: string;
  dob?: string;
  instagramHandle?: string;
  trainingType?: "GT" | "PT" | "NONE" | "OTHER";
  trainerId?: string;
  salesPersonId?: string;
  memberStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  planId?: string;
  startingDate?: string;
  expiryDate?: string;
  amount?: number;
  received?: number;
  dueReminderDate?: string;
  paymentMode?: PaymentMode;
  locationId?: string;
  photoUrl?: string;
}

export type UpdateMemberPayload = Partial<
  Omit<
    CreateMemberPayload,
    | "planId"
    | "startingDate"
    | "expiryDate"
    | "amount"
    | "received"
    | "paymentMode"
  >
>;

async function postMultipartMemberPhoto(
  id: string,
  file: File,
): Promise<Member> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<Member>(
    API_CONFIG.MEMBERS.PHOTO(id),
    form,
    {
      transformRequest: [
        (body, headers) => {
          if (headers && typeof headers === "object") {
            delete (headers as Record<string, unknown>)["Content-Type"];
          }
          return body;
        },
      ],
    },
  );
  return data;
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type MemberListParams = {
  page?: number;
  limit?: number;
  search?: string;
  /** ALL | ACTIVE | INACTIVE | SUSPENDED */
  status?: string;
  /** ALL | GT | PT | OTHER */
  trainingType?: string;
  /** "true" — only members with pending dues (sorted nearest reminder first) */
  hasPending?: string;
};

export const membersApi = {
  /** Unpaged. The server caps this, so use getMembersPaged for real lists. */
  getMembers: () => requestService.get<Member[]>(API_CONFIG.MEMBERS.BASE),

  /**
   * Server-side paging, search and filters — the list, the search and the
   * filters all stay in the database instead of being shipped to the browser.
   */
  getMembersPaged: (params: MemberListParams) =>
    requestService.get<Paginated<Member>>(API_CONFIG.MEMBERS.BASE, params),

  getMemberById: (id: string) =>
    requestService.get<Member>(API_CONFIG.MEMBERS.BY_ID(id)),

  createMember: (payload: CreateMemberPayload) =>
    requestService.post<Member, CreateMemberPayload>(
      API_CONFIG.MEMBERS.BASE,
      payload,
    ),

  updateMember: (id: string, payload: UpdateMemberPayload) =>
    requestService.put<Member, UpdateMemberPayload>(
      API_CONFIG.MEMBERS.BY_ID(id),
      payload,
    ),

  uploadPhoto: (id: string, file: File) => postMultipartMemberPhoto(id, file),

  deleteMember: (id: string) =>
    requestService.delete<{ message: string }>(API_CONFIG.MEMBERS.BY_ID(id)),
};
