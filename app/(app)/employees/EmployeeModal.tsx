"use client";

import { useState, useEffect } from "react";
import { Employee, CreateEmployeePayload } from "@/services/employees/employees.api";
import { useCreateEmployee, useUpdateEmployee } from "@/services/employees/employees.hook";

interface EmployeeModalProps {
  open: boolean;
  onClose: () => void;
  existing?: Employee | null;
}

export default function EmployeeModal({ open, onClose, existing }: EmployeeModalProps) {
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const [formData, setFormData] = useState<CreateEmployeePayload>({
    name: "",
    age: 25,
    dob: "",
    gender: undefined,
    salary: 0,
    employeeType: "SALES",
    status: "ACTIVE",
    joiningDate: new Date().toISOString().split("T")[0],
    phone: "",
    email: "",
    isMarried: false,
    anniversaryDate: "",
    address: "",
    documentType: undefined,
    documentNumber: "",
    academicQualification: undefined,
    trainerCertificateNumber: "",
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        name: existing.name,
        age: existing.age,
        dob: existing.dob ? new Date(existing.dob).toISOString().split("T")[0] : "",
        gender: existing.gender,
        salary: existing.salary,
        employeeType: existing.employeeType,
        status: existing.status,
        joiningDate: new Date(existing.joiningDate).toISOString().split("T")[0],
        phone: existing.phone,
        email: existing.email,
        isMarried: existing.isMarried || false,
        anniversaryDate: existing.anniversaryDate ? new Date(existing.anniversaryDate).toISOString().split("T")[0] : "",
        address: existing.address || "",
        documentType: existing.documentType,
        documentNumber: existing.documentNumber || "",
        academicQualification: existing.academicQualification,
        trainerCertificateNumber: existing.trainerCertificateNumber || "",
      });
    } else {
      setFormData({
        name: "",
        age: 25,
        dob: "",
        gender: undefined,
        salary: 0,
        employeeType: "SALES",
        status: "ACTIVE",
        joiningDate: new Date().toISOString().split("T")[0],
        phone: "",
        email: "",
        isMarried: false,
        anniversaryDate: "",
        address: "",
        documentType: undefined,
        documentNumber: "",
        academicQualification: undefined,
        trainerCertificateNumber: "",
      });
    }
  }, [existing, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build clean payload - only include fields with actual values
      const payload: any = {
        name: formData.name,
        age: formData.age,
        salary: formData.salary,
        employeeType: formData.employeeType,
        status: formData.status,
        joiningDate: formData.joiningDate,
        phone: formData.phone,
        email: formData.email,
        isMarried: formData.isMarried,
      };

      // Only add optional fields if they have non-empty values
      const addIfNotEmpty = (key: string, value: any) => {
        if (value !== undefined && value !== null && value !== "") {
          if (typeof value === "string" && value.trim() !== "") {
            payload[key] = value;
          } else if (typeof value !== "string") {
            payload[key] = value;
          }
        }
      };

      addIfNotEmpty("dob", formData.dob);
      addIfNotEmpty("gender", formData.gender);
      addIfNotEmpty("anniversaryDate", formData.anniversaryDate);
      addIfNotEmpty("address", formData.address);
      addIfNotEmpty("documentType", formData.documentType);
      addIfNotEmpty("documentNumber", formData.documentNumber);
      addIfNotEmpty("academicQualification", formData.academicQualification);
      addIfNotEmpty("trainerCertificateNumber", formData.trainerCertificateNumber);

      if (existing) {
        await updateMutation.mutateAsync({ id: existing._id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
        overflow: "auto",
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
          maxWidth: "600px",
          maxHeight: "90vh",
          overflow: "auto",
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#fff", marginBottom: "1.5rem" }}>
          {existing ? "Edit Employee" : "Add New Employee"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Age *
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                required
                min="18"
                max="100"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Phone *
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
              Salary *
            </label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
              required
              step="0.01"
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#111",
                border: "1px solid #1e1e1e",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "0.875rem",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Type *
              </label>
              <select
                value={formData.employeeType}
                onChange={(e) => setFormData({ ...formData, employeeType: e.target.value as any })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              >
                <option value="SALES">Sales</option>
                <option value="TRAINER">Trainer</option>
                <option value="HOUSEKEEPING">Housekeeping</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Joining Date *
              </label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          </div>

          {/* NEW FIELDS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Gender
              </label>
              <select
                value={formData.gender || ""}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any || undefined })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={formData.isMarried}
                  onChange={(e) => setFormData({ ...formData, isMarried: e.target.checked, ...((!e.target.checked) && { anniversaryDate: "" }) })}
                  style={{ marginRight: "0.5rem" }}
                />
                Is Married
              </label>
            </div>

            {formData.isMarried && (
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                  Anniversary Date
                </label>
                <input
                  type="date"
                  value={formData.anniversaryDate}
                  onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "#111",
                    border: "1px solid #1e1e1e",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "0.875rem",
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#111",
                border: "1px solid #1e1e1e",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "0.875rem",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Document Type
              </label>
              <select
                value={formData.documentType || ""}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any || undefined })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              >
                <option value="">Select Document</option>
                <option value="PAN">PAN</option>
                <option value="Aadhar">Aadhar</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Document Number
              </label>
              <input
                type="text"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
              Last Academic Qualification
            </label>
            <select
              value={formData.academicQualification || ""}
              onChange={(e) => setFormData({ ...formData, academicQualification: e.target.value as any || undefined })}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#111",
                border: "1px solid #1e1e1e",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "0.875rem",
              }}
            >
              <option value="">Select Qualification</option>
              <option value="10th">10th</option>
              <option value="12th">12th</option>
              <option value="Graduation">Graduation</option>
              <option value="Post Graduation">Post Graduation</option>
            </select>
          </div>

          {/* Trainer Certificate Number - Only for TRAINER type */}
          {formData.employeeType === "TRAINER" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", color: "#aaa", marginBottom: "0.5rem" }}>
                Trainer Certificate Number
              </label>
              <input
                type="text"
                value={formData.trainerCertificateNumber || ""}
                onChange={(e) => setFormData({ ...formData, trainerCertificateNumber: e.target.value })}
                placeholder="Enter certificate number"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
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
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "#d42b2b",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? "Saving..." : existing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
