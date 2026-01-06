import { z } from "zod";

export interface ResearchAction {
    type: "research";
    query: string;
    urlsToScrape: string[];
}

export interface AnswerAction {
    type: "answer";
}

export type Action = ResearchAction | AnswerAction;


const baseActionFields = {
    title: z.string().describe("A short title for this action"),
    description: z.string().describe("Explanation of what this action will do and why"),
};

export const actionSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("research"),
        ...baseActionFields,
        query: z.string().describe("The research query to find information on the web"),
        urlsToScrape: z.array(z.string()).optional().describe("List of URLs to scrape for detailed content")
    }),
    z.object({
        type: z.literal("answer"),
        ...baseActionFields,
    }),
])