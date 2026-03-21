import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

// Payment-focused interfaces (replacing old invoice system)
export interface PaymentRecord {
  _id: string;
  memberId: {
    _id: string;
    email: string;
    name: string;
    phone: string;
  };
  amount: number;
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

export const invoicesApi = {
  // Get all payments for all members (replaces old invoice system)
  getAllPayments: () =>
    requestService.get<PaymentsResponse>(`${API_CONFIG.MEMBERS.BASE}/payments`),

  // Get payment history for a specific member
  getPaymentsByMember: (memberId: string) =>
    requestService.get<PaymentsResponse>(`${API_CONFIG.MEMBERS.BY_ID(memberId)}/payments`),

  // Get all registered members (for invoice/member selection)
  getAllMembers: () =>
    requestService.get<MemberRecord[]>(API_CONFIG.MEMBERS.BASE),

  // Get member by ID
  getMemberById: (id: string) =>
    requestService.get<MemberRecord>(API_CONFIG.MEMBERS.BY_ID(id)),
};