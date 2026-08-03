import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  employeesApi,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  EmployeeType,
  EmployeeStatus,
} from "./employees.api";

export const useEmployees = (params?: {
  type?: EmployeeType;
  status?: EmployeeStatus;
}) =>
  useQuery({
    queryKey: ["employees", params ?? {}],
    queryFn: () => employeesApi.getEmployees(params),
  });

export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) =>
      employeesApi.createEmployee(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
};

export const useUpdateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) =>
      employeesApi.updateEmployee(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.deleteEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
};

export const useUploadEmployeePhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      employeesApi.uploadPhoto(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
};
