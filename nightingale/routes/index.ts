import express from "express";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import OpenAI from "openai";
import * as embeddings from "../../db/schema/embeddings";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authenticateToken } from "../../auth";
const NightingaleRouter = express.Router();

const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(content: string) {
  const embeddingResponse = await openAi.embeddings
    .create({
      input: content,
      model: "text-embedding-ada-002",
    })
    .catch((err) => {
      console.log(err);
      throw new Error();
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
          "You are a virtual assistant on Will Davis's Personal Portfolio. Recruiters will ask you questions, Will will provide you with the information required to answer those questions. Don't be too over the top, but never downplay Will's abilities. You do not have to use all the information provided and should strive to be consise",
      },
      {
        role: "system",
        content: `A Recruiter may ask a question that isn't about Will, or the answer isn't obvious from the information given. Please be polite and try and keep up conversation, but redirect the conversation back to being about Will.`,
      },
      {
        role: "system",
        content: `Will Thinks this information will help you answer the question: ${information}`,
      },
      {
        role: "user",
        content: `${question}`,
      },
    ],
    temperature: 0.3,
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
  where archived is false
  order by similarity desc
  limit 5;
  `;

  let documents = await db.execute(query);
  console.log(documents);
  let relevent_information = documents.map((doc) => doc.content).join(", ");
  console.log(relevent_information);

  const response = await answerQuestion(input.content, relevent_information);
  console.log(response.choices);

  let answer = response.choices[0].message.content;

  res.send({
    documents: relevent_information,
    answer: answer,
  });
});

NightingaleRouter.get("/content", authenticateToken, async (req, res) => {
  res.send(
    await db
      .select()
      .from(embeddings.table)
      .where(eq(embeddings.table.archived, false))
  );
});

NightingaleRouter.post("/content", authenticateToken, async (req, res) => {
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
    res.status(400).send("no content");
  }
});

NightingaleRouter.delete("/content", authenticateToken, async (req, res) => {
  let input = req.body;
  const id = input.id;
  const schema = z.string().uuid();
  try {
    schema.parse(id);
    await db
      .update(embeddings.table)
      .set({ archived: true })
      .where(eq(embeddings.table.id, id));
    res.status(200).send("Deleted");
  } catch {
    res.status(400).send("no id");
  }
});

export { NightingaleRouter };
