import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export type DuesSort =
  | "reminder_asc"
  | "reminder_desc"
  | "pending_desc"
  | "pending_asc"
  | "name_asc"
  | "expiry_asc";

export type DuesReminderFilter = "ALL" | "SET" | "OVERDUE" | "NONE";

export type DuesItem = {
  subscriptionId: string;
  memberId: string;
  memberName: string;
  memberPhone: string | null;
  memberEmail: string | null;
  idNo: string | null;
  planName: string | null;
  planPrice: number;
  totalPaid: number;
  pendingAmount: number;
  paymentStatus: string;
  dueReminderDate: string | null;
  daysUntilReminder: number | null;
  expiryDate: string | null;
  startDate: string | null;
};

export type DuesQueueResponse = {
  items: DuesItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  counts: {
    total: number;
    totalPending: number;
    withReminder: number;
    overdueReminder: number;
  };
};

export type DuesQueueParams = {
  sort?: DuesSort;
  search?: string;
  page?: number;
  limit?: number;
  reminder?: DuesReminderFilter;
};

export const duesApi = {
  queue: (params?: DuesQueueParams) => {
    const q = new URLSearchParams();
    if (params?.sort) q.set("sort", params.sort);
    if (params?.search) q.set("search", params.search);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.reminder && params.reminder !== "ALL")
      q.set("reminder", params.reminder);
    const qs = q.toString();
    return requestService.get<DuesQueueResponse>(
      `${API_CONFIG.DUES.QUEUE}${qs ? `?${qs}` : ""}`,
    );
  },

  setReminder: (subscriptionId: string, dueReminderDate: string | null) =>
    requestService.patch(API_CONFIG.DUES.REMINDER(subscriptionId), {
      dueReminderDate,
    }),
};
