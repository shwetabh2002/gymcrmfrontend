import { requestService } from "../request/requestServcie";
import apiClient from "../apiClient";

export interface Employee {
  _id: string;
  name: string;
  age: number;
  salary: number;
  employeeType: "SALES" | "TRAINER";
  status: "ACTIVE" | "INACTIVE";
  joiningDate: string;
  phone: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeePayload {
  name: string;
  age: number;
  salary: number;
  employeeType: "SALES" | "TRAINER";
  status: "ACTIVE" | "INACTIVE";
  joiningDate: string;
  phone: string;
  email: string;
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {}

export interface UnlockResponse {
  success: boolean;
  message: string;
}

export interface StatusResponse {
  unlocked: boolean;
}

const BASE_URL = "/employees";

export const employeesApi = {
  // Auth endpoints
  unlock: (password: string) =>
    apiClient.post<UnlockResponse>(`${BASE_URL}/auth/unlock`, { password }),

  lock: () =>
    apiClient.post<UnlockResponse>(`${BASE_URL}/auth/lock`),

  checkStatus: () =>
    apiClient.get<StatusResponse>(`${BASE_URL}/auth/status`),

  // CRUD endpoints
  getEmployees: () =>
    requestService.get<Employee[]>(BASE_URL),

  getEmployeeById: (id: string) =>
    requestService.get<Employee>(`${BASE_URL}/${id}`),

  createEmployee: (payload: CreateEmployeePayload) =>
    requestService.post<Employee, CreateEmployeePayload>(BASE_URL, payload),

  updateEmployee: (id: string, payload: UpdateEmployeePayload) =>
    requestService.put<Employee, UpdateEmployeePayload>(`${BASE_URL}/${id}`, payload),

  deleteEmployee: (id: string) =>
    requestService.delete<{ message: string }>(`${BASE_URL}/${id}`),
};
