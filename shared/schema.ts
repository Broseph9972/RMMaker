import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  width: integer("width").notNull().default(10),
  height: integer("height").notNull().default(10),
  cubeType: text("cube_type").notNull().default("3x3"),
  mosaicData: jsonb("mosaic_data").notNull(),
  colorPalette: text("color_palette").notNull().default("standard"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type CubeType = "2x2" | "3x3" | "4x4";

export type StickerColor = string;

export type CubeFace = {
  stickers: StickerColor[][];
};

export type MosaicCube = {
  face: CubeFace;
  position: { row: number; col: number };
};

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  cubes: MosaicCube[];
};

export type MosaicData = {
  width: number;
  height: number;
  cubeType: CubeType;
  cubes: MosaicCube[];
};
