import { z } from "zod";

/**
 * Server-side input validation for every mutating endpoint.
 * The frontend validates for UX; these schemas are the real gate.
 */
const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => /^https?:\/\//i.test(v), { message: "URL must start with http:// or https://" });

export const loginSchema = z.object({
  email: z.string().trim().email().max(190),
  password: z.string().min(8).max(120),
});

export const matchSchema = z.object({
  sportId: z.number().int().positive(),
  competitionId: z.number().int().positive(),
  homeTeamId: z.number().int().positive(),
  awayTeamId: z.number().int().positive(),
  kickoffAt: z.string().min(10).max(40),
  status: z.enum(["scheduled", "live", "finished", "postponed"]),
  homeScore: z.number().int().min(0).max(99).nullable().optional(),
  awayScore: z.number().int().min(0).max(99).nullable().optional(),
  venue: z.string().trim().max(160).nullable().optional(),
  descriptionAr: z.string().max(4000).nullable().optional(),
  descriptionEn: z.string().max(4000).nullable().optional(),
  featured: z.boolean().optional(),
});

export const streamSchema = z.object({
  matchId: z.number().int().positive(),
  label: z.string().trim().min(1).max(120),
  type: z.enum(["hls", "mp4", "embed"]),
  url: httpUrl,
  priority: z.number().int().min(0).max(1000).optional(),
  enabled: z.boolean().optional(),
  startsAt: z.string().max(40).nullable().optional(),
  endsAt: z.string().max(40).nullable().optional(),
  unavailableMessageAr: z.string().max(500).nullable().optional(),
  unavailableMessageEn: z.string().max(500).nullable().optional(),
});

export const newsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and dashes"),
  titleAr: z.string().trim().min(3).max(240),
  titleEn: z.string().trim().min(3).max(240),
  excerptAr: z.string().max(600).nullable().optional(),
  excerptEn: z.string().max(600).nullable().optional(),
  contentAr: z.string().max(20000).nullable().optional(),
  contentEn: z.string().max(20000).nullable().optional(),
  imageUrl: httpUrl.nullable().optional(),
  category: z.enum(["football", "international", "transfers", "competitions", "events"]),
  sourceName: z.string().trim().max(160).nullable().optional(),
  sourceUrl: httpUrl.nullable().optional(),
  published: z.boolean().optional(),
});

export const adSettingsSchema = z.object({
  enabled: z.boolean(),
  demoDurationSec: z.number().int().min(3).max(60),
  skipAfterSec: z.number().int().min(0).max(60),
  vastTagUrl: httpUrl.nullable().optional(),
  fallbackPolicy: z.enum(["allow", "block"]),
});

export const siteSettingsSchema = z.object({
  siteNameAr: z.string().trim().min(2).max(120),
  siteNameEn: z.string().trim().min(2).max(120),
  taglineAr: z.string().max(240).nullable().optional(),
  taglineEn: z.string().max(240).nullable().optional(),
  defaultLocale: z.enum(["ar", "en"]),
  contactEmail: z.string().trim().email().max(190).nullable().optional(),
  twitterUrl: httpUrl.nullable().optional(),
  youtubeUrl: httpUrl.nullable().optional(),
  facebookUrl: httpUrl.nullable().optional(),
  instagramUrl: httpUrl.nullable().optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(140),
  email: z.string().trim().email().max(190),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(4000),
});

export function parseBody<T>(schema: z.ZodType<T>, data: unknown):
  | { ok: true; data: T }
  | { ok: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { ok: false, errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  return { ok: true, data: result.data };
}
