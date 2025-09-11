// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const maxDuration = 30; // optional for long streams

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: convertToModelMessages(messages),
      abortSignal: req.signal,
      system: [
        'You are a helpful assistant that can search the web for information.', 
        'use the searchWeb tool to search the web for information.', 
        'do not fabricate information, take help of external tools to get the information.',
        'do not hallucinate information, if you are not sure about the information, say you do not know.',
        'do not make up information, if you are not sure about the information, say you do not know.',        
      ].join('\n'),
      tools: {
        searchWeb: tool({
          description: 'Search the web for a given query',
          inputSchema: z.object({
            query: z.string()
          }), 
          execute: async ({ query }) => {
            console.log('calling the tool')
            const response = await fetch('/api/search-web', { method: 'POST', body: JSON.stringify({ query }) });
            return response.json();
          }
        })
      }
    });

    for(const toolResult of await result.toolCalls){
      if(toolResult.dynamic){
        continue;
      }

      if(toolResult.toolName === 'searchWeb'){
        console.log(toolResult);
      }
    }

    return result.toUIMessageStreamResponse();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
