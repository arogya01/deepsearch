import {tool} from "ai"; 
import {z} from "zod"; 
import { performWebScrape } from "./web-scraper";
import { performWebSearch } from "./web-search";

/**
 * Creates the tools object for deep search.
 * userId is required for rate limiting and logging.
 */
export function createDeepSearchTools(userId: number) {
  return {
    webScraper: tool({
      description: 'Scrape content from a given URL. Use this to extract information from web pages.',
      inputSchema: z.object({
        urlToCrawl: z
          .url()
          .min(1)
          .max(500)
          .describe('The URL to crawl (including http:// or https://)'),
      }),
      execute: async ({ urlToCrawl }) => {
        console.log('Executing webScraper tool for URL:', urlToCrawl);
        try {
          const result = await performWebScrape(urlToCrawl, userId);
          console.log('Web scraping completed successfully', result);
          return result;
        } catch (error) {
          console.error('Error in webScraper tool:', error);
          throw error;
        }
      },
    }),
    searchWeb: tool({
      description: 'Search the web for a given query. Use this to find current, factual information.',
      inputSchema: z.object({
        query: z.string().describe('The search query to look up'),
      }),
      execute: async ({ query }) => {
        console.log('Executing searchWeb tool for query:', query);
        try {
          const result = await performWebSearch(query, userId);
          console.log('Search completed successfully', result);
          return result;
        } catch (error) {
          console.error('Error in searchWeb tool:', error);
          throw error;
        }
      },
    }),
  };
}
// Export the system prompt as a constant
export const DEEP_SEARCH_SYSTEM_PROMPT = [
  'You are a helpful assistant that can search the web for information.',
  'Use the searchWeb tool to search the web for information when needed.',
  'Extract more deep information about the specific URLs using the webScraper tool.',
  'After getting search results, provide a comprehensive answer based on the information found.',
  'Do not fabricate information - always use the search tool to get real data.',
  'If you are not sure about something, say you do not know.',
].join('\n');
