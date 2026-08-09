import axios from "axios";
import { APP_CONFIG, HTTP_CONFIG } from "@/config/app.config";
import { setupInterceptors } from "./interceptor";

const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: HTTP_CONFIG.timeoutMs,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Setup auth interceptors (attach access token + handle 401 refresh)
setupInterceptors(apiClient);

export default apiClient;
