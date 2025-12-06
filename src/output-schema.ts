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


export const actionSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("search"),
        query: z.string().describe("The search query to find information on the web")
    }), 
    z.object({
        type: z.literal("scrape"), 
        urls: z.array(z.string()).min(1).describe("List of URLs to scrape for detailed content")
    }), 
    z.object({
        type: z.literal("answer"),
    }),
]).describe("The next action to take: 'search' for web search, 'scrape' to extract page content, or 'answer' when ready to respond")