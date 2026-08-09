"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { QUERY_CONFIG, TOAST_CONFIG } from "@/config/app.config";
import { AuthProvider } from "@/lib/context/AuthContext";
import { BrandingProvider } from "@/lib/context/BrandingContext";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: QUERY_CONFIG.retry,
            refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
            staleTime: QUERY_CONFIG.staleTimeMs,
          },
          mutations: {
            retry: QUERY_CONFIG.mutationRetry,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandingProvider>{children}</BrandingProvider>
      </AuthProvider>
      {/* Without this mount, every toast() in the app is silently swallowed. */}
      <Toaster
        position={TOAST_CONFIG.position}
        toastOptions={{
          duration: TOAST_CONFIG.defaultMs,
          style: { fontSize: "0.9rem" },
          success: { duration: TOAST_CONFIG.successMs },
          error: { duration: TOAST_CONFIG.errorMs },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
