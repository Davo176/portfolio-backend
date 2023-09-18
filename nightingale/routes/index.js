const NightingaleRouter = express.Router();

import { Configuration, OpenAIApi } from "openai";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(process.env.SUPABASE_URL||'',process.env.SUPABASE_KEY||'')

const configuration = new Configuration({ apiKey: process.env.OPENAI_KEY});
const openAi = new OpenAIApi(configuration);

async function fetchEmbedding(content) {
    const embeddingResponse = await openAi.createEmbedding({
        model: 'text-embedding-ada-002',
        input: content,
    })
  
    const [{embedding}] = embeddingResponse.data.data;
  
    return embedding;
}

async function answerQuestion(question,information) {
    //work out how to handle multiple questions
    const chatResponse = await openAi.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role:'system',
          content:"You exist on Will Davis's personal portfolio, and will talk to recruiters, justifying why they should hire Will, and explain how the site works."
        },
        {
          role:'system',
          content:`Each question someone asks, you will be provided with a question, and a set of information you are permitted to use to answer the question
            If the question cannot be answered with that information, simply say "I am unable to answer that unfortunately"
            Respond with only the answer to that message. You can use information received in different questions to answer new questions.
          `
        },
        {
          role:'user',
          content:`Please answer this question: ${question}?
  
          using only the following information:
          ${information}
          `
        },
      ],
      temperature:0,
    })
   
    return chatResponse.data;
}

NightingaleRouter.post("/", async (req,res)=>{
    let input = req.body;
    const x = await generateEmbeddings(input);

    const {data:documents} = await supabase.rpc('match_documents',{
        query_embedding:x,
        match_threshold:0.75,
        match_count:20,
        c_id: 'Will',
    })

    let relevent_information=documents.map(doc=>doc.content).join(', ');

    const response = await answerQuestion(input.text,relevent_information);
    console.log(response.choices)

    res.send(
        response.choices[0]?.message?.content
    )

    ("Hello World!");
})

export {NightingaleRouter}