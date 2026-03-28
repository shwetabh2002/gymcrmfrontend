"use client";

import { useState } from "react";
import { useVerifyEmployeePassword } from "@/services/employees/employees.hook";

interface UnlockModalProps {
  open: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export default function UnlockModal({ open, onClose, onUnlock }: UnlockModalProps) {
  const [password, setPassword] = useState("");
  const verifyMutation = useVerifyEmployeePassword();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyMutation.mutateAsync(password);
      setPassword("");
      onUnlock();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
          padding: "2rem",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "0.5rem",
            }}
          >
            🔒 Employee Section Locked
          </h2>
          <p style={{ color: "#888", fontSize: "0.875rem" }}>
            Enter password to access employee data
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                color: "#aaa",
                marginBottom: "0.5rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter employee section password"
              autoFocus
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#111",
                border: "1px solid #1e1e1e",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "0.875rem",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#d42b2b";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#1e1e1e";
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#aaa",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password || verifyMutation.isPending}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: password ? "#d42b2b" : "#2a2a2a",
                border: "none",
                borderRadius: "6px",
                color: password ? "#fff" : "#555",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: password ? "pointer" : "not-allowed",
                opacity: verifyMutation.isPending ? 0.6 : 1,
              }}
            >
              {verifyMutation.isPending ? "Verifying..." : "Unlock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
