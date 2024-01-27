CREATE TABLE IF NOT EXISTS "embeddings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content" varchar NOT NULL,
	"embedding" vector(1536)
);
