import { z } from "zod";

const value = z.string().trim().min(1).max(160).regex(/^[\p{L}\p{N}._~+\- ]+$/u);

export const attributionSchema = z.object({
  source: value.optional(),
  medium: value.optional(),
  campaign: value.optional(),
  content: value.optional(),
  term: value.optional(),
  gclid: value.max(200).optional(),
  gbraid: value.max(200).optional(),
  wbraid: value.max(200).optional(),
}).strict();

export type Attribution = z.infer<typeof attributionSchema>;

export function parseAttribution(value: unknown): Attribution {
  const parsed = attributionSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}
