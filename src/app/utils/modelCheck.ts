import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const modelCheck = async () => {
  const result = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: "Hello, world!",
  });
  console.log(result);
};
