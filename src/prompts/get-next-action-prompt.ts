import { SystemContext } from "../system-context";
import { getNextActionSystemPrompt, formatCurrentDate } from "./config";

export function buildNextActionPrompt(ctx: SystemContext): string {
  const systemPrompt = getNextActionSystemPrompt();

  return `${systemPrompt}

## User Question
${ctx.getQuestion()}

## Current Research State
${ctx.getContextSummary()}

## Progress
**Steps Taken:** ${ctx.getStep()}/10
**Current Date:** ${formatCurrentDate()}

## Available Actions

1. **Search the web**
   \`\`\`json
   {"type": "research", "query": "your search query"}
   \`\`\`

2. **Search + Scrape URLs** (optional)
   \`\`\`json
   {"type": "research", "query": "your search query", "urlsToScrape": ["url1", "url2"]}
   \`\`\`

3. **Generate Answer** (when you have enough information)
   \`\`\`json
   {"type": "answer"}
   \`\`\`

## Action Selection Rules
- On step 1, you almost always need to search first
- Only scrape URLs that appeared in your search results
- Answer when you have sufficient information OR when running low on steps (7+)
- **TEMPORAL PRIORITY**: When the question involves current events, prioritize searching for information from the most recent dates visible in the search results

---

**You MUST return a valid JSON object with a "type" field.**`;
}
