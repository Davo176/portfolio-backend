import "dotenv/config";
import type { Config } from "drizzle-kit";
export default {
  schema: "./db/schema",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    host: process.env.PGHOST || "",
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE || "",
  },
} satisfies Config;
