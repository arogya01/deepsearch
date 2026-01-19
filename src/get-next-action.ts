import { generateObject } from 'ai';
import { google } from "@ai-sdk/google";
import { z } from 'zod';
import { actionSchema } from './output-schema';
import { SystemContext } from './system-context';
import { observe } from '@langfuse/tracing';
import { buildNextActionPrompt } from './prompts/get-next-action-prompt';

// Infer the type from the schema
type Action = z.infer<typeof actionSchema>;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getNextAction = observe(
  async function getNextAction(ctx: SystemContext): Promise<Action> {
    const prompt = buildNextActionPrompt(ctx);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: actionSchema,
          prompt,
          experimental_telemetry: {
            isEnabled: true,
            functionId: 'getNextAction',
          },
        });

        return result.object;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`⚠️ Attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);

        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`   Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    // If all retries fail, return a sensible default based on context
    console.error(`❌ All ${MAX_RETRIES} attempts failed. Using fallback action.`);

    // If we have no research yet, default to search
    if (ctx.getStep() <= 1) {
      return {
        type: "research",
        query: ctx.getQuestion(),
        title: "Initial Web Search",
        description: `Searching the web for: "${ctx.getQuestion()}" to start the research process.`
      };
    }

    // If we're running low on steps or have some data, answer
    return {
      type: "answer",
      title: "Final Answer Generation",
      description: "Synthesizing all researched information into a final response."
    };
  },
  { name: 'Get Next Action' }
);