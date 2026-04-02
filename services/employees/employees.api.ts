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

export interface VerifyResponse {
  success: boolean;
  message: string;
}

const BASE_URL = "/employees";

// Helper to create headers with password
const createHeaders = (password: string) => ({
  "X-Employee-Password": password,
});

export const employeesApi = {
  // Auth endpoint
  verifyPassword: (password: string) =>
    apiClient.post<VerifyResponse>(`${BASE_URL}/auth/verify`, { password }),

  // Read endpoints - no password required (JWT auth only)
  getEmployees: () =>
    apiClient.get<Employee[]>(BASE_URL),

  getEmployeeById: (id: string) =>
    apiClient.get<Employee>(`${BASE_URL}/${id}`),

  // Write endpoints - password required
  createEmployee: (payload: CreateEmployeePayload, password: string) =>
    apiClient.post<Employee>(BASE_URL, payload, { headers: createHeaders(password) }),

  updateEmployee: (id: string, payload: UpdateEmployeePayload, password: string) =>
    apiClient.put<Employee>(`${BASE_URL}/${id}`, payload, { headers: createHeaders(password) }),

  deleteEmployee: (id: string, password: string) =>
    apiClient.delete<{ message: string }>(`${BASE_URL}/${id}`, { headers: createHeaders(password) }),
};
