import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi, CreateEmployeePayload, UpdateEmployeePayload } from "./employees.api";
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

// Get all employees
export const useEmployees = () => {
  const password = getStoredPassword();

  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      if (!password) throw new Error("Password not found");
      const response = await employeesApi.getEmployees(password);
      return response.data;
    },
    enabled: !!password,
    retry: false,
    throwOnError: false,
  });
};

// Get employee by ID
export const useEmployee = (id: string) => {
  const password = getStoredPassword();

  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      if (!password) throw new Error("Password not found");
      const response = await employeesApi.getEmployeeById(id, password);
      return response.data;
    },
    enabled: !!id && !!password,
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
