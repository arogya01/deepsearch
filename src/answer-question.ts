import { smoothStream, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { SystemContext } from "./system-context";
import { observe } from "@langfuse/tracing";
import { getAnswerSystemPrompt } from "./prompts/config";

export const answerQuestion = observe(
  function answerQuestion(
    ctx: SystemContext,
    options?: { isFinal?: boolean }
  ) {
    const systemPrompt = getAnswerSystemPrompt(options?.isFinal ?? false);

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: `Question: ${ctx.getQuestion()}

Research collected:
${ctx.getContextSummary()}

Instructions: Provide a comprehensive answer with citations. When citing sources, mention their publication dates if available (e.g., "According to [Source Title] (published 2026-01-15)..."). Be aware that search result dates are shown in [YYYY-MM-DD] format in the research above.`,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "answerQuestion",
      },
      onFinish({ text }) {
        // Update context with the final answer after streaming completes
        ctx.addMessage({ role: "assistant", content: text });
      },
      experimental_transform: smoothStream(),
    });

    return result;
  },
  { name: "Answer Question" }
);
