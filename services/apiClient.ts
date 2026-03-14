import axios from "axios";
import { config } from "@/config";
import { setupInterceptors } from "./interceptor";

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Setup auth interceptors (attach access token + handle 401 refresh)
setupInterceptors(apiClient);

export default apiClient;