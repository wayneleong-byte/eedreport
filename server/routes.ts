import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { storage } from "./storage";
import { insertSectionSchema, insertItemSchema } from "@shared/schema";
import { z } from "zod";

// Single-secret authorization. Server checks the x-edit-secret header against
// EED_EDIT_SECRET environment variable. No hardcoded fallback — if the env var
// is not set the server refuses all mutations, making the app safe-by-default.
function expectedSecret(): string | undefined {
  return process.env.EED_EDIT_SECRET;
}

function requireEditSecret(req: Request, res: Response, next: NextFunction) {
  const secret = expectedSecret();
  if (!secret) return res.status(503).json({ error: "editor not configured" });
  const provided = req.header("x-edit-secret");
  if (provided && provided === secret) return next();
  return res.status(401).json({ error: "unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // --- Public read endpoints ---
  app.get("/api/report", async (_req, res) => {
    const [sections, items] = await Promise.all([
      storage.getSections(),
      storage.getItems(),
    ]);
    const itemViews = items.map((it) => ({
      ...it,
      images: safeParseImages(it.images),
    }));
    res.json({ sections, items: itemViews });
  });

  // --- Auth check (for editor mode UI) ---
  app.post("/api/auth/check", requireEditSecret, (_req, res) => {
    res.json({ ok: true });
  });

  // --- Section mutations ---
  app.post("/api/sections", requireEditSecret, (req, res) => {
    const parsed = insertSectionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    storage.createSection(parsed.data).then((s) => res.status(201).json(s));
  });

  app.patch("/api/sections/:id", requireEditSecret, (req, res) => {
    const id = Number(req.params.id);
    const parsed = insertSectionSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    storage.updateSection(id, parsed.data).then((s) =>
      s ? res.json(s) : res.status(404).json({ error: "not found" })
    );
  });

  app.delete("/api/sections/:id", requireEditSecret, (req, res) => {
    storage.deleteSection(Number(req.params.id)).then((ok) =>
      ok ? res.json({ ok: true }) : res.status(404).json({ error: "not found" })
    );
  });

  // --- Item mutations ---
  // Accept images as an array from the client; store as JSON text.
  const itemBodySchema = insertItemSchema.extend({
    images: z.array(z.string()).max(8).optional(),
  });

  app.post("/api/items", requireEditSecret, (req, res) => {
    const parsed = itemBodySchema.safeParse(normalizeItemBody(req.body));
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { images, ...rest } = parsed.data as any;
    storage
      .createItem({ ...rest, images: JSON.stringify(images ?? []) })
      .then((it) => res.status(201).json({ ...it, images: safeParseImages(it.images) }));
  });

  app.patch("/api/items/:id", requireEditSecret, (req, res) => {
    const id = Number(req.params.id);
    const parsed = itemBodySchema.partial().safeParse(normalizeItemBody(req.body));
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const data: any = { ...parsed.data };
    if (Array.isArray(data.images)) data.images = JSON.stringify(data.images);
    storage.updateItem(id, data).then((it) =>
      it ? res.json({ ...it, images: safeParseImages(it.images) }) : res.status(404).json({ error: "not found" })
    );
  });

  app.delete("/api/items/:id", requireEditSecret, (req, res) => {
    storage.deleteItem(Number(req.params.id)).then((ok) =>
      ok ? res.json({ ok: true }) : res.status(404).json({ error: "not found" })
    );
  });

  return httpServer;
}

function safeParseImages(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : [];
  } catch {
    return [];
  }
}

// Ensure sectionId is a number when sent from the client.
function normalizeItemBody(body: any) {
  if (body && body.sectionId != null) {
    return { ...body, sectionId: Number(body.sectionId) };
  }
  return body;
}
