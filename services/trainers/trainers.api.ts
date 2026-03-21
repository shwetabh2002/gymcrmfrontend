import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export interface Trainer {
  _id: string;
  name: string;
  email?: string;
  contactNumber?: string;
  specialization?: string;
  bio?: string;
  experience?: number; // in years
  certification?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainerPayload {
  name: string;
  email?: string;
  contactNumber?: string;
  specialization?: string;
  bio?: string;
  experience?: number;
  certification?: string;
}

export interface UpdateTrainerPayload extends Partial<CreateTrainerPayload> {
  status?: "ACTIVE" | "INACTIVE";
}

export const trainersApi = {
  getTrainers: () =>
    requestService.get<Trainer[]>("/trainers"),

  getTrainerById: (id: string) =>
    requestService.get<Trainer>(`/trainers/${id}`),

  createTrainer: (payload: CreateTrainerPayload) =>
    requestService.post<Trainer, CreateTrainerPayload>("/trainers", payload),

  updateTrainer: (id: string, payload: UpdateTrainerPayload) =>
    requestService.put<Trainer, UpdateTrainerPayload>(`/trainers/${id}`, payload),

  deleteTrainer: (id: string) =>
    requestService.delete<{ message: string }>(`/trainers/${id}`),

  getActiveTrainers: () =>
    requestService.get<Trainer[]>("/trainers?status=ACTIVE"),
};
