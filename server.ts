import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NightingaleRouter } from "./nightingale/routes";
import express from "express";
import cors from "cors";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { z } from "zod";

const app = express();
app.use(express.json());
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://w-davis.com",
    "http://127.0.0.1:5173",
  ],
};

app.use(cors(corsOptions));

const migrationClient = postgres(process.env.DATABASE_URL || "", { max: 1 });
migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });

const port = process.env.port;
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

app.get("/", (req, res) => {
  res.send("Hello World!");
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
    console.log(`Listening on port ${port}`);
  }
);
