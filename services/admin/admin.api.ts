// services/admin.api.ts

import apiClient from "../apiClient";
import { API_CONFIG } from "@/config/config";

export interface AdminUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  userType?: string;
  permissions?: string[];
  customPermissions?: string[] | null;
  companyId?: string | null;
  companyName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
}

export interface AdminLoginResponse {
  user: AdminUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const adminLogin = async (payload: {
  email: string;
  password: string;
}): Promise<AdminLoginResponse> => {
  const response = await apiClient.post(
    API_CONFIG.AUTH.ADMIN_LOGIN,
    payload
  );
  return response.data;
};

export const adminLogout = async () => {
  // ✅ No manual header needed — interceptor attaches the access token automatically
  return apiClient.post(API_CONFIG.AUTH.ADMIN_LOGOUT);
};