"use client";

import { useMemo, useState } from "react";
import {
  ExportPeriodPreset,
  resolveExportPeriod,
  DateRange,
} from "./date-period";

export function useExportPeriod(
  defaultPreset: ExportPeriodPreset = "this_month",
) {
  const [period, setPeriod] = useState<ExportPeriodPreset>(defaultPreset);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range: DateRange = useMemo(
    () => resolveExportPeriod(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  return {
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    range,
  };
}
