import { z } from "zod";

export const SCHOOL_CONTACT_EMAIL = "support@cvunfold.com";

export const schoolContactSchema = z.object({
  name: z.string().trim().min(2).max(120).regex(/^[^\r\n]+$/),
  email: z.string().trim().email().max(254).regex(/^[^\r\n]+$/),
  school: z.string().trim().min(2).max(160).regex(/^[^\r\n]+$/),
  phone: z.string().trim().max(40).regex(/^[+\d\s().-]*$/).default(""),
  message: z.string().trim().max(4000).default(""),
  website: z.string().max(200).default(""),
  turnstileToken: z.string().max(2048).default(""),
  requestId: z.string().uuid(),
}).strict();

export type SchoolContactMessage = z.infer<typeof schoolContactSchema>;
