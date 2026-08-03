import {
  UPLOAD_ACCEPT,
  UPLOAD_CONFIG,
  type UploadLimits,
} from "@/config/upload";

export type { UploadLimits };
export { UPLOAD_ACCEPT, UPLOAD_CONFIG };

/** Prefer API limits when present (from backend code config); else local UPLOAD_CONFIG. */
export function resolveUploadLimits(
  fromApi?: Partial<UploadLimits> | null,
): UploadLimits {
  if (fromApi?.maxFileBytes && fromApi.maxFileBytes > 0) {
    return {
      maxFileBytes: fromApi.maxFileBytes,
      maxFileMb:
        fromApi.maxFileMb ??
        Math.round((fromApi.maxFileBytes / (1024 * 1024)) * 100) / 100,
      allowedMimeTypes:
        fromApi.allowedMimeTypes?.length
          ? fromApi.allowedMimeTypes
          : UPLOAD_CONFIG.allowedMimeTypes,
    };
  }
  return { ...UPLOAD_CONFIG };
}

export function validateImageFile(
  file: File,
  limits: UploadLimits = UPLOAD_CONFIG,
): string | null {
  const mime = (file.type || "").toLowerCase();
  if (!limits.allowedMimeTypes.includes(mime)) {
    return `Only ${limits.allowedMimeTypes
      .map((m) => m.replace("image/", "").toUpperCase())
      .join(", ")} images are allowed`;
  }
  if (file.size > limits.maxFileBytes) {
    return `Image must be under ${limits.maxFileMb}MB`;
  }
  return null;
}
