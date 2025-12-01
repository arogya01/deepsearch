import {z} from "zod"; 


export interface SearchResult{
    type: "search"; 
    query: string[]; 
}

export interface ScrapeAction{
    type: "scrape"; 
    urls: string[]; 
}

export interface AnswerAction{
    type: "answer"; 
}

export type Action = SearchResult | ScrapeAction | AnswerAction; 


export const actionSchema = z.union([
    z.object({
        type: z.literal("search").describe("search the web for more information"),
        query: z.string().describe("the query to search for")
    }), 
    z.object({
        type: z.literal("scrape").describe("Scrape a URL"), 
        urls: z.array(z.string()).describe('the URLs to scrape')
    }), 
     z.object({
    type: z
      .literal("answer")
      .describe(
        "Answer the user's question and complete the loop",
      ),
  }),
])