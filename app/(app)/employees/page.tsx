"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import styles from "./Employees.module.css";
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
  useUploadEmployeePhoto,
} from "@/services/employees/employees.hooks";
import {
  Employee,
  EmployeeStatus,
  EmployeeType,
  EMPLOYEE_TYPE_LABELS,
} from "@/services/employees/employees.api";
import {
  ALL_PERMISSION_KEYS,
  CRUD_ACTION_LABEL,
  PERMISSION_LABELS,
  PERMISSION_MODULES,
  PermissionKey,
  actionForKey,
  normalizePermissions,
  summarizeModuleAccess,
} from "@/lib/rbac";
import { RowActions } from "@/components/RowActions";
import {
  UPLOAD_ACCEPT,
  validateImageFile,
  resolveUploadLimits,
} from "@/lib/upload";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

type FormState = {
  name: string;
  email: string;
  password: string;
  phone: string;
  type: EmployeeType;
  status: EmployeeStatus;
  notes: string;
  permissions: PermissionKey[];
};

const EMPTY: FormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  type: "STAFF",
  status: "ACTIVE",
  notes: "",
  permissions: ["dashboard"],
};

export default function EmployeesPage() {
  const [typeFilter, setTypeFilter] = useState<"ALL" | EmployeeType>("ALL");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: employees, isLoading, isError } = useEmployees(
    typeFilter === "ALL" ? undefined : { type: typeFilter },
  );
  const createEmp = useCreateEmployee();
  const updateEmp = useUpdateEmployee();
  const deleteEmp = useDeleteEmployee();
  const uploadPhoto = useUploadEmployeePhoto();
  const uploadLimits = resolveUploadLimits();

  const filtered = useMemo(() => {
    const list = employees ?? [];
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.phone ?? "").includes(q) ||
        (e.email ?? "").toLowerCase().includes(q),
    );
  }, [employees, search]);

  const activeCount = (employees ?? []).filter((e) => e.status === "ACTIVE").length;
  const byType = (t: EmployeeType) =>
    (employees ?? []).filter((e) => e.type === t).length;

  const resetForm = () => {
    setForm(EMPTY);
    setEditing(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const onPhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    const err = validateImageFile(file, uploadLimits);
    if (err) {
      toast.error(err);
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const togglePerm = (key: PermissionKey) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const toggleModule = (keys: PermissionKey[]) => {
    setForm((prev) => {
      const allOn = keys.every((k) => prev.permissions.includes(k));
      if (allOn) {
        return {
          ...prev,
          permissions: prev.permissions.filter((p) => !keys.includes(p)),
        };
      }
      return {
        ...prev,
        permissions: [...new Set([...prev.permissions, ...keys])],
      };
    });
  };

  const startEdit = (emp: Employee) => {
    setEditing(emp);
    const perms = normalizePermissions(
      emp.customPermissions ?? emp.permissions ?? ["dashboard"],
    );
    setForm({
      name: emp.name,
      email: emp.email ?? "",
      password: "",
      phone: emp.phone ?? "",
      type: emp.type === "TRAINER" || emp.type === "SALES" ? emp.type : "STAFF",
      status: emp.status,
      notes: emp.notes ?? "",
      permissions: perms.length ? perms : ["dashboard"],
    });
    setPhotoFile(null);
    setPhotoPreview(emp.photoUrl ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!editing && !form.password.trim()) {
      toast.error("Password is required");
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.permissions.length === 0) {
      toast.error("Select at least one access permission");
      return;
    }

    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name.trim(),
          email: form.email.trim(),
          type: form.type,
          status: form.status,
          customPermissions: form.permissions,
        };
        if (form.phone.trim()) payload.phone = form.phone.trim();
        else payload.phone = "";
        if (form.notes.trim()) payload.notes = form.notes.trim();
        else payload.notes = "";
        if (form.password.trim()) payload.password = form.password.trim();

        await updateEmp.mutateAsync({
          id: editing._id,
          payload: payload as any,
        });
        if (photoFile) {
          await uploadPhoto.mutateAsync({ id: editing._id, file: photoFile });
        }
        toast.success("Employee updated");
        resetForm();
      } else {
        const created = await createEmp.mutateAsync({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          type: form.type,
          status: form.status,
          phone: form.phone.trim() || undefined,
          notes: form.notes.trim() || undefined,
          customPermissions: form.permissions,
        });
        if (photoFile && created?._id) {
          await uploadPhoto.mutateAsync({ id: created._id, file: photoFile });
        }
        toast.success(
          form.status === "ACTIVE"
            ? "Employee created — they can log in"
            : "Employee created (login inactive)",
        );
        resetForm();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Save failed");
    }
  };

  const setLoginAccess = async (emp: Employee, grant: boolean) => {
    try {
      await updateEmp.mutateAsync({
        id: emp._id,
        payload: { status: grant ? "ACTIVE" : "INACTIVE" },
      });
      toast.success(grant ? `Login enabled for ${emp.name}` : `Login disabled for ${emp.name}`);
      if (editing?._id === emp._id) {
        setForm((p) => ({ ...p, status: grant ? "ACTIVE" : "INACTIVE" }));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update login");
    }
  };

  const onDelete = async (emp: Employee) => {
    if (!confirm(`Delete ${emp.name}? Their login will be removed.`)) return;
    try {
      await deleteEmp.mutateAsync(emp._id);
      toast.success("Deleted");
      if (editing?._id === emp._id) resetForm();
    } catch {
      toast.error("Delete failed");
    }
  };

  const saving =
    createEmp.isPending || updateEmp.isPending || uploadPhoto.isPending;

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.pageHeader}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <p className={styles.eyebrow}>Team</p>
          <h1 className={styles.pageTitle}>Employees</h1>
          <p className={styles.pageDesc}>
            Add staff and choose exactly which CRM areas they can use. Role
            (Staff / Trainer / Sales) is only a label — access is whatever you
            tick below.
          </p>
        </div>
      </motion.div>

      <motion.div
        className={styles.statStrip}
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Total</span>
          <span className={styles.statVal}>{employees?.length ?? 0}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Can log in</span>
          <span className={styles.statVal}>{activeCount}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Staff / Trainer / Sales</span>
          <span className={styles.statVal}>
            {byType("STAFF")} / {byType("TRAINER")} / {byType("SALES")}
          </span>
        </div>
      </motion.div>

      <div className={styles.split}>
        <motion.div
          className={styles.card}
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleBar} />
              {editing ? `Edit · ${editing.name}` : "Add employee"}
            </h2>
            {editing ? (
              <button type="button" className={styles.chipBtn} onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className={styles.formBody}>
            <div className={styles.formGrid}>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Photo (optional)</span>
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="Employee"
                    className={styles.photoPreview}
                  />
                ) : null}
                <input
                  type="file"
                  accept={UPLOAD_ACCEPT}
                  onChange={onPhotoPick}
                />
                <span className={styles.photoHint}>
                  Max {uploadLimits.maxFileMb}MB — leave empty to skip
                </span>
              </label>
              <label className={styles.field}>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                />
              </label>
              <label className={styles.field}>
                <span>Role (label)</span>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as EmployeeType })
                  }
                >
                  {(Object.keys(EMPLOYEE_TYPE_LABELS) as EmployeeType[]).map(
                    (t) => (
                      <option key={t} value={t}>
                        {EMPLOYEE_TYPE_LABELS[t]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className={styles.field}>
                <span>Email (login)</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@gym.com"
                />
              </label>
              <label className={styles.field}>
                <span>{editing ? "New password (optional)" : "Password"}</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder={editing ? "Leave blank to keep" : "Min 6 characters"}
                  autoComplete="new-password"
                />
              </label>
              <label className={styles.field}>
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span>Login</span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as EmployeeStatus,
                    })
                  }
                >
                  <option value="ACTIVE">Allowed</option>
                  <option value="INACTIVE">Blocked</option>
                </select>
              </label>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional"
                />
              </label>
            </div>

            <div className={styles.accessBlock}>
              <div className={styles.accessHead}>
                <h3>CRM access</h3>
                <p>
                  Grant View / Create / Update / Delete per module. Role label
                  does not decide access.
                </p>
              </div>

              <div className={styles.permQuick}>
                <button
                  type="button"
                  className={styles.chipBtn}
                  onClick={() =>
                    setForm({
                      ...form,
                      permissions: [...ALL_PERMISSION_KEYS],
                    })
                  }
                >
                  Select all
                </button>
                <button
                  type="button"
                  className={styles.chipBtn}
                  onClick={() => setForm({ ...form, permissions: [] })}
                >
                  Unselect all
                </button>
              </div>

              <div className={styles.crudTable}>
                <div className={`${styles.crudRow} ${styles.crudHead}`}>
                  <span>Module</span>
                  <span>View</span>
                  <span>Create</span>
                  <span>Update</span>
                  <span>Delete</span>
                  <span />
                </div>
                {PERMISSION_MODULES.map((mod) => {
                  const allOn = mod.keys.every((k) =>
                    form.permissions.includes(k),
                  );
                  return (
                    <div key={mod.id} className={styles.crudRow}>
                      <span className={styles.crudModule}>{mod.label}</span>
                      {(["view", "create", "update", "delete"] as const).map(
                        (action) => {
                          if (mod.id === "dashboard") {
                            if (action !== "view") {
                              return (
                                <span
                                  key={action}
                                  className={styles.crudEmpty}
                                />
                              );
                            }
                            const key = "dashboard" as PermissionKey;
                            const on = form.permissions.includes(key);
                            return (
                              <label
                                key={action}
                                className={`${styles.crudCheck} ${on ? styles.permOn : ""}`}
                                title={CRUD_ACTION_LABEL.access}
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => togglePerm(key)}
                                />
                                <span className={styles.crudCheckLabel}>
                                  Access
                                </span>
                              </label>
                            );
                          }
                          const key = mod.keys.find(
                            (k) => actionForKey(k) === action,
                          );
                          if (!key) {
                            return (
                              <span key={action} className={styles.crudEmpty} />
                            );
                          }
                          const on = form.permissions.includes(key);
                          return (
                            <label
                              key={action}
                              className={`${styles.crudCheck} ${on ? styles.permOn : ""}`}
                              title={PERMISSION_LABELS[key]}
                            >
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => togglePerm(key)}
                              />
                              <span className={styles.crudCheckLabel}>
                                {CRUD_ACTION_LABEL[action]}
                              </span>
                            </label>
                          );
                        },
                      )}
                      <button
                        type="button"
                        className={styles.chipBtn}
                        onClick={() => toggleModule(mod.keys)}
                      >
                        {allOn ? "Clear" : "All"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={onSubmit}
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Create employee"}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.card}
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardTitleBar} />
              Directory
            </h2>
            <div className={styles.toolbar}>
              <input
                className={styles.searchInput}
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className={styles.filterSelect}
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as "ALL" | EmployeeType)
                }
              >
                <option value="ALL">All roles</option>
                {(Object.keys(EMPLOYEE_TYPE_LABELS) as EmployeeType[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {EMPLOYEE_TYPE_LABELS[t]}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className={styles.tableWrap}>
            {isLoading && (
              <p className={styles.empty}>Loading…</p>
            )}
            {isError && (
              <p className={styles.emptyError}>Failed to load employees.</p>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <p className={styles.empty}>No employees yet.</p>
            )}
            {!isLoading && !isError && filtered.length > 0 && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Access</th>
                    <th>Login</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => {
                    return (
                      <tr
                        key={emp._id}
                        className={
                          editing?._id === emp._id ? styles.rowActive : undefined
                        }
                      >
                        <td>
                          <div className={styles.nameWithPhoto}>
                            {emp.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={emp.photoUrl}
                                alt=""
                                className={styles.avatarThumb}
                              />
                            ) : (
                              <span className={styles.avatarFallback}>
                                {emp.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                            <div>
                              <div className={styles.cellName}>{emp.name}</div>
                              <div className={styles.cellMuted}>{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {EMPLOYEE_TYPE_LABELS[emp.type] ?? emp.type}
                        </td>
                        <td>
                          <div className={styles.permTags}>
                            {(() => {
                              const tags = summarizeModuleAccess(
                                emp.customPermissions ?? emp.permissions ?? [],
                              );
                              if (!tags.length) {
                                return (
                                  <span className={styles.cellMuted}>None</span>
                                );
                              }
                              return (
                                <>
                                  {tags.slice(0, 3).map((t) => (
                                    <span key={t} className={styles.tag}>
                                      {t}
                                    </span>
                                  ))}
                                  {tags.length > 3 ? (
                                    <span className={styles.tag}>
                                      +{tags.length - 3}
                                    </span>
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td>
                          <span
                            className={
                              emp.status === "ACTIVE"
                                ? styles.statusOn
                                : styles.statusOff
                            }
                          >
                            {emp.status === "ACTIVE" ? "On" : "Off"}
                          </span>
                        </td>
                        <td>
                          <RowActions
                            actions={[
                              {
                                label: "Edit",
                                onClick: () => startEdit(emp),
                              },
                              {
                                label:
                                  emp.status === "ACTIVE" ? "Block" : "Allow",
                                onClick: () =>
                                  setLoginAccess(emp, emp.status !== "ACTIVE"),
                              },
                              {
                                label: "Delete",
                                onClick: () => onDelete(emp),
                                tone: "danger",
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
