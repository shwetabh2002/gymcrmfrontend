// Shared frontend RBAC — keep in sync with backend permission.enum.ts

export type StaffRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "STAFF"
  | "TRAINER"
  | "SALES"
  | "USER"
  | string;

export type CrudAction = "view" | "create" | "update" | "delete";

export type PermissionKey =
  | "dashboard"
  | "members_view"
  | "members_create"
  | "members_update"
  | "members_delete"
  | "renewals_view"
  | "renewals_create"
  | "renewals_update"
  | "renewals_delete"
  | "subscriptions_view"
  | "subscriptions_create"
  | "subscriptions_update"
  | "subscriptions_delete"
  | "plans_view"
  | "plans_create"
  | "plans_update"
  | "plans_delete"
  | "payments_view"
  | "payments_create"
  | "payments_update"
  | "payments_delete"
  | "invoices_view"
  | "invoices_create"
  | "invoices_update"
  | "invoices_delete"
  | "employees_view"
  | "employees_create"
  | "employees_update"
  | "employees_delete"
  | "settings_view"
  | "settings_create"
  | "settings_update"
  | "settings_delete"
  | "locations_view"
  | "locations_create"
  | "locations_update"
  | "locations_delete";

export type PermissionModuleId =
  | "dashboard"
  | "members"
  | "renewals"
  | "subscriptions"
  | "plans"
  | "payments"
  | "invoices"
  | "employees"
  | "settings"
  | "locations";

export type PermissionModule = {
  id: PermissionModuleId;
  label: string;
  keys: PermissionKey[];
};

export const PERMISSION_MODULES: PermissionModule[] = [
  { id: "dashboard", label: "Dashboard", keys: ["dashboard"] },
  {
    id: "members",
    label: "Members",
    keys: ["members_view", "members_create", "members_update", "members_delete"],
  },
  {
    id: "renewals",
    label: "Expiry Follow-ups",
    keys: [
      "renewals_view",
      "renewals_create",
      "renewals_update",
      "renewals_delete",
    ],
  },
  {
    id: "subscriptions",
    label: "Memberships",
    keys: [
      "subscriptions_view",
      "subscriptions_create",
      "subscriptions_update",
      "subscriptions_delete",
    ],
  },
  {
    id: "plans",
    label: "Plans",
    keys: ["plans_view", "plans_create", "plans_update", "plans_delete"],
  },
  {
    id: "payments",
    label: "Payments",
    keys: [
      "payments_view",
      "payments_create",
      "payments_update",
      "payments_delete",
    ],
  },
  {
    id: "invoices",
    label: "Invoices",
    keys: [
      "invoices_view",
      "invoices_create",
      "invoices_update",
      "invoices_delete",
    ],
  },
  {
    id: "employees",
    label: "Employees",
    keys: [
      "employees_view",
      "employees_create",
      "employees_update",
      "employees_delete",
    ],
  },
  {
    id: "settings",
    label: "Gym settings",
    keys: [
      "settings_view",
      "settings_create",
      "settings_update",
      "settings_delete",
    ],
  },
  {
    id: "locations",
    label: "Locations",
    keys: [
      "locations_view",
      "locations_create",
      "locations_update",
      "locations_delete",
    ],
  },
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_MODULES.flatMap(
  (m) => m.keys,
);

export const CRUD_ACTION_LABEL: Record<CrudAction | "access", string> = {
  access: "Access",
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
};

export function actionForKey(key: PermissionKey): CrudAction | "access" {
  if (key === "dashboard") return "access";
  if (key.endsWith("_view")) return "view";
  if (key.endsWith("_create")) return "create";
  if (key.endsWith("_update")) return "update";
  if (key.endsWith("_delete")) return "delete";
  return "access";
}

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: "Dashboard",
  members_view: "View members",
  members_create: "Create members",
  members_update: "Update members",
  members_delete: "Delete members",
  renewals_view: "View expiry follow-ups",
  renewals_create: "Create expiry follow-ups",
  renewals_update: "Update expiry follow-ups",
  renewals_delete: "Delete expiry follow-ups",
  subscriptions_view: "View memberships",
  subscriptions_create: "Assign memberships",
  subscriptions_update: "Update memberships",
  subscriptions_delete: "Delete memberships",
  plans_view: "View plans",
  plans_create: "Create plans",
  plans_update: "Update plans",
  plans_delete: "Delete plans",
  payments_view: "View payments",
  payments_create: "Record payments",
  payments_update: "Update payments",
  payments_delete: "Delete payments",
  invoices_view: "View invoices",
  invoices_create: "Create invoices",
  invoices_update: "Update invoices",
  invoices_delete: "Delete invoices",
  employees_view: "View employees",
  employees_create: "Create employees",
  employees_update: "Update employees",
  employees_delete: "Delete employees",
  settings_view: "View settings",
  settings_create: "Create settings",
  settings_update: "Update settings",
  settings_delete: "Delete settings",
  locations_view: "View locations",
  locations_create: "Create locations",
  locations_update: "Update locations",
  locations_delete: "Delete locations",
};

