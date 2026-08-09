"use client";

import { useEffect, useState } from "react";

/**
 * Delays a rapidly-changing value.
 *
 * Search boxes now query the server, so firing on every keystroke would mean a
 * database round trip per character. This waits for the typing to settle.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
