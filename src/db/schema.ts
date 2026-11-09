import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums (MongoDB-equivalent: validated string unions)                */
/* ------------------------------------------------------------------ */
export const userRoleEnum = pgEnum("user_role", ["admin", "editor"]);
export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
  "postponed",
]);
export const streamTypeEnum = pgEnum("stream_type", ["hls", "mp4", "embed"]);
export const streamHealthEnum = pgEnum("stream_health", ["unknown", "online", "offline"]);
export const newsCategoryEnum = pgEnum("news_category", [
  "football",
  "international",
  "transfers",
  "competitions",
  "events",
]);

/* ------------------------------------------------------------------ */
/* Sports taxonomy                                                    */
/* ------------------------------------------------------------------ */
export const sports = pgTable("sports", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 120 }).notNull(),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  icon: varchar("icon", { length: 60 }).notNull().default("trophy"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  sportId: integer("sport_id")
    .notNull()
    .references(() => sports.id, { onDelete: "cascade" }),
  nameAr: varchar("name_ar", { length: 160 }).notNull(),
  nameEn: varchar("name_en", { length: 160 }).notNull(),
  country: varchar("country", { length: 80 }),
  color: varchar("color", { length: 9 }).notNull().default("#16C784"),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  nameAr: varchar("name_ar", { length: 160 }).notNull(),
  nameEn: varchar("name_en", { length: 160 }).notNull(),
  shortCode: varchar("short_code", { length: 6 }).notNull(),
  color: varchar("color", { length: 9 }).notNull().default("#16C784"),
  country: varchar("country", { length: 80 }),
});

/* ------------------------------------------------------------------ */
/* Admin users                                                        */
/* ------------------------------------------------------------------ */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 190 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

/* ------------------------------------------------------------------ */
/* Matches                                                            */
/* ------------------------------------------------------------------ */
export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    sportId: integer("sport_id")
      .notNull()
      .references(() => sports.id, { onDelete: "cascade" }),
    competitionId: integer("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    homeTeamId: integer("home_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    awayTeamId: integer("away_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
    status: matchStatusEnum("status").notNull().default("scheduled"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    venue: varchar("venue", { length: 160 }),
    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("matches_kickoff_idx").on(t.kickoffAt), index("matches_status_idx").on(t.status)],
);

/* ------------------------------------------------------------------ */
/* Streams (authorized sources assigned to matches)                   */
/* ------------------------------------------------------------------ */
export const streams = pgTable("streams", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 120 }).notNull().default("Main"),
  type: streamTypeEnum("type").notNull().default("hls"),
  url: text("url").notNull(),
  priority: integer("priority").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  health: streamHealthEnum("health").notNull().default("unknown"),
  unavailableMessageAr: text("unavailable_message_ar"),
  unavailableMessageEn: text("unavailable_message_en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* News                                                               */
/* ------------------------------------------------------------------ */
export const newsArticles = pgTable(
  "news_articles",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 220 }).notNull().unique(),
    titleAr: varchar("title_ar", { length: 240 }).notNull(),
    titleEn: varchar("title_en", { length: 240 }).notNull(),
    excerptAr: text("excerpt_ar"),
    excerptEn: text("excerpt_en"),
    contentAr: text("content_ar"),
    contentEn: text("content_en"),
    imageUrl: text("image_url"),
    category: newsCategoryEnum("category").notNull().default("football"),
    sourceName: varchar("source_name", { length: 160 }),
    sourceUrl: text("source_url"),
    published: boolean("published").notNull().default(true),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("news_published_idx").on(t.publishedAt)],
);

/* ------------------------------------------------------------------ */
/* Advertising configuration (singleton row)                          */
/* ------------------------------------------------------------------ */
export const adSettings = pgTable("ad_settings", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  demoDurationSec: integer("demo_duration_sec").notNull().default(8),
  skipAfterSec: integer("skip_after_sec").notNull().default(5),
  vastTagUrl: text("vast_tag_url"),
  fallbackPolicy: varchar("fallback_policy", { length: 10 }).notNull().default("allow"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Site settings (singleton row)                                      */
/* ------------------------------------------------------------------ */
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteNameAr: varchar("site_name_ar", { length: 120 }).notNull().default("مراد جول"),
  siteNameEn: varchar("site_name_en", { length: 120 }).notNull().default("Mourad Goal"),
  taglineAr: varchar("tagline_ar", { length: 240 }),
  taglineEn: varchar("tagline_en", { length: 240 }),
  defaultLocale: varchar("default_locale", { length: 2 }).notNull().default("ar"),
  contactEmail: varchar("contact_email", { length: 190 }),
  twitterUrl: text("twitter_url"),
  youtubeUrl: text("youtube_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Security audit logs                                                */
/* ------------------------------------------------------------------ */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    userEmail: varchar("user_email", { length: 190 }),
    action: varchar("action", { length: 60 }).notNull(),
    entity: varchar("entity", { length: 60 }).notNull(),
    entityId: varchar("entity_id", { length: 40 }),
    meta: jsonb("meta"),
    ip: varchar("ip", { length: 60 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Contact messages                                                   */
/* ------------------------------------------------------------------ */
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  email: varchar("email", { length: 190 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* Inferred types (the "Mongoose model" equivalents) */
export type Sport = typeof sports.$inferSelect;
export type Competition = typeof competitions.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type User = typeof users.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Stream = typeof streams.$inferSelect;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type AdSettings = typeof adSettings.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AdminRole = "admin" | "editor";
export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";
export type StreamType = "hls" | "mp4" | "embed";
export type NewsCategory = "football" | "international" | "transfers" | "competitions" | "events";
