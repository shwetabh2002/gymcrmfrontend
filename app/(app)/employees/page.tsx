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
  EMPLOYEE_TYPE_OPTIONS,
} from "@/services/employees/employees.api";
import {
  ACCESS_PACKS,
  MODULE_ACCESS_LEVEL_LABEL,
  ModuleAccessLevel,
  PERMISSION_MODULES,
  PermissionKey,
  keysForModuleLevel,
  levelForModuleKeys,
  matchAccessPackId,
  normalizePermissions,
  summarizeModuleAccess,
} from "@/lib/rbac";
import { RowActions } from "@/components/RowActions";
import {
  UPLOAD_ACCEPT,
  validateImageFile,
  resolveUploadLimits,
} from "@/lib/upload";
import { EASE_OUT_EXPO } from "@/config/motion";
import {
  FilterBar,
  FilterField,
  FilterSearch,
  FilterSelect,
} from "@/components/FilterBar/FilterBar";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: EASE_OUT_EXPO },
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

const FRONT_DESK_KEYS = ACCESS_PACKS.find((p) => p.id === "front_desk")!.keys;

const EMPTY: FormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  type: "STAFF",
  status: "ACTIVE",
  notes: "",
  permissions: [...FRONT_DESK_KEYS],
};

export default function EmployeesPage() {
  const [typeFilter, setTypeFilter] = useState<"ALL" | EmployeeType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EmployeeStatus>(
    "ALL",
  );
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const employeeQuery = useMemo(() => {
    const params: { type?: EmployeeType; status?: EmployeeStatus } = {};
    if (typeFilter !== "ALL") params.type = typeFilter;
    if (statusFilter !== "ALL") params.status = statusFilter;
    return Object.keys(params).length ? params : undefined;
  }, [typeFilter, statusFilter]);

  const {
    data: employees,
    isLoading,
    isError,
  } = useEmployees(employeeQuery);
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
        (e.email ?? "").toLowerCase().includes(q) ||
        (e.role ?? "").toLowerCase().includes(q),
    );
  }, [employees, search]);

  const activeFilterCount = [
    search.trim() !== "",
    typeFilter !== "ALL",
    statusFilter !== "ALL",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
  };

  const activeCount = (employees ?? []).filter(
    (e) => e.status === "ACTIVE",
  ).length;
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

  const setModuleLevel = (
    moduleKeys: PermissionKey[],
    level: ModuleAccessLevel,
  ) => {
    setForm((prev) => {
      const without = prev.permissions.filter((p) => !moduleKeys.includes(p));
      const nextKeys = keysForModuleLevel(moduleKeys, level);
      return {
        ...prev,
        permissions: [...new Set([...without, ...nextKeys])],
      };
    });
  };

  const applyPack = (packId: string) => {
    const pack = ACCESS_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setForm((prev) => ({ ...prev, permissions: [...pack.keys] }));
  };

  const setEmployeeType = (type: EmployeeType) => {
    const suggested =
      type === "TRAINER"
        ? ACCESS_PACKS.find((p) => p.id === "trainer")!.keys
        : ACCESS_PACKS.find((p) => p.id === "front_desk")!.keys;
    setForm((prev) => ({
      ...prev,
      type,
      permissions: [...suggested],
    }));
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
      type: emp.type === "TRAINER" ? "TRAINER" : "STAFF",
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
      toast.success(
        grant
          ? `Login enabled for ${emp.name}`
          : `Login disabled for ${emp.name}`,
      );
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
            Add Staff or Trainer. Pick a simple access pack (or tweak areas
            below) — everything is saved on their login.
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
          <span className={styles.statLabel}>Staff / Trainer</span>
          <span className={styles.statVal}>
            {byType("STAFF")} / {byType("TRAINER")}
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
              <button
                type="button"
                className={styles.chipBtn}
                onClick={resetForm}
              >
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
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <span>Job type</span>
                <div className={styles.typeRow}>
                  {EMPLOYEE_TYPE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.typeCard} ${
                        form.type === t ? styles.typeCardOn : ""
                      }`}
                      onClick={() => setEmployeeType(t)}
                    >
                      <strong>{EMPLOYEE_TYPE_LABELS[t]}</strong>
                      <span>
                        {t === "STAFF"
                          ? "Front desk / ops"
                          : "Coaching on the floor"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
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
                  placeholder={
                    editing ? "Leave blank to keep" : "Min 6 characters"
                  }
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
                <h3>What can they use in the CRM?</h3>
                <p>
                  Pick one pack below. Saved on this employee in the database.
                  You can fine-tune areas if needed.
                </p>
              </div>

              <div className={styles.packGrid}>
                {ACCESS_PACKS.map((pack) => {
                  const on = matchAccessPackId(form.permissions) === pack.id;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      className={`${styles.packCard} ${on ? styles.packCardOn : ""}`}
                      onClick={() => applyPack(pack.id)}
                    >
                      <strong>{pack.label}</strong>
                      <span>{pack.blurb}</span>
                    </button>
                  );
                })}
              </div>

              {matchAccessPackId(form.permissions) === "custom" ? (
                <p className={styles.customHint}>
                  Custom mix — set View only / Edit / Full per area:
                </p>
              ) : (
                <p className={styles.customHint}>
                  Fine-tune: View only (read) vs add/edit vs full delete:
                </p>
              )}

              <div className={styles.areaList}>
                {PERMISSION_MODULES.map((mod) => {
                  const level = levelForModuleKeys(mod.keys, form.permissions);
                  return (
                    <div
                      key={mod.id}
                      className={`${styles.areaRow} ${
                        level !== "none" ? styles.areaOn : ""
                      }`}
                    >
                      <span className={styles.areaLabel}>{mod.label}</span>
                      <select
                        className={styles.areaSelect}
                        value={level}
                        aria-label={`${mod.label} access level`}
                        onChange={(e) =>
                          setModuleLevel(
                            mod.keys,
                            e.target.value as ModuleAccessLevel,
                          )
                        }
                      >
                        {(
                          mod.id === "dashboard"
                            ? (["none", "view"] as ModuleAccessLevel[])
                            : (["none", "view", "edit", "full"] as ModuleAccessLevel[])
                        ).map((lv) => (
                          <option key={lv} value={lv}>
                            {mod.id === "dashboard" && lv === "view"
                              ? "Access"
                              : MODULE_ACCESS_LEVEL_LABEL[lv]}
                          </option>
                        ))}
                      </select>
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
          </div>
          <FilterBar
            title="Employee filters"
            activeCount={activeFilterCount}
            onClear={clearFilters}
          >
            <FilterField label="Search" grow>
              <FilterSearch
                value={search}
                onChange={setSearch}
                placeholder="Name, phone, email, role…"
              />
            </FilterField>
            <FilterField label="Type">
              <FilterSelect
                value={typeFilter}
                onChange={(v) => setTypeFilter(v as "ALL" | EmployeeType)}
              >
                <option value="ALL">All types</option>
                {EMPLOYEE_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {EMPLOYEE_TYPE_LABELS[t]}
                  </option>
                ))}
              </FilterSelect>
            </FilterField>
            <FilterField label="Status">
              <FilterSelect
                value={statusFilter}
                onChange={(v) =>
                  setStatusFilter(v as "ALL" | EmployeeStatus)
                }
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </FilterSelect>
            </FilterField>
          </FilterBar>

          <div className={styles.tableWrap}>
            {isLoading && <p className={styles.empty}>Loading…</p>}
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
                          editing?._id === emp._id
                            ? styles.rowActive
                            : undefined
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
                              <div className={styles.cellMuted}>
                                {emp.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{EMPLOYEE_TYPE_LABELS[emp.type] ?? emp.type}</td>
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
