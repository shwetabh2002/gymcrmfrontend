import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";
import apiClient from "@/services/apiClient";
import type { PermissionKey } from "@/lib/rbac";

export type EmployeeType = "STAFF" | "TRAINER" | "SALES";
export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
  STAFF: "Staff",
  TRAINER: "Trainer",
  SALES: "Sales",
};

export interface Employee {
  _id: string;
  name: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  type: EmployeeType;
  role?: string;
  status: EmployeeStatus;
  notes?: string | null;
  userType?: string;
  customPermissions?: string[] | null;
  roleDefaults?: string[];
  permissions?: string[];
  isCustomAccess?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  type: EmployeeType;
  phone?: string;
  status?: EmployeeStatus;
  notes?: string;
  customPermissions?: PermissionKey[];
}

export interface UpdateEmployeePayload {
  name?: string;
  email?: string;
  password?: string;
  type?: EmployeeType;
  phone?: string;
  status?: EmployeeStatus;
  notes?: string;
  customPermissions?: PermissionKey[];
  useRoleDefaults?: boolean;
}

async function postMultipartEmployeePhoto(
  id: string,
  file: File,
): Promise<Employee> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<Employee>(
    API_CONFIG.EMPLOYEES.PHOTO(id),
    form,
    {
      transformRequest: [
        (body, headers) => {
          if (headers && typeof headers === "object") {
            delete (headers as Record<string, unknown>)["Content-Type"];
          }
          return body;
        },
      ],
    },
  );
  return data;
}

export const employeesApi = {
  getEmployees: (params?: { type?: EmployeeType; status?: EmployeeStatus }) =>
    requestService.get<Employee[]>(API_CONFIG.EMPLOYEES.BASE, params),

  createEmployee: (payload: CreateEmployeePayload) =>
    requestService.post<Employee, CreateEmployeePayload>(
      API_CONFIG.EMPLOYEES.BASE,
      payload,
    ),

  updateEmployee: (id: string, payload: UpdateEmployeePayload) =>
    requestService.put<Employee, UpdateEmployeePayload>(
      API_CONFIG.EMPLOYEES.BY_ID(id),
      payload,
    ),

  uploadPhoto: (id: string, file: File) =>
    postMultipartEmployeePhoto(id, file),

  deleteEmployee: (id: string) =>
    requestService.delete<{ message: string }>(API_CONFIG.EMPLOYEES.BY_ID(id)),
};
