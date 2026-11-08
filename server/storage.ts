import { sections, items } from '@shared/schema';
import type { Section, InsertSection, Item, InsertItem } from '@shared/schema';
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, asc } from "drizzle-orm";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { seedData } from "./seed";
import liveSnapshot from "./live-snapshot.json";

const dbPath =
  process.env.DATABASE_PATH || process.env.SQLITE_PATH || "data.db";
mkdirSync(dirname(dbPath) === "." ? "." : dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Ensure tables exist (lightweight bootstrap; avoids requiring a migration step)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    anchor TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    meta TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '',
    images TEXT NOT NULL DEFAULT '[]',
    audio_url TEXT NOT NULL DEFAULT '',
    video_url TEXT NOT NULL DEFAULT '',
    attachment_url TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0
  );
`);

export const db = drizzle(sqlite);

export interface IStorage {
  getSections(): Promise<Section[]>;
  getItems(): Promise<Item[]>;
  createSection(s: InsertSection): Promise<Section>;
  updateSection(id: number, s: Partial<InsertSection>): Promise<Section | undefined>;
  deleteSection(id: number): Promise<boolean>;
  createItem(i: InsertItem): Promise<Item>;
  updateItem(id: number, i: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getSections(): Promise<Section[]> {
    return db.select().from(sections).orderBy(asc(sections.position), asc(sections.id)).all();
  }
  async getItems(): Promise<Item[]> {
    return db.select().from(items).orderBy(asc(items.position), asc(items.id)).all();
  }
  async createSection(s: InsertSection): Promise<Section> {
    return db.insert(sections).values(s).returning().get();
  }
  async updateSection(id: number, s: Partial<InsertSection>): Promise<Section | undefined> {
    return db.update(sections).set(s).where(eq(sections.id, id)).returning().get();
  }
  async deleteSection(id: number): Promise<boolean> {
    db.delete(items).where(eq(items.sectionId, id)).run();
    const r = db.delete(sections).where(eq(sections.id, id)).run();
    return r.changes > 0;
  }
  async createItem(i: InsertItem): Promise<Item> {
    return db.insert(items).values(i).returning().get();
  }
  async updateItem(id: number, i: Partial<InsertItem>): Promise<Item | undefined> {
    return db.update(items).set(i).where(eq(items.id, id)).returning().get();
  }
  async deleteItem(id: number): Promise<boolean> {
    const r = db.delete(items).where(eq(items.id, id)).run();
    return r.changes > 0;
  }
}

export const storage = new DatabaseStorage();

// Seed on first run if the database is empty
(function seedIfEmpty() {
  const count = db.select().from(sections).all().length;
  if (count > 0) return;
  // Prefer the latest exported live content (keeps original IDs) over demo seed.
  const snap = liveSnapshot as any;
  if (snap && Array.isArray(snap.sections) && snap.sections.length > 0) {
    const tx = sqlite.transaction(() => {
      for (const s of snap.sections) {
        db.insert(sections).values({ id: s.id, title: s.title, anchor: s.anchor ?? "", position: s.position ?? 0 }).run();
      }
      for (const it of snap.items ?? []) {
        db.insert(items).values({
          id: it.id, sectionId: it.sectionId, title: it.title, meta: it.meta ?? "",
          description: it.description ?? "", status: it.status ?? "",
          images: JSON.stringify(Array.isArray(it.images) ? it.images : []),
          audioUrl: it.audioUrl ?? "", videoUrl: it.videoUrl ?? "", attachmentUrl: it.attachmentUrl ?? "",
          position: it.position ?? 0,
        }).run();
      }
    });
    tx();
    return;
  }
  for (const sec of seedData) {
    const created = db.insert(sections).values({
      title: sec.title,
      anchor: sec.anchor,
      position: sec.position,
    }).returning().get();
    sec.items.forEach((it, idx) => {
      db.insert(items).values({
        sectionId: created.id,
        title: it.title,
        meta: it.meta ?? "",
        description: it.description ?? "",
        status: it.status ?? "",
        images: "[]",
        audioUrl: "",
        videoUrl: "",
        attachmentUrl: "",
        position: idx,
      }).run();
    });
  }
})();
