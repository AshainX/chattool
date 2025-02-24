import { ChatOpenAI } from "@langchain/openai";

const initialiseModel = () => {
    const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0.7,
        maxTokens: 4096,
        streaming: true,
        clientOptions: 
    });

    return model;
}