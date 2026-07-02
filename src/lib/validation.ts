import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .max(254, "Email must be less than 254 characters")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be less than 128 characters");

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters");

export const titleSchema = z
  .string()
  .min(1, "Title is required")
  .max(200, "Title must be less than 200 characters");

export const descriptionSchema = z
  .string()
  .max(2000, "Description must be less than 2000 characters")
  .optional()
  .or(z.literal(""));

export const fieldLabelSchema = z
  .string()
  .min(1, "Field label is required")
  .max(200, "Field label must be less than 200 characters");

export const fieldPlaceholderSchema = z
  .string()
  .max(200, "Placeholder must be less than 200 characters")
  .optional()
  .or(z.literal(""));

export const optionTextSchema = z
  .string()
  .max(200, "Option text must be less than 200 characters");

export const authFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type AuthFormData = z.infer<typeof authFormSchema>;

export const builderFieldSchema = z.object({
  id: z.string(),
  field_label: fieldLabelSchema,
  field_type: z.string(),
  placeholder: fieldPlaceholderSchema,
  options: z.array(z.string()),
  is_required: z.boolean(),
  sort_order: z.number(),
});

export const formBuilderSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  fields: z.array(builderFieldSchema),
});

export type FormBuilderData = z.infer<typeof formBuilderSchema>;

export const pollOptionSchema = z.object({
  text: optionTextSchema,
});

export const pollBuilderSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  options: z.array(pollOptionSchema).min(2, "Add at least 2 options"),
});

export type PollBuilderData = z.infer<typeof pollBuilderSchema>;

export const publicFormFieldSchema = z.object({
  id: z.string(),
  field_label: z.string(),
  field_type: z.string(),
  is_required: z.boolean(),
});

export const dynamicAnswerSchema = z
  .string()
  .max(5000, "Answer must be less than 5000 characters");

export const dynamicEmailAnswerSchema = emailSchema;

export const dynamicNumberAnswerSchema = z
  .string()
  .regex(/^-?\d*\.?\d*$/, "Please enter a valid number")
  .max(50, "Number must be less than 50 characters")
  .optional()
  .or(z.literal(""));

export const getFieldAnswerSchema = (fieldType: string, isRequired: boolean) => {
  let schema = dynamicAnswerSchema;
  if (fieldType === "email") schema = dynamicEmailAnswerSchema;
  if (fieldType === "number") schema = dynamicNumberAnswerSchema;

  if (isRequired) {
    return schema.min(1, "This field is required");
  }
  return schema.optional().or(z.literal(""));
};

export function validateFields(
  fields: { id: string; field_label: string; field_type: string; is_required: boolean }[],
  answers: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = answers[field.id] || "";
    const schema = getFieldAnswerSchema(field.field_type, field.is_required);
    const result = schema.safeParse(value);
    if (!result.success) {
      errors[field.id] = result.error.issues[0]?.message || "Invalid value";
    }
  }
  return errors;
}

export const getFirstError = (error: z.ZodError): string =>
  error.issues[0]?.message || "Validation failed";

export const getFieldErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  error.issues.forEach((err) => {
    const path = err.path.join(".");
    if (!errors[path]) errors[path] = err.message;
  });
  return errors;
};