const LEGACY_EXPAND: Record<string, PermissionKey[]> = {
  renewals: [
    "renewals_view",
    "renewals_create",
    "renewals_update",
    "renewals_delete",
  ],
  subscriptions: [
    "subscriptions_view",
    "subscriptions_create",
    "subscriptions_update",
    "subscriptions_delete",
  ],
  plans: ["plans_view", "plans_create", "plans_update", "plans_delete"],
  payments: [
    "payments_view",
    "payments_create",
    "payments_update",
    "payments_delete",
  ],
  invoices: [
    "invoices_view",
    "invoices_create",
    "invoices_update",
    "invoices_delete",
  ],
  employees: [
    "employees_view",
    "employees_create",
    "employees_update",
    "employees_delete",
  ],
  settings: [
    "settings_view",
    "settings_create",
    "settings_update",
    "settings_delete",
  ],
  locations: [
    "locations_view",
    "locations_create",
    "locations_update",
    "locations_delete",
  ],
};

const ALLOWED = new Set<string>(ALL_PERMISSION_KEYS);

export function normalizePermissions(
  list?: string[] | null,
): PermissionKey[] {
  if (!list?.length) return [];
  const out = new Set<PermissionKey>();
  const raw = list.map((p) => String(p));
  const isLegacy = raw.some((k) => k in LEGACY_EXPAND);

  for (const key of raw) {
    const expanded = LEGACY_EXPAND[key];
    if (expanded) {
      for (const p of expanded) out.add(p);
      continue;
    }
    if (ALLOWED.has(key)) out.add(key as PermissionKey);
  }

  if (isLegacy && out.has("members_create")) {
    out.add("members_update");
  }

  return [...out];
}

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER"]);

const STAFF_DEFAULTS: PermissionKey[] = ["dashboard"];

const TRAINER_DEFAULTS: PermissionKey[] = [
  "dashboard",
  "members_view",
  "renewals_view",
  "renewals_update",
  "subscriptions_view",
  "plans_view",
];

const SALES_DEFAULTS: PermissionKey[] = [
  "dashboard",
  "members_view",
  "members_create",
  "members_update",
  "renewals_view",
  "renewals_create",
  "renewals_update",
  "subscriptions_view",
  "subscriptions_create",
  "subscriptions_update",
  "plans_view",
  "payments_view",
  "payments_create",
  "invoices_view",
  "invoices_create",
];

export function isAdminRole(role?: string | null) {
  return !!role && ADMIN_ROLES.has(role);
}

export function isStaffRole(role?: string | null) {
  return (
    isAdminRole(role) ||
    role === "STAFF" ||
    role === "TRAINER" ||
    role === "SALES"
  );
}

export function defaultPermissionsForRole(role?: string | null): PermissionKey[] {
  if (isAdminRole(role)) return [...ALL_PERMISSION_KEYS];
  if (role === "STAFF") return [...STAFF_DEFAULTS];
  if (role === "TRAINER") return [...TRAINER_DEFAULTS];
  if (role === "SALES") return [...SALES_DEFAULTS];
  return [];
}

export function getEffectivePermissions(
  role?: string | null,
  customPermissions?: string[] | null,
): PermissionKey[] {
  if (isAdminRole(role)) return [...ALL_PERMISSION_KEYS];
  if (customPermissions != null) {
    return normalizePermissions(customPermissions);
  }
  return defaultPermissionsForRole(role);
}

export function hasPermission(
  permissions: string[] | null | undefined,
  key: PermissionKey,
) {
  return !!permissions?.includes(key);
}

const ROUTE_PERMISSION: Record<string, PermissionKey> = {
  "/dashboard": "dashboard",
  "/renewals": "renewals_view",
  "/users": "members_view",
  "/employees": "employees_view",
  "/billing": "payments_view",
  "/subscriptions": "subscriptions_view",
  "/plans": "plans_view",
  "/payments": "payments_view",
  "/invoices": "invoices_view",
  "/locations": "locations_view",
  "/settings": "settings_view",
  "/profile": "dashboard",
};

export function canAccessRoute(
  role: string | null | undefined,
  href: string,
  permissions?: string[] | null,
) {
  if (href === "/companies" || href.startsWith("/companies")) {
    return role === "SUPER_ADMIN";
  }

  const entry = Object.entries(ROUTE_PERMISSION).find(
    ([path]) => href === path || (path !== "/dashboard" && href.startsWith(path)),
  );
  if (!entry) return isAdminRole(role);

  const effective =
    permissions != null
      ? normalizePermissions(permissions)
      : getEffectivePermissions(role, null);

  if (href === "/profile" || href.startsWith("/profile")) {
    return isStaffRole(role);
  }

  if (href === "/settings" || href.startsWith("/settings")) {
    return (
      hasPermission(effective, "settings_view") ||
      hasPermission(effective, "settings_update") ||
      hasPermission(effective, "members_create")
    );
  }

  // Billing hub: payments or subscriptions access
  if (href === "/billing" || href.startsWith("/billing")) {
    return (
      hasPermission(effective, "payments_view") ||
      hasPermission(effective, "payments_create") ||
      hasPermission(effective, "subscriptions_view") ||
      hasPermission(effective, "subscriptions_create")
    );
  }

  return effective.includes(entry[1]);
}

