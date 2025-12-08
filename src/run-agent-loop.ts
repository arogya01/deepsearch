// essentially implementing the steps for the agent to think through with the citations

import { SystemContext } from "./system-context";
import { performWebSearch } from "./server/search/web-search";
import { performWebScrape } from "./server/search/web-scraper";
import { getNextAction } from "./get-next-action";
import { answerQuestion } from "./answer-question";


export interface AgentLoopOptions {
  question: string;
  userId: number;
}
export async function runAgentLoop({ question, userId }: AgentLoopOptions) {
  const ctx = new SystemContext();
  ctx.setQuestion(question);
  ctx.addMessage({ role: "user", content: question });

  console.log(`\n🔍 Starting DeepSearch for: "${question}"\n`);

  while (!ctx.shouldStop()) {
    ctx.incrementStep();
    console.log(`\n📍 Step ${ctx.getStep()}/10`);

    // Get the next action from the LLM
    const action = await getNextAction(ctx);
    console.log(`🤖 Decision: ${action.type}`);

    switch (action.type) {
      case "search": {
        console.log(`🔎 Searching for: "${action.query}"`);
        try {
          const searchResult = await performWebSearch(action.query, userId);

          // Transform and store the results
          const formattedResults = (searchResult.organic || []).map((item) => ({
            date: new Date().toISOString(),
            title: item.title,
            url: item.link,
            snippet: item.snippet,
          }));

          ctx.reportQueries([{ query: action.query, result: formattedResults }]);
          console.log(`✅ Found ${formattedResults.length} results`);
        } catch (error) {
          console.error(`❌ Search failed:`, error);
          // Continue the loop - the LLM can try a different approach
        }
        break;
      }

      case "scrape": {
        console.log(`📄 Scraping ${action.urls.length} URL(s)...`);
        const scrapeResults: { url: string; result: string }[] = [];

        for (const url of action.urls) {
          try {
            console.log(`→ ${url}`);
            const scrapeResult = await performWebScrape(url, userId);

            if (scrapeResult.success && scrapeResult.markdown) {
              scrapeResults.push({
                url,
                result: scrapeResult.markdown,
              });
              console.log(`   ✅ Scraped successfully`);
            }
          } catch (error) {
            console.error(`   ❌ Failed to scrape ${url}:`, error);
            // Continue with other URLs
          }
        }

        if (scrapeResults.length > 0) {
          ctx.reportScrapes(scrapeResults);
        }
        break;
      }

      case "answer": {
        console.log(`\n💡 Generating final answer...`);
        const answer = await answerQuestion(ctx);
        ctx.addMessage({ role: "assistant", content: answer });
        console.log(`\n✨ Answer generated!\n`);
        console.log(`\n✨ Answer generated!\n`);
        return { answer, context: ctx };
      }

      default: {
        // TypeScript exhaustive check
        const _exhaustiveCheck: never = action;
        console.error(`Unknown action type:`, _exhaustiveCheck);
      }
    }
  }

  // If we've exhausted all steps, generate a final answer with what we have
  console.log(`\n⚠️ Max steps reached. Generating best-effort answer...`);
  const finalAnswer = await answerQuestion(ctx, { isFinal: true });
  ctx.addMessage({ role: "assistant", content: finalAnswer });
  return { answer: finalAnswer, context: ctx };
}