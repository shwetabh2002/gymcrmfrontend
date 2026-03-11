import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  memberId: string | { _id: string; name: string; email: string; phone: string };
  subscriptionId: string | { _id: string; planPrice: number; paymentStatus: string };
  items: InvoiceItem[];
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  invoiceDate: string;
  dueDate?: string;
  paymentId?: string | { _id: string; amount: number; paymentMode: string };
  generatedBy?: string | { _id: string; name: string; email: string };
  notes?: string;
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
  invoiceDate?: string;
  dueDate?: string;
  notes?: string;
}

export const invoicesApi = {
  getInvoices: () =>
    requestService.get<Invoice[]>(API_CONFIG.INVOICES.BASE),

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