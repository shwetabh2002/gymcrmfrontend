import { APP_CONFIG } from "@/config/app.config";
import { API_CONFIG } from "@/config/config";

/** Public marketing CTAs — same origin as the CRM after the merge. */
export const MARKETING_LINKS = {
  home: "/",
  signup: "/signup",
  login: "/login",
  authCallback: "/auth/callback",
} as const;

export function signupApiUrl(): string {
  return `${APP_CONFIG.apiBaseUrl}${API_CONFIG.COMPANIES.SIGNUP}`;
}
