import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sections of the EED report (e.g. 展覽中心展廳更新 / SEC_A)
export const sections = sqliteTable("sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  anchor: text("anchor").notNull().default(""), // e.g. SEC_A
  position: integer("position").notNull().default(0),
});

// Individual report items / cards
export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sectionId: integer("section_id").notNull(),
  title: text("title").notNull(),
  meta: text("meta").notNull().default(""), // subtitle / date / status line
  description: text("description").notNull().default(""),
  status: text("status").notNull().default(""), // status label e.g. READY
  images: text("images").notNull().default("[]"), // JSON array of up to 8 image URLs
  audioUrl: text("audio_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  attachmentUrl: text("attachment_url").notNull().default(""),
  position: integer("position").notNull().default(0),
});

export const insertSectionSchema = createInsertSchema(sections).omit({ id: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true });

export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sections.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// Convenience shape for the frontend: an item with parsed image array
export type ItemView = Omit<Item, "images"> & { images: string[] };
