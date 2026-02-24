import apiClient from "@/services/apiClient";
import { setupInterceptors } from "@/services/interceptor";

setupInterceptors(apiClient);

export default apiClient;