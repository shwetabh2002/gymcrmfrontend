import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export interface PaymentRecord {
  _id: string;
  memberId: {
    _id: string;
    email: string;
    name: string;
    phone: string;
    discount?: number;
    discountApprovedBy?: string;
    membershipPlan?: string;
    membershipMonths?: number;
    instagramHandle?: string;
    amount?: number; // Original amount before discount
  };
  amount: number; // Final amount (after discount)
  received: number;
  pending: number;
  mop: string;
  paymentDate: string;
  transactionId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PaymentsResponse {
  data: PaymentRecord[];
  summary?: {
    totalPayments: number;
    totalAmount: number;
    totalReceived: number;
    totalPending: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface MemberRecord {
  _id: string;
  name: string;
  contactNumber?: string;
  phone?: string;
  email?: string;
  membershipMonths?: number;
  membershipAmount?: number;
  startingDate?: string;
  expiryDate?: string;
  memberStatus?: "ACTIVE" | "INACTIVE" | "EXPIRED";
  trainer?: string;
  trainingType?: string;
}

export interface GetPaymentsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const invoicesApi = {
  getAllPayments: (params?: GetPaymentsParams) => {
    const query = new URLSearchParams();
    if (params?.page)   query.set("page",   String(params.page));
    if (params?.limit)  query.set("limit",  String(params.limit));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return requestService.get<PaymentsResponse>(
      `${API_CONFIG.MEMBERS.BASE}/payments${qs ? `?${qs}` : ""}`
    );
  },

  getPaymentsByMember: (memberId: string) =>
    requestService.get<PaymentsResponse>(
      `${API_CONFIG.MEMBERS.BY_ID(memberId)}/payments`
    ),

  getAllMembers: () =>
    requestService.get<MemberRecord[]>(API_CONFIG.MEMBERS.BASE),

  getMemberById: (id: string) =>
    requestService.get<MemberRecord>(API_CONFIG.MEMBERS.BY_ID(id)),
};