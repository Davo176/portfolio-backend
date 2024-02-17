CREATE TABLE IF NOT EXISTS "urls" (
	"shortCode" varchar(10) PRIMARY KEY NOT NULL,
	"redirectUrl" varchar NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shortCode_idx" ON "urls" ("shortCode");