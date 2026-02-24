import { requestService } from "../request/requestServcie";

export interface User {
  id: string;
  name: string;
  email: string;
}

export const usersApi = {
  getUsers: () => requestService.get<User[]>("/users"),

  getUserById: (id: string) =>
    requestService.get<User>(`/users/${id}`),

  createUser: (payload: Omit<User, "id">) =>
    requestService.post<User, Omit<User, "id">>("/users", payload),

  updateUser: (id: string, payload: Partial<User>) =>
    requestService.patch<User, Partial<User>>(
      `/users/${id}`,
      payload
    ),

  deleteUser: (id: string) =>
    requestService.delete<void>(`/users/${id}`),
};