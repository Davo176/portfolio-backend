import express from "express";
import OpenAI from "openai";
import * as embeddings from "../../db/schema/embeddings";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { z } from "zod";

const NightingaleRouter = express.Router();

const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(content: string) {
  const embeddingResponse = await openAi.embeddings.create({
    input: content,
    model: "text-embedding-ada-002",
  });
  const embedding = embeddingResponse.data[0].embedding;
  return embedding;
}

async function answerQuestion(question: string, information: string) {
  //work out how to handle multiple questions
  const chatResponse = await openAi.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are Will Davis's personal hype-man. Recruiters will ask you questions, Will will provide you with the information required to answer those questions. Don't be too over the top, but never downplay Will's abilities. You do not have to use all the information provided and should strive to be consise",
      },
      {
        role: "system",
        content: `All questions asked will be about Will Davis, or his work and projects. Respond with only the answer to that message. You can use information received in different questions to answer new questions.`,
      },
      {
        role: "user",
        content: `Recruitors question: ${question}? Information from Will: ${information}`,
      },
    ],
    temperature: 0.1,
  });

  return chatResponse;
}

// for query purposes
const queryClient = postgres(process.env.DATABASE_URL || "", { max: 1 });
const db = drizzle(queryClient, { schema: { ...embeddings } });

NightingaleRouter.post("/answer", async (req, res) => {
  let input = req.body;
  const queryEmbedding = await generateEmbedding(input.content);

  const query = sql`
  select
    embeddings.id,
    embeddings.content,
    1 - (embeddings.embedding <=> ${
      "[" + queryEmbedding.join(",") + "]"
    }) as similarity
  from embeddings
  order by similarity desc
  limit 2;
  `;

  let documents = await db.execute(query);
  console.log(documents);
  let relevent_information = documents.map((doc) => doc.content).join(", ");
  console.log(relevent_information);

  const response = await answerQuestion(input.text, relevent_information);
  console.log(response.choices);

  res.send(response.choices[0]?.message?.content);
});

NightingaleRouter.get("/content", async (req, res) => {
  res.send(db.select().from(embeddings.table));
});

NightingaleRouter.post("/content", async (req, res) => {
  let input = req.body;
  try {
    const schema = z.string();
    let content = schema.parse(input.content);
    const contents_embedding = await generateEmbedding(content);

    try {
      const model = embeddings.insertSchema.parse({
        id: input.id,
        content: content,
        embedding: contents_embedding,
      });

      const response = await db
        .insert(embeddings.table)
        .values(model)
        .onConflictDoUpdate({
          target: embeddings.table.id,
          set: {
            content: model.content,
            embedding: model.embedding,
          },
        });
      res.send(response);
    } catch {
      res.status(500);
    }
  } catch {
    res.status(500).send("no content");
  }
});

export { NightingaleRouter };
