"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { getDefaultRoute } from "@/lib/rbac";
import type { AdminUser } from "@/services/admin/admin.api";

function parseHash() {
  if (typeof window === "undefined") return new URLSearchParams();
  const raw = window.location.hash.replace(/^#/, "");
  return new URLSearchParams(raw);
}

function CallbackInner() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const params = parseHash();
      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      const userRaw = params.get("user");

      if (!accessToken || !refreshToken || !userRaw) {
        setError("Missing signup session. Please log in.");
        return;
      }

      const user = JSON.parse(decodeURIComponent(userRaw)) as AdminUser;
      login(accessToken, refreshToken, user);
      // Drop tokens from the address bar
      window.history.replaceState(null, "", "/auth/callback");
      router.replace(
        getDefaultRoute(user.role, user.permissions, user.companyId),
      );
    } catch (e: any) {
      setError(e?.message || "Could not complete signup login");
    }
  }, [login, router]);

  return (
    <p style={{ fontSize: 14, color: error ? "#c0392b" : "#666" }}>
      {error || "Opening your gym…"}
    </p>
  );
}

export default function AuthCallbackPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f5f4f1",
        fontFamily: "DM Sans, system-ui, sans-serif",
        color: "#1a1a1a",
      }}
    >
      <Suspense fallback={<p style={{ color: "#666" }}>Opening your gym…</p>}>
        <CallbackInner />
      </Suspense>
    </div>
  );
}
