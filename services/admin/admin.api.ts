// services/admin.api.ts

import apiClient from "../apiClient";
import { API_CONFIG } from "@/config/config";
import { authStorage } from "../storage/authStorage";

export const adminLogin = async (payload: {
  email: string;
  password: string;
}) => {
  const response = await apiClient.post(
    API_CONFIG.AUTH.ADMIN_LOGIN,
    payload
  );

  return response.data;
};

export const adminLogout = async () => {
  const accessToken = authStorage.getAccessToken();

  return apiClient.post(
    API_CONFIG.AUTH.ADMIN_LOGOUT,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
};