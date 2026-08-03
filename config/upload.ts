/**
 * Upload policy — mirror of backend `src/config/upload.config.ts`.
 * Change here for FE client-side checks; backend enforces the same values in code.
 */
export type UploadLimits = {
  maxFileBytes: number;
  maxFileMb: number;
  allowedMimeTypes: string[];
};

/** Max image size for branding + member photos */
export const UPLOAD_MAX_FILE_BYTES = 1 * 1024 * 1024; // 1 MB

export const UPLOAD_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
] as const;

export const UPLOAD_CONFIG: UploadLimits = {
  maxFileBytes: UPLOAD_MAX_FILE_BYTES,
  maxFileMb: Math.round((UPLOAD_MAX_FILE_BYTES / (1024 * 1024)) * 100) / 100,
  allowedMimeTypes: [...UPLOAD_ALLOWED_MIME_TYPES],
};

export const UPLOAD_ACCEPT = UPLOAD_ALLOWED_MIME_TYPES.join(",");
