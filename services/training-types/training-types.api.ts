import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export interface TrainingType {
  _id: string;
  name: string; // e.g., "PT" (Personal Training), "GT" (Group Training), "CLASS", etc.
  description?: string;
  maxMembersPerBatch?: number; // for group trainings
  duration?: number; // in minutes
  price?: number; // additional price if applicable
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingTypePayload {
  name: string;
  description?: string;
  maxMembersPerBatch?: number;
  duration?: number;
  price?: number;
}

export interface UpdateTrainingTypePayload extends Partial<CreateTrainingTypePayload> {
  status?: "ACTIVE" | "INACTIVE";
}

export const trainingTypesApi = {
  getTrainingTypes: () =>
    requestService.get<TrainingType[]>("/training-types"),

  getTrainingTypeById: (id: string) =>
    requestService.get<TrainingType>(`/training-types/${id}`),

  createTrainingType: (payload: CreateTrainingTypePayload) =>
    requestService.post<TrainingType, CreateTrainingTypePayload>("/training-types", payload),

  updateTrainingType: (id: string, payload: UpdateTrainingTypePayload) =>
    requestService.put<TrainingType, UpdateTrainingTypePayload>(`/training-types/${id}`, payload),

  deleteTrainingType: (id: string) =>
    requestService.delete<{ message: string }>(`/training-types/${id}`),

  getActiveTrainingTypes: () =>
    requestService.get<TrainingType[]>("/training-types?status=ACTIVE"),
};
