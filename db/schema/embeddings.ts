import { customType, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { customVector } from "@useverk/drizzle-pgvector";

export const embeddings = pgTable("embeddings", {
  id: uuid("id").primaryKey(),
  content: varchar("content").notNull(),
  embedding: customVector("embedding"),
});
