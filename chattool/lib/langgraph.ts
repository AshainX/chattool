// import { ChatOpenAI } from "@langchain/openai";

// const initialiseModel = () => {
//     const model = new ChatOpenAI({
//         modelName: "gpt-4o-mini",
//         openAIApiKey: process.env.OPENAI_API_KEY,
//         temperature: 0.7,
//         maxTokens: 4096,
//         streaming: true,
//         clientOptions:
//     });

//     return model;
// }

import { ChatAnthropic } from "@langchain/anthropic";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";


// Connect to wxflows
const toolClient = new wxflows({
    endpoint: process.env.WXFLOWS_ENDPOINT || "",
    apikey: process.env.WXFLOWS_APIKEY,
  });

const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);

const initialiseModel = () => {
  const model = new ChatAnthropic({
    modelName: "gpt-4o-mini",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.7,
    maxTokens: 4096,
    streaming: true,
    clientOptions: {
      defaultHeaders: {
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
    },
    callbacks: [
      {
        handleLLMStart: async () => {
          console.log("LLM started");
        },
        handleLLMEnd: async (output) => {
          console.log("LLM ended");
          const usage = output.llmOutput?.usage;
          if (usage) {
            console.log("Usage: ", usage);
            // console.log("📊 Token Usage:", {
            //   input_tokens: usage.input_tokens,
            //   output_tokens: usage.output_tokens,
            //   total_tokens: usage.input_tokens + usage.output_tokens,
            //   cache_creation_input_tokens:
            //     usage.cache_creation_input_tokens || 0,
            //   cache_read_input_tokens: usage.cache_read_input_tokens || 0,
            // });
          }
        },

        // handleLLMNewToken : async (token : string) => {
        //     console.log("New token: ", token);
        // },
      },
    ],
  }).bindTools(tools);
  return model;
};
