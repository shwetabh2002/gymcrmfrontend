import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { membersApi, CreateMemberPayload, UpdateMemberPayload } from "./members.api";

// 🔹 Fetch All Members
export const useMembers = () => {
  return useQuery({
    queryKey: ["members"],
    queryFn: membersApi.getMembers,
  });
};

// 🔹 Fetch Single Member
export const useMemberById = (id: string) => {
  return useQuery({
    queryKey: ["members", id],
    queryFn: () => membersApi.getMemberById(id),
    enabled: !!id,
  });
};

// 🔹 Create Member
export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMemberPayload) =>
      membersApi.createMember(payload),
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

