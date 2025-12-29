import { UIMessage } from 'ai';
import { z } from 'zod';

// Tool Input/Output Schemas (matching src/server/search/tools.ts)
export const searchWebSchema = {
    input: z.object({
        query: z.string().describe('The search query to look up'),
    }),
    output: z.unknown(),
};

export const webScraperSchema = {
    input: z.object({
        urlToCrawl: z
            .url()
            .min(1)
            .max(500)
            .describe('The URL to crawl (including http:// or https://)'),
    }),
    output: z.unknown(),
};

export interface AgentAction {
    type: string;
    title?: string;
    description?: string;
    step: number;
}

export type AppUIDataTypes = {
    'agent-action': {
        action: AgentAction;
    };
};

export type AppUITools = {
    searchWeb: {
        input: z.infer<typeof searchWebSchema.input>;
        output: unknown;
    };
    webScraper: {
        input: z.infer<typeof webScraperSchema.input>;
        output: unknown;
    };
};

export type AppUIMessage = UIMessage;
