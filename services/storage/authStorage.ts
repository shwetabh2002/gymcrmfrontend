import storageService from "./storageService";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const authStorage = {
  // 🔹 Save both tokens
  setTokens: (accessToken: string, refreshToken: string): void => {
    storageService.setItem<string>(ACCESS_TOKEN_KEY, accessToken);
    storageService.setItem<string>(REFRESH_TOKEN_KEY, refreshToken);
  },

  // 🔹 Get access token
  getAccessToken: (): string | null => {
    return storageService.getItem<string>(ACCESS_TOKEN_KEY);
  },

  // 🔹 Get refresh token
  getRefreshToken: (): string | null => {
    return storageService.getItem<string>(REFRESH_TOKEN_KEY);
  },

  // 🔹 Clear both tokens
  clearTokens: (): void => {
    storageService.removeItem(ACCESS_TOKEN_KEY);
    storageService.removeItem(REFRESH_TOKEN_KEY);
  },
};