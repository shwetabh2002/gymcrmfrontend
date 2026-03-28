import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi, CreateEmployeePayload, UpdateEmployeePayload } from "./employees.api";
import { toast } from "react-hot-toast";

const QUERY_KEY = "employees";

// Check unlock status
export const useEmployeeUnlockStatus = () => {
  return useQuery({
    queryKey: [QUERY_KEY, "status"],
    queryFn: async () => {
      const response = await employeesApi.checkStatus();
      return response.data;
    },
    retry: false,
  });
};

// Get all employees
export const useEmployees = (enabled: boolean = true) => {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const response = await employeesApi.getEmployees();
      return response;
    },
    enabled,
    retry: false, // Don't retry if locked (401 error)
    throwOnError: false, // Don't throw errors, just return them in isError
  });
};

// Get employee by ID
export const useEmployee = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const response = await employeesApi.getEmployeeById(id);
      return response;
    },
    enabled: !!id && enabled,
  });
};

// Unlock section
export const useUnlockEmployeeSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => employeesApi.unlock(password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "status"] });
      toast.success("Employee section unlocked successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Invalid password";
      toast.error(message);
    },
  });
};

// Lock section
export const useLockEmployeeSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => employeesApi.lock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "status"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Employee section locked");
    },
  });
};

// Create employee
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => employeesApi.createEmployee(payload),
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

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) =>
      employeesApi.updateEmployee(id, payload),
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

  return useMutation({
    mutationFn: (id: string) => employeesApi.deleteEmployee(id),
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
