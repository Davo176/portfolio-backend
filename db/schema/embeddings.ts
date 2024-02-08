import {
  boolean,
  customType,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { customVector } from "@useverk/drizzle-pgvector";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const table = pgTable("embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: varchar("content").notNull(),
  embedding: customVector("embedding").notNull(),
  archived: boolean("archived").notNull().default(false),
});

export const insertSchema = createInsertSchema(table, {
  embedding: z.array(z.number()),
});
