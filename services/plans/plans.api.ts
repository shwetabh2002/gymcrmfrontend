import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export interface Plan {
  _id: string;
  name: string;
  duration: number;
  durationType: "DAYS" | "MONTHS" | "YEARS";
  price: number;
  description?: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanPayload {
  name: string;
  duration: number;
  durationType: "DAYS" | "MONTHS" | "YEARS";
  price: number;
  description?: string;
}

export interface UpdatePlanPayload {
  name?: string;
  duration?: number;
  durationType?: "DAYS" | "MONTHS" | "YEARS";
  price?: number;
  description?: string;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

export const plansApi = {
  getPlans: () =>
    requestService.get<Plan[]>(API_CONFIG.PLANS.BASE),

  getPlanById: (id: string) =>
    requestService.get<Plan>(API_CONFIG.PLANS.BY_ID(id)),

  createPlan: (payload: CreatePlanPayload) =>
    requestService.post<Plan, CreatePlanPayload>(API_CONFIG.PLANS.BASE, payload),

  updatePlan: (id: string, payload: UpdatePlanPayload) =>
    requestService.put<Plan, UpdatePlanPayload>(API_CONFIG.PLANS.BY_ID(id), payload),

  deletePlan: (id: string) =>
    requestService.delete<{ message: string }>(API_CONFIG.PLANS.BY_ID(id)),
};