import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

const openAi = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const customer_id = "a948d675-9afa-4cb9-b986-4c4ed7b68ca8";

async function generateEmbeddings(content) {
  const embeddingResponse = await openAi.embeddings.create({
    input: content.content,
    model: "text-embedding-ada-002",
  });
  const embedding = embeddingResponse.data[0].embedding;
  return { ...content, embedding: embedding };
}

async function addToDB(rows) {
  console.log(rows);
  let { data, error } = await supabase.from("documents").insert(rows).select();
  console.log(data);
  console.log(error);
}

const AggregatedInformation = [
  {
    group: "About Me",
    info: "My name is William Davis. I am from Adelaide, Australia.",
    inDB: false,
  },
  {
    group: "About Me - Uni",
    info: "I have completed a Bachelor of Computer Science (Advanced) at the University of Adelaide. I graduated with a 6.9 GPA. I majored in Artifical Intelligence. I completed subjects over a broad range of topics, Web and Database Computing, AI, Evolutionary Computing, System Programming, Operating Systems, Algorithms and Datastructures.",
    inDB: false,
  },
  {
    group: "About Me - Languages",
    info: "I am proficient in many programming languages, including Javascript, Typescript Python, C++, C, Bash and SQL. I am most skilled at programming in Javascript, including React and Express. I have experience working in AWS, writing cloudformations, creating alerts and dashboards and am familiar with all core concepts.",
    inDB: false,
  },
  {
    group: "Work - FYI",
    info: "I have been working as a Software Engineer at FYI, a company that makes cloud document management and automations software for accountants since March 2020. At FYI I completed many full stack projects that are loved by their users.",
    inDB: false,
  },
  {
    group: "Work - Mathematics Tutoring",
    info: "I tutored as many as 7 students in 1 one 1 sessions in mathematics and physics with positive feedback and improving grades.",
    inDB: false,
  },
  {
    group: "Work - Glenunga Rams",
    info: "Developed a data collection and analysis system in Python for stoppage and interception details for my local football club, the Glenunga Rams, as well as collecting the data every Saturday.",
    inDB: false,
  },

  {
    group: "Projects - Overview",
    info: "Some projects I built are, Nightingale, an AFL Fantasy Chrome Extension, Blocky Code, and this Portfolio website.",
    inDB: false,
  },
  {
    group: "Projects - Nightingale",
    info: "Nightingale is A GPT powered Customer Support engine. You can ask Nightingale natural language questions about a product and receive natural language answers. I am built ontop of Nightingale.",
    inDB: false,
  },
  {
    group: "Projects - Nightingale",
    info: "Nightingale works using Open AI's embeddings, to find similar sentences to your question. Nightingale accesses the similar sentences, and rewords them to produce a natural language answer to your question. Nightingale was originally produced for the Tech E Challenge at Adelaide University, where it was a finalist. Find more information about Nightingale on the Nightingale Page.",
    inDB: false,
  },
  {
    group: "Projects - Blocky Code",
    info: "Blocky Code was my Year 12 end of year project. Blocky Code is a game to help teach students how to code. In Blocky Code you drag and drop blocks and loops to manouver a character around a maze.",
    inDB: false,
  },
  {
    group: "Projects - Blocky Code",
    info: "Blocky Code was written in GameMaker 2. Find more information about Blocky Code on the Blocky Code page.",
    inDB: false,
  },
  {
    group: "Projects - AFL Fantasy Chrome Extension",
    info: "The AFL Fantasy Chrome Extension extends the existing afl fantasy website, adding more features. The chrome extension adds in the ability to Save, Update, and Delete versions of your team.",
    inDB: false,
  },
  {
    group: "Projects - AFL Fantasy Chrome Extension",
    info: "AFL Fantasy Extender was build in Typescript, NodeJS, ReactJS with a Postgres DB. AFL Fantasy extender achieved 20 Active users in 3 weeks with minimal advertising. AFL Fantasy Extender is still being worked on active development.",
    inDB: false,
  },
  {
    group: "Projects - This Portfolio",
    info: "This Portfolio show's off Will's work throughout the years. Will is not an artist so excuse anything that isnt beautiful, and focus on the features. The portfolio has Will's work experience, Personal projects, and a section on algorithms and data structures is currently in development.",
    inDB: false,
  },
];

(async () => {
  for (let row of AggregatedInformation) {
    let rows = [];
    console.log(row);
    if (row.inDB == true) {
      continue;
    }
    row.info.split(". ").map((e) =>
      rows.push({
        content: e,
        group_name: row.group,
        customer_id: customer_id,
      })
    );
    console.log(rows);
    let sentences = await Promise.all(
      rows.map((x) => {
        return generateEmbeddings(x);
      })
    );
    await addToDB(sentences);
  }
})();
