import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NightingaleRouter } from "./nightingale/routes";
import { UrlRouter } from "./url-shortner/routes";
import express from "express";
import cors from "cors";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { z } from "zod";
import * as urls from "./db/schema/urls";
import { eq } from "drizzle-orm";

const app = express();
app.use(express.json());
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://w-davis.com",
    "https://www.w-davis.com",
    "http://127.0.0.1:5173",
  ],
};

app.use(cors(corsOptions));

const migrationClient = postgres(process.env.DATABASE_URL || "", { max: 1 });
migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });
const queryClient = postgres(process.env.DATABASE_URL || "", { max: 1 });
const db = drizzle(queryClient, { schema: { ...urls } });

//this cant be behind auth
app.get("/s/:shortCode", async (req, res) => {
  const shortCode: string = req.params.shortCode;
  const url_obj = (
    await db
      .select()
      .from(urls.table)
      .where(eq(urls.table.short_code, shortCode))
      .limit(1)
  )[0];

  const redirect_url = url_obj.redirect_url;

  if (redirect_url) {
    res.redirect(redirect_url);
  } else {
    res.status(404).send("Not Found");
  }
});

app.use("/", (req, res, next) => {
  const schema = z.string();
  try {
    schema.parse(req.headers["x-wd-api-key"]);
    if (req.headers["x-wd-api-key"] !== process.env.API_KEY) {
      res.status(403).send("Unauthorised");
    }
    next();
  } catch {
    res.status(403).send("Missing API Key");
  }
});

app.use("/nightingale", NightingaleRouter);
app.use("/url", UrlRouter);

app.get("/health", (req, res) => {
  res.status(200).send("All Good");
});

app.post("/login", (req, res) => {
  const { password } = req.body;
  const hash = process.env.PASSWORD_HASH as string;

  if (!bcrypt.compareSync(password, hash)) {
    res.send(401).json({ message: "Invalid Password" });
  }
  const token = jwt.sign(
    { user: "will_davis" },
    `${process.env.JWT_SIGNING_KEY}`,
    { expiresIn: "1h" }
  );
  res.send({ token });
});

app.listen(
  parseInt(process.env.PORT || "3999"),
  process.env.HOST || "0.0.0.0",
  () => {
    console.log(`Listening on port ${process.env.PORT}`);
  }
);
