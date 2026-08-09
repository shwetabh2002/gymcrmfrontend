import { requestService } from "../request/requestServcie";
import { API_CONFIG } from "@/config/config";

export type EmailTemplateRow = {
  type: string;
  label: string;
  description: string;
  /** Placeholders this template may use, e.g. ["gymName","memberName"]. */
  placeholders: string[];
  subject: string;
  body: string;
  defaultSubject: string;
  defaultBody: string;
  /** Off = this gym never sends this email. */
  enabled: boolean;
  /** True when the gym has saved its own wording. */
  customised: boolean;
};

export type EmailTemplatePreview = {
  type: string;
  subject: string;
  text: string;
  enabled: boolean;
  customised: boolean;
};

export const emailTemplatesApi = {
  list: () =>
    requestService.get<EmailTemplateRow[]>(API_CONFIG.EMAIL_TEMPLATES.BASE),

  preview: (type: string) =>
    requestService.get<EmailTemplatePreview>(
      API_CONFIG.EMAIL_TEMPLATES.PREVIEW(type),
    ),

  update: (
    type: string,
    payload: { subject?: string; body?: string; enabled?: boolean },
  ) =>
    requestService.put<EmailTemplateRow[], typeof payload>(
      API_CONFIG.EMAIL_TEMPLATES.BY_TYPE(type),
      payload,
    ),

  /** Drop the override and go back to the platform default. */
  reset: (type: string) =>
    requestService.post<EmailTemplateRow[], Record<string, never>>(
      API_CONFIG.EMAIL_TEMPLATES.RESET(type),
      {},
    ),
};
