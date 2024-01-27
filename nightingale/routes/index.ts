import express from "express";

const NightingaleRouter = express.Router();

const { OpenAI } = require("openai");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

const openAi = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function generateEmbeddings(content) {
  const embeddingResponse = await openAi.embeddings.create({
    input: content,
    model: "text-embedding-ada-002",
  });
  const embedding = embeddingResponse.data[0].embedding;
  return embedding;
}

async function answerQuestion(question, information) {
  //work out how to handle multiple questions
  const chatResponse = await openAi.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are Will Davis's personal hype-man. Recruiters will ask you questions, Will will provide you with the information required to answer those questions. Don't be too over the top, but never downplay Will's abilities.",
      },
      {
        role: "system",
        content: `All questions asked will be about Will Davis, or his work and projects.
            Respond with only the answer to that message. You can use information received in different questions to answer new questions.
          `,
      },
      {
        role: "user",
        content: `Recruitors question: ${question}?
  
          Information from Will: ${information}
          `,
      },
    ],
    temperature: 0,
  });

  return chatResponse;
}

NightingaleRouter.post("/", async (req, res) => {
  let input = req.body;
  const x = await generateEmbeddings(input.content);

  const { data: documents } = await supabase.rpc("match_documents", {
    query_embedding: x,
    match_threshold: 0.75,
    match_count: 5,
    c_id: "a948d675-9afa-4cb9-b986-4c4ed7b68ca8",
  });

  let relevent_information = documents.map((doc) => doc.content).join(", ");

  const response = await answerQuestion(input.text, relevent_information);
  console.log(response.choices);

  res.send(response.choices[0]?.message?.content);
});

export { NightingaleRouter };
