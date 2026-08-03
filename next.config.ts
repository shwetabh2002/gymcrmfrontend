import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pin Turbopack to this app. A parent GYM/package-lock.json otherwise makes
// Next treat the whole monorepo as workspace root and blow RAM (10–40GB).
const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root },
};

export default nextConfig;
