import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi, CreateEmployeePayload, UpdateEmployeePayload, Employee } from "./employees.api";
import { analyticsApi, UpcomingCelebrationRow as AnalyticsCelebrationRow } from "../analytics/analytics.api";
import { toast } from "react-hot-toast";

const QUERY_KEY = "employees";
const STORAGE_KEY = "employee_password";

// Helper to get password from localStorage
const getStoredPassword = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
};

// Helper to store password in localStorage
const storePassword = (password: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, password);
  }
};

// Helper to clear password from localStorage
const clearPassword = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// Check if password is stored
export const useIsEmployeeSectionUnlocked = () => {
  return !!getStoredPassword();
};

// Verify and store password
export const useVerifyEmployeePassword = () => {
  return useMutation({
    mutationFn: async (password: string) => {
      const response = await employeesApi.verifyPassword(password);
      return { password, response };
    },
    onSuccess: ({ password }) => {
      storePassword(password);
      toast.success("Password verified successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Invalid password";
      toast.error(message);
    },
  });
};

// Lock section (clear password)
export const useLockEmployeeSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      clearPassword();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Employee section locked");
    },
  });
};

// Get all employees (no password required - read-only)
export const useEmployees = () => {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const response = await employeesApi.getEmployees();
      return response.data;
    },
    retry: false,
    throwOnError: false,
  });
};

// Get employee by ID (no password required - read-only)
export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const response = await employeesApi.getEmployeeById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create employee
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  const password = getStoredPassword();

  return useMutation({
    mutationFn: async (payload: CreateEmployeePayload) => {
      if (!password) throw new Error("Password not found");
      const response = await employeesApi.createEmployee(payload, password);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Employee created successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to create employee";
      toast.error(message);
    },
  });
};

// Update employee
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  const password = getStoredPassword();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) => {
      if (!password) throw new Error("Password not found");
      const response = await employeesApi.updateEmployee(id, payload, password);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Employee updated successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to update employee";
      toast.error(message);
    },
  });
};

// Delete employee
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  const password = getStoredPassword();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!password) throw new Error("Password not found");
      const response = await employeesApi.deleteEmployee(id, password);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Employee deleted successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to delete employee";
      toast.error(message);
    },
  });
};

/** Employees + members for dashboard birthday / anniversary cards */
export type UpcomingCelebrationRow = AnalyticsCelebrationRow;

function celebrationRoleLabel(row: UpcomingCelebrationRow): string {
  return "employeeType" in row && row.employeeType ? row.employeeType : "Member";
}

function celebrationPhone(row: UpcomingCelebrationRow): string {
  const p = row.phone ?? ("contactNumber" in row ? row.contactNumber : undefined);
  return p ?? "—";
}

export { celebrationRoleLabel, celebrationPhone };

/** "Today" / "Tomorrow" from month–day vs browser local date (keep in sync with backend TZ when possible). */
export function celebrationWhenLabel(
  row: UpcomingCelebrationRow,
  field: "dob" | "anniversaryDate"
): "Today" | "Tomorrow" | "" {
  const raw = field === "dob" ? row.dob : row.anniversaryDate;
  if (!raw) return "";
  const d = new Date(raw);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const now = new Date();
  const tM = now.getMonth() + 1;
  const tD = now.getDate();
  const tom = new Date(now);
  tom.setDate(tom.getDate() + 1);
  const tmM = tom.getMonth() + 1;
  const tmD = tom.getDate();
  if (m === tM && day === tD) return "Today";
  if (m === tmM && day === tmD) return "Tomorrow";
  return "";
}

// Get upcoming birthdays (today & tomorrow) — single GET /analytics/upcoming-birthdays
export const useUpcomingBirthdays = () => {
  return useQuery({
    queryKey: ["analytics", "upcoming-birthdays"],
    queryFn: () => analyticsApi.getUpcomingBirthdays(),
    retry: false,
    throwOnError: false,
  });
};

// Get upcoming anniversaries — single GET /analytics/upcoming-anniversaries
export const useUpcomingAnniversaries = () => {
  return useQuery({
    queryKey: ["analytics", "upcoming-anniversaries"],
    queryFn: () => analyticsApi.getUpcomingAnniversaries(),
    retry: false,
    throwOnError: false,
  });
};
