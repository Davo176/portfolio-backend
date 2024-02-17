import express from "express";
import * as urls from "../../db/schema/urls";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { authenticateToken } from "../../auth";

const UrlRouter = express.Router();

const queryClient = postgres(process.env.DATABASE_URL || "", { max: 1 });
const db = drizzle(queryClient, { schema: { ...urls } });

UrlRouter.post("/shorten", authenticateToken, async (req, res) => {
  const originalUrl = req.body.url;
  const shortCode = req.body.shortcode;

  console.log("Got request for", shortCode, originalUrl);

  try {
    const model = urls.insertSchema.parse({
      short_code: shortCode,
      redirect_url: originalUrl,
    });

    let result = await db
      .insert(urls.table)
      .values(model)
      .onConflictDoUpdate({
        target: urls.table.short_code,
        set: { redirect_url: originalUrl },
      });
    console.log(result);

    if (result) {
      res.json({ originalUrl, shortCode });
    } else {
      res.status(500).send();
    }
  } catch (err) {
    res.status(400).send();
  }
});

export { UrlRouter };
