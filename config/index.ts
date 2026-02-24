// Validate required env variables
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in environment variables");
}

export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Gym Admin",
};