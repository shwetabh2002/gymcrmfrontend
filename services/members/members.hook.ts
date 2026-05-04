import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  membersApi,
  normalizeMember,
  CreateMemberPayload,
  UpdateMemberPayload,
  RegisterMemberPayload,
  MembersListQuery,
} from "./members.api";

// 🔹 Fetch All
export const useMembers = () => {
  return useQuery({
    queryKey: ["members"],
    queryFn: membersApi.getMembers,
    select: (data) => data.map(normalizeMember),
  });
};

export const useMembersList = (query: MembersListQuery) => {
  return useQuery({
    queryKey: ["members", "list", query],
    queryFn: () => membersApi.getMembersList(query),
    select: (res) => ({
      ...res,
      data: res.data.map(normalizeMember),
    }),
  });
};

// 🔹 Fetch Single Member
export const useMemberById = (id: string) => {
  return useQuery({
    queryKey: ["members", id],
    queryFn: () => membersApi.getMemberById(id),
    enabled: !!id,
    select: normalizeMember,
  });
};

// 🔹 Create Member
export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterMemberPayload) =>
      membersApi.registerMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

// 🔹 Update Member
export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMemberPayload }) =>
      membersApi.updateMember(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["members", id] });
    },
  });
};

// 🔹 Delete Member
export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membersApi.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

// 🔹 Add Payment to Member
export const useAddPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => membersApi.addPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

// 🔹 Import Members from Excel
export const useImportMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => membersApi.importMembers(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};

