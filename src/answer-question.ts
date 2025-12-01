import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { SystemContext } from "./system-context";

export async function answerQuestion(
  ctx: SystemContext,
  options?: { isFinal?: boolean }
) {
  const systemPrompt = options?.isFinal
    ? `You are answering a question with limited information.
    We've reached the maximum number of research steps. 
    Give your best attempt based on what you have gathered.
    Be Honest about any uncertainity or gaps in the information.`
    : `You are answering a question based on thorough research.
    Provide a comprehensive answer with citations from the sources found.
    Format citations as [Source Title](URL)`;

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    prompt: `Question: ${ctx.getQuestion()}

     Research collected:
     ${ctx.getContextSummary()}

     Provide a comprehensive answer with citations.`,
  });

  return result.text;
}