export function getDefaultRoute(
  role?: string | null,
  permissions?: string[] | null,
  companyId?: string | null,
) {
  if (role === "SUPER_ADMIN" && !companyId) {
    return "/companies";
  }
  const effective = normalizePermissions(
    permissions ?? getEffectivePermissions(role, null),
  );
  if (effective.includes("dashboard")) return "/dashboard";
  if (effective.includes("renewals_view")) return "/renewals";
  if (effective.includes("members_view")) return "/users";
  return "/profile";
}

export function canDeleteMembers(
  role?: string | null,
  permissions?: string[] | null,
) {
  return hasPermission(
    normalizePermissions(permissions ?? getEffectivePermissions(role, null)),
    "members_delete",
  );
}

export function canUpdateMembers(
  role?: string | null,
  permissions?: string[] | null,
) {
  const effective = normalizePermissions(
    permissions ?? getEffectivePermissions(role, null),
  );
  return (
    hasPermission(effective, "members_update") ||
    hasPermission(effective, "members_create")
  );
}

export function canManageEmployees(
  role?: string | null,
  permissions?: string[] | null,
) {
  const effective = normalizePermissions(
    permissions ?? getEffectivePermissions(role, null),
  );
  return (
    hasPermission(effective, "employees_view") ||
    hasPermission(effective, "employees_create") ||
    hasPermission(effective, "employees_update") ||
    hasPermission(effective, "employees_delete")
  );
}

export function canEditGymSettings(
  role?: string | null,
  permissions?: string[] | null,
) {
  return hasPermission(
    normalizePermissions(permissions ?? getEffectivePermissions(role, null)),
    "settings_update",
  );
}

export function canCreateMembers(
  role?: string | null,
  permissions?: string[] | null,
) {
  return hasPermission(
    normalizePermissions(permissions ?? getEffectivePermissions(role, null)),
    "members_create",
  );
}

export function canRecordPayments(
  role?: string | null,
  permissions?: string[] | null,
) {
  return hasPermission(
    normalizePermissions(permissions ?? getEffectivePermissions(role, null)),
    "payments_create",
  );
}

export function isSalesRole(role?: string | null) {
  return role === "SALES" || isAdminRole(role);
}

export function navItemsForRole(
  role?: string | null,
  permissions?: string[] | null,
) {
  const all = [
    ...(role === "SUPER_ADMIN"
      ? [{ href: "/companies", label: "Companies", icon: "⬡" }]
      : []),
    { href: "/dashboard", label: "Dashboard", icon: "⊞" },
    { href: "/renewals", label: "Expiry Follow-ups", icon: "↻" },
    { href: "/users", label: "Members", icon: "◎" },
    { href: "/employees", label: "Employees", icon: "♟" },
    { href: "/locations", label: "Locations", icon: "⌖" },
    { href: "/billing", label: "Memberships & Payments", icon: "▤" },
    { href: "/plans", label: "Plans", icon: "◇" },
    { href: "/invoices", label: "Invoices", icon: "▣" },
    { href: "/settings", label: "Gym settings", icon: "⚙" },
    { href: "/profile", label: "Profile", icon: "◉" },
  ];
  return all.filter((item) => canAccessRoute(role, item.href, permissions));
}

export type AccessFlag = {
  key: PermissionKey;
  label: string;
  allowed: boolean;
};

export function permissionsForRole(role?: string | null): AccessFlag[] {
  const effective = getEffectivePermissions(role, null);
  return ALL_PERMISSION_KEYS.map((key) => ({
    key,
    label: PERMISSION_LABELS[key],
    allowed: effective.includes(key),
  }));
}

export function permissionsChecklist(
  role?: string | null,
  customPermissions?: string[] | null,
  accountActive = true,
): AccessFlag[] {
  const effective = getEffectivePermissions(role, customPermissions);
  return ALL_PERMISSION_KEYS.map((key) => ({
    key,
    label: PERMISSION_LABELS[key],
    allowed: accountActive && effective.includes(key),
  }));
}

export function summarizeModuleAccess(keys: string[]): string[] {
  const normalized = normalizePermissions(keys);
  const tags: string[] = [];
  for (const mod of PERMISSION_MODULES) {
    const hit = mod.keys.filter((k) => normalized.includes(k));
    if (!hit.length) continue;
    if (mod.id === "dashboard") {
      tags.push("Dashboard");
      continue;
    }
    const letters = hit
      .map((k) => actionForKey(k)[0]?.toUpperCase() ?? "")
      .join("");
    tags.push(`${mod.label} ${letters}`);
  }
  return tags;
}
