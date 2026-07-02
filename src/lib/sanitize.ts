import xss, { IFilterXSSOptions } from "xss";

const xssOptions: IFilterXSSOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
};

export const sanitize = (input: string): string => {
  if (!input || typeof input !== "string") return "";
  return xss(input.trim(), xssOptions);
};

export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitize(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitize(item) : item,
      );
    } else if (value !== null && typeof value === "object") {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
};

export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

export function sanitizeAnswers(
  answers: Record<string, string>,
  fields: { id: string; field_type: string }[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of fields) {
    const value = answers[field.id];
    if (value == null) continue;
    if (field.field_type === "email") {
      result[field.id] = sanitizeEmail(value);
    } else {
      result[field.id] = sanitize(value);
    }
  }
  return result;
}
