import { google } from "@ai-sdk/google";
import { stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import { performWebScrape } from "./web-scraper";
import { performWebSearch } from "./web-search";
import { updateActiveObservation, updateActiveTrace } from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";

export function streamDeepSearch({
    user, 
  messages,
}: {
    user: { id: number };
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}) {
  const result = streamText({
    model: google("gemini-2.5-flash"),
    experimental_telemetry: {
      isEnabled: true,
    },
    messages: messages,
    system: [
      "You are a helpful assistant that can search the web for information.",
      "Use the searchWeb tool to search the web for information when needed. and extract more deep information about the specific URLs using the webScraper tool.",
      "After getting search results, provide a comprehensive answer based on the information found.",
      "Do not fabricate information - always use the search tool to get real data.",
      "If you are not sure about something, say you do not know.",
    ].join("\n"),
    tools: {
      webScraper: tool({
        description:
          "Scrape content from a given URL. Use this to extract information from web pages.",
        inputSchema: z.object({
          urlToCrawl: z
            .url()
            .min(1)
            .max(500)
            .describe("The URL to crawl (including http:// or https://)"),
        }),
        execute: async ({ urlToCrawl }) => {
          console.log("Executing webScraper tool for URL:", urlToCrawl);
          try {
            const result = await performWebScrape(urlToCrawl, user.id);
            console.log("Web scraping completed successfully", result);
            return result;
          } catch (error) {
            console.error("Error in webScraper tool:", error);
            throw error;
          }
        },
      }),
      searchWeb: tool({
        description:
          "Search the web for a given query. Use this to find current, factual information.",
        inputSchema: z.object({
          query: z.string().describe("The search query to look up"),
        }),
        execute: async ({ query }) => {
          console.log("Executing searchWeb tool for query:", query);
          try {
            // Call the shared search function directly with user.id
            const result = await performWebSearch(query, user.id);
            console.log("Search completed successfully", result);
            return result;
          } catch (error) {
            console.error("Error in searchWeb tool:", error);
            throw error;
          }
        },
      }),
    },
    // CRITICAL: Enable multi-step tool calling so model can use tool results in its response
    stopWhen: stepCountIs(5),
    onStepFinish: async ({ toolResults, text }) => {
      if (toolResults && toolResults.length > 0) {
        console.log(
          "Step finished with tool results:",
          toolResults.map((r) => ({
            toolName: r.toolName,
            hasOutput: !!r.output,
          }))
        );
      }
      if (text) {
        console.log("Step finished with text length:", text.length);
      }
    },
    onFinish: async (result) => {
      updateActiveObservation({
        output: result.content,
      });
      updateActiveTrace({
        output: result.content,
      });

      // End span manually after stream has finished
      trace.getActiveSpan()?.end();
    },
    onError: async (error) => {
      updateActiveObservation({
        output: error,
        level: "ERROR",
      });
      updateActiveTrace({
        output: error,
      });

      // End span manually after stream has finished
      trace.getActiveSpan()?.end();
    },
  });

  return result;
}
