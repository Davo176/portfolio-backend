import { pgTable, index, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const table = pgTable(
  "urls",
  {
    short_code: varchar("shortCode", { length: 10 }).notNull().primaryKey(),
    redirect_url: varchar("redirectUrl").notNull(),
  },
  (table) => {
    return {
      shortCodeIdx: index("shortCode_idx").on(table.short_code),
    };
  }
);

export const insertSchema = createInsertSchema(table, {
  short_code: z
    .string()
    .max(10, { message: "Must be less than 10 chars long" }),
  redirect_url: z.string(),
});
