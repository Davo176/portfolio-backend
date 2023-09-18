import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";



export const supabase = createClient(process.env.SUPABASE_URL||'',process.env.SUPABASE_KEY||'')

const openAi = new OpenAI(({
    apiKey: process.env.OPENAI_KEY
}));

const customer_id = "a948d675-9afa-4cb9-b986-4c4ed7b68ca8";

async function generateEmbeddings(content) {
    console.log(content)
    const embeddingResponse = await openAi.embeddings.create({
        input:content.content,
        model:'text-embedding-ada-002',

    })
    console.log(embeddingResponse);
    const embedding = embeddingResponse.data[0].embedding
    console.log(embedding);
    return {...content,embedding:embedding};
}

async function addToDB(rows) {
    console.log(rows);
    let {data,error} = await supabase.from('documents').insert(rows).select()
    console.log(data);
    console.log(error);
}


const AggregatedInformation = [
    {
        group: "About Me",
        info: "My name is William Davis. I am from Adelaide, Australia.",
        inDB: true,
    },
]

for (let row of AggregatedInformation){
    let rows = []
    console.log(row);
    if (row==inDB){
        continue;
    }
    row.info.split('. ').map(e=>rows.push({
        content:e,
        group_name:row.group,
        customer_id:customer_id,
    }))
    console.log(rows);
    let sentences = await Promise.all(rows.map(x => {
        return generateEmbeddings(x);
    }))
    await addToDB(sentences)
}