require("dotenv").config();
import { NightingaleRouter } from "./nightingale/routes";
import express from "express";
import cors from "cors";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const app = express();
app.use(express.json());
app.use(cors());

const migrationClient = postgres(process.env.DATABASE_URL || "", { max: 1 });
migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });

const port = 8080;

app.use("/nightingale", NightingaleRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(
  parseInt(process.env.PORT || "3999"),
  process.env.HOST || "0.0.0.0",
  () => {
    console.log(`Listening on port ${port}`);
  }
);
