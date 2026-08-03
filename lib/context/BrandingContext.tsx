"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useGymSettings } from "@/services/gym-settings/gym-settings.hooks";
import type { GymSettings } from "@/services/gym-settings/gym-settings.api";
import {
  DEFAULT_INVOICE_DISPLAY,
  type InvoiceDisplayOptions,
  type InvoiceLayout,
  type InvoiceStampAlign,
  isInvoiceStampAlign,
} from "@/config/invoice";
import { DEFAULT_COUNTRY_CODE, getCountry, type CountryConfig } from "@/config/countries";

type Branding = {
  gymName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  stampUrl: string | null;
  primaryColor: string;
  invoiceAddress: string | null;
  invoiceEmail: string | null;
  invoicePhone: string | null;
  invoiceGstin: string | null;
  invoiceFooter: string | null;
  websiteUrl: string | null;
  memberIdPrefix: string;
  country: CountryConfig;
  invoice: InvoiceDisplayOptions;
  settings: GymSettings | undefined;
  isLoading: boolean;
};

const DEFAULT_COLOR = "#c0392b";
const defaultCountry = getCountry(DEFAULT_COUNTRY_CODE);

const BrandingContext = createContext<Branding>({
  gymName: "Gym Admin",
  logoUrl: null,
  faviconUrl: null,
  stampUrl: null,
  primaryColor: DEFAULT_COLOR,
  invoiceAddress: null,
  invoiceEmail: null,
  invoicePhone: null,
  invoiceGstin: null,
  invoiceFooter: null,
  websiteUrl: null,
  memberIdPrefix: "GYM",
  country: defaultCountry,
  invoice: { ...DEFAULT_INVOICE_DISPLAY },
  settings: undefined,
  isLoading: false,
});

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function applyThemeColor(hex: string) {
  const rgb = hexToRgb(hex) || hexToRgb(DEFAULT_COLOR)!;
  const root = document.documentElement;
  const color = `#${[rgb.r, rgb.g, rgb.b]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
  root.style.setProperty("--red", color);
  root.style.setProperty("--red-bright", color);
  root.style.setProperty(
    "--red-dim",
    `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`,
  );
  root.style.setProperty(
    "--red-glow",
    `rgba(${rgb.r},${rgb.g},${rgb.b},0.12)`,
  );
}

function setFavicon(url: string | null) {
  if (typeof document === "undefined") return;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!url) return;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

function resolveInvoiceOptions(settings?: GymSettings): InvoiceDisplayOptions {
  const layout = (settings?.invoiceLayout ||
    DEFAULT_INVOICE_DISPLAY.layout) as InvoiceLayout;
  const stampAlign: InvoiceStampAlign = isInvoiceStampAlign(
    settings?.invoiceStampAlign,
  )
    ? settings!.invoiceStampAlign!
    : DEFAULT_INVOICE_DISPLAY.stampAlign;
  return {
    layout:
      layout === "modern" || layout === "minimal" || layout === "classic"
        ? layout
        : "classic",
    showLogo: settings?.invoiceShowLogo !== false,
    showStamp: settings?.invoiceShowStamp !== false,
    showGstin: settings?.invoiceShowGstin !== false,
    showAddress: settings?.invoiceShowAddress !== false,
    showContact: settings?.invoiceShowContact !== false,
    stampAlign,
  };
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const enabled = Boolean(isAuthenticated && user?.companyId);
  const { data: settings, isLoading } = useGymSettings(enabled);

  const value = useMemo<Branding>(() => {
    const gymName =
      settings?.gymName?.trim() ||
      user?.companyName?.trim() ||
      "Gym Admin";
    return {
      gymName,
      logoUrl: settings?.logoUrl ?? null,
      faviconUrl: settings?.faviconUrl ?? null,
      stampUrl: settings?.stampUrl ?? null,
      primaryColor: settings?.primaryColor || DEFAULT_COLOR,
      invoiceAddress: settings?.invoiceAddress ?? null,
      invoiceEmail: settings?.invoiceEmail ?? null,
      invoicePhone: settings?.invoicePhone ?? null,
      invoiceGstin: settings?.invoiceGstin ?? null,
      invoiceFooter: settings?.invoiceFooter ?? null,
      websiteUrl: settings?.websiteUrl ?? null,
      memberIdPrefix: settings?.memberIdPrefix || "GYM",
      country: getCountry(settings?.countryCode),
      invoice: resolveInvoiceOptions(settings),
      settings,
      isLoading,
    };
  }, [settings, user?.companyName, isLoading]);

  useEffect(() => {
    if (!enabled) return;
    applyThemeColor(value.primaryColor);
    setFavicon(value.faviconUrl || value.logoUrl);
    if (value.gymName) {
      document.title = `${value.gymName} · CRM`;
    }
  }, [
    enabled,
    value.primaryColor,
    value.faviconUrl,
    value.logoUrl,
    value.gymName,
  ]);

  return (
    <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
