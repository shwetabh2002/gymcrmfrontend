import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  /** Branch this invoice belongs to — populated when available */
  locationId?:
    | string
    | {
        _id: string;
        name: string;
        code?: string;
        address?: string | null;
        city?: string | null;
        phone?: string | null;
        invoiceLayout?: string | null;
        invoiceShowLogo?: boolean | null;
        invoiceShowStamp?: boolean | null;
        invoiceShowGstin?: boolean | null;
        invoiceShowAddress?: boolean | null;
        invoiceShowContact?: boolean | null;
      };
  memberId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        phone: string;
        /** Gym's own member number, e.g. GYM-0042 */
        idNo?: string | null;
      };
  subscriptionId:
    | string
    | {
        _id: string;
        planPrice: number;
        paymentStatus: string;
        startDate?: string;
        expiryDate?: string;
        planId?: string | { _id: string; name: string };
      };
  items: InvoiceItem[];
  subtotal: number;
  taxPercentage: number;
  taxAmount?: number;
  totalAmount: number;
  invoiceDate: string;
  dueDate?: string;
  paymentId?:
    | string
    | {
        _id: string;
        amount: number;
        paymentMode: string;
        paymentDate?: string;
        transactionId?: string | null;
      };
  generatedBy?: string | { _id: string; name: string; email: string };
  notes?: string;
  taxMode?: "included" | "excluded" | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoicePayload {
  memberId: string;
  subscriptionId: string;
  items: InvoiceItem[];
  taxPercentage?: number;
  invoiceDate: string;
  dueDate?: string;
  paymentId?: string;
  notes?: string;
}

export interface UpdateInvoicePayload {
  items?: InvoiceItem[];
  taxPercentage?: number;
  taxMode?: "included" | "excluded";
  invoiceDate?: string;
  dueDate?: string;
  notes?: string;
}

export type InvoiceListParams = {
  page?: number;
  limit?: number;
  search?: string;
  taxMode?: string;
};

export type PaginatedInvoices = {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export const invoicesApi = {
  getInvoices: () =>
    requestService.get<Invoice[]>(API_CONFIG.INVOICES.BASE),

  getInvoicesPaged: (params: InvoiceListParams) =>
    requestService.get<PaginatedInvoices>(API_CONFIG.INVOICES.BASE, {
      page: 1,
      limit: 50,
      ...params,
    }),

  getInvoiceById: (id: string) =>
    requestService.get<Invoice>(API_CONFIG.INVOICES.BY_ID(id)),

  getInvoicesByMember: (memberId: string) =>
    requestService.get<Invoice[]>(API_CONFIG.INVOICES.BY_MEMBER(memberId)),

  getInvoicesBySubscription: (subscriptionId: string) =>
    requestService.get<Invoice[]>(API_CONFIG.INVOICES.BY_SUBSCRIPTION(subscriptionId)),

  createInvoice: (payload: CreateInvoicePayload) =>
    requestService.post<Invoice, CreateInvoicePayload>(API_CONFIG.INVOICES.BASE, payload),

  updateInvoice: (id: string, payload: UpdateInvoicePayload) =>
    requestService.put<Invoice, UpdateInvoicePayload>(API_CONFIG.INVOICES.BY_ID(id), payload),

  deleteInvoice: (id: string) =>
    requestService.delete<{ message: string }>(API_CONFIG.INVOICES.BY_ID(id)),
};