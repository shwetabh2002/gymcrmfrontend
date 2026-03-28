"use client";

import { Employee } from "@/services/employees/employees.api";
import { useDeleteEmployee } from "@/services/employees/employees.hook";

interface DeleteEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export default function DeleteEmployeeDialog({ open, onClose, employee }: DeleteEmployeeDialogProps) {
  const deleteMutation = useDeleteEmployee();

  if (!open || !employee) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(employee._id);
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
          padding: "2rem",
          width: "90%",
          maxWidth: "400px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#fff", marginBottom: "1rem" }}>
          Delete Employee?
        </h2>
        <p style={{ color: "#aaa", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Are you sure you want to delete <strong style={{ color: "#fff" }}>{employee.name}</strong>? This action
          cannot be undone.
        </p>

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
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "#dc2626",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: deleteMutation.isPending ? "not-allowed" : "pointer",
              opacity: deleteMutation.isPending ? 0.6 : 1,
            }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
