/** Gym CRM timezone — align with backend APP_TIMEZONE */
export const APP_TZ = "Asia/Kolkata";

export type ExportPeriodPreset =
  | "all"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

export interface DateRange {
  dateFrom?: string;
  dateTo?: string;
}

export interface PeriodOption {
  value: ExportPeriodPreset;
  label: string;
}

export const EXPORT_PERIOD_OPTIONS: PeriodOption[] = [
  { value: "all", label: "All time" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom", label: "Custom range" },
];

function ymdInTz(d: Date, tz = APP_TZ): string {
  return d.toLocaleDateString("en-CA", { timeZone: tz });
}

function addDaysIst(ymd: string, days: number): string {
  const base = new Date(`${ymd}T12:00:00+05:30`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toLocaleDateString("en-CA", { timeZone: APP_TZ });
}

/** Monday-start week in APP_TZ (IST) */
function weekBounds(referenceYmd: string): { dateFrom: string; dateTo: string } {
  const dow = new Date(`${referenceYmd}T12:00:00+05:30`).getUTCDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const dateFrom = addDaysIst(referenceYmd, diffToMonday);
  const dateTo = addDaysIst(dateFrom, 6);
  return { dateFrom, dateTo };
}

function monthBounds(year: number, monthIndex: number): { dateFrom: string; dateTo: string } {
  const firstYmd = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const dateTo = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { dateFrom: firstYmd, dateTo };
}

export function resolveExportPeriod(
  preset: ExportPeriodPreset,
  customFrom?: string,
  customTo?: string,
): DateRange {
  const today = ymdInTz(new Date());

  switch (preset) {
    case "this_week":
      return weekBounds(today);
    case "last_week":
      return weekBounds(addDaysIst(today, -7));
    case "this_month": {
      const [y, m] = today.split("-").map(Number);
      return monthBounds(y, m - 1);
    }
    case "last_month": {
      const [y, m] = today.split("-").map(Number);
      const d = new Date(y, m - 2, 1);
      return monthBounds(d.getFullYear(), d.getMonth());
    }
    case "custom":
      return {
        dateFrom: customFrom || undefined,
        dateTo: customTo || undefined,
      };
    case "all":
    default:
      return {};
  }
}

export function buildExportFilename(
  module: string,
  preset: ExportPeriodPreset,
  range: DateRange,
): string {
  const stamp = new Date().toISOString().slice(0, 10);
  if (preset === "this_month" || preset === "last_month") {
    const ref = range.dateFrom?.slice(0, 7) ?? stamp.slice(0, 7);
    return `${module}_${ref}.xlsx`;
  }
  if (preset === "this_week" || preset === "last_week") {
    return `${module}_${range.dateFrom}_to_${range.dateTo}.xlsx`;
  }
  if (preset === "custom" && range.dateFrom && range.dateTo) {
    return `${module}_${range.dateFrom}_to_${range.dateTo}.xlsx`;
  }
  return `${module}_${stamp}.xlsx`;
}

export function isDateInRange(
  isoOrYmd: string | undefined | null,
  range: DateRange,
): boolean {
  if (!range.dateFrom && !range.dateTo) return true;
  if (!isoOrYmd) return false;
  const d = isoOrYmd.slice(0, 10);
  if (range.dateFrom && d < range.dateFrom) return false;
  if (range.dateTo && d > range.dateTo) return false;
  return true;
}

export function formatDateForExport(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}
