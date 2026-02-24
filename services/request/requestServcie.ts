import apiClient from "@/services/apiClient";

export const requestService = {
  get: async <T>(url: string, params?: object): Promise<T> => {
    const { data } = await apiClient.get<T>(url, { params });
    return data;
  },

  post: async <T, D = unknown>(url: string, payload: D): Promise<T> => {
    const { data } = await apiClient.post<T>(url, payload);
    return data;
  },

  patch: async <T, D = unknown>(url: string, payload: D): Promise<T> => {
    const { data } = await apiClient.patch<T>(url, payload);
    return data;
  },

  delete: async <T>(url: string): Promise<T> => {
    const { data } = await apiClient.delete<T>(url);
    return data;
  },
};