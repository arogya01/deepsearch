// essentially implementing the steps for the agent to think through with the citations

import { SystemContext } from "./system-context";
import { streamDeepSearch } from "./server/search/ai-sdk";
import { performWebSearch } from "./server/search/web-search";
import { performWebScrape } from "./server/search/web-scraper";
import { getNextAction } from "./get-next-action";


export async function runAgentLoop(question: string) {
  const ctx = new SystemContext();
  ctx.setQuestion(question);
  ctx.addMessage({ role: "user", content: question });

  while(!ctx.shouldStop()){
      ctx.incrementStep();

    const nextAction = getNextAction(ctx); 

    

  }


  return "Agent loop completed, but no answer generated yet.";
}