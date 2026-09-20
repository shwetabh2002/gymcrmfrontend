// @/config/app.config — runtime values that differ per environment.
// Single source of truth: no component should read process.env directly.

/** Trailing slashes break `${base}${path}` joins, so strip them once here. */
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/** Local development fallbacks — deployments always set the env vars. */
const DEFAULTS = {
  /** Nest API. Must match the backend PORT (5000), not the CRM's own port. */
  apiBaseUrl: "http://localhost:5000",
  appName: "Gym Admin",
} as const;

export const APP_CONFIG = {
  apiBaseUrl: stripTrailingSlash(
    process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULTS.apiBaseUrl,
  ),
  appName: process.env.NEXT_PUBLIC_APP_NAME || DEFAULTS.appName,
} as const;

/** Axios client behaviour. */
export const HTTP_CONFIG = {
  /** Long enough for invoice/report endpoints, short enough to surface outages. */
  timeoutMs: 30_000,
} as const;

/** React Query defaults — one place to tune caching for the whole app. */
export const QUERY_CONFIG = {
  /** Short enough that navigating between pages picks up fresh CRM data. */
  staleTimeMs: 15_000,
  retry: 1,
  refetchOnWindowFocus: true,
  mutationRetry: 0,
} as const;

/** Toast durations, in ms. Errors linger so they are not missed. */
export const TOAST_CONFIG = {
  position: "top-right",
  defaultMs: 4_000,
  successMs: 3_000,
  errorMs: 6_000,
} as const;

/**
 * True when NEXT_PUBLIC_API_BASE_URL was missing and the local fallback is in
 * use — surfaced instead of thrown, so a build never fails on a missing env var.
 */
export const usingFallbackApiUrl = !process.env.NEXT_PUBLIC_API_BASE_URL;
