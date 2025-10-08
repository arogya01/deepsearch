// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/server/auth/user-sync';
import { userCache } from '@/server/redis';
import { performWebSearch } from '@/server/search/web-search';

export const maxDuration = 30; // optional for long streams

export async function POST(req: Request) {

  try{
  // Authenticate user with Clerk
  const clerkUser = await currentUser();
  console.log('clerkUser',JSON.stringify(clerkUser,null,2));
  
  if (!clerkUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('entering ensureUserExists');
  // Sync user data and update last active
  const user = await ensureUserExists(clerkUser);
  await userCache.updateLastActive(user.clerkId);

  // Check rate limiting
  const isLimited = await userCache.isRateLimited(user.clerkId, 'chat', 20, 3600); // 20 requests per hour
  if (isLimited) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

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
            console.log('Executing searchWeb tool for query:', query);
            try {
              // Call the shared search function directly with user.id
              const result = await performWebSearch(query, user.id);
              console.log('Search completed successfully');
              return result;
            } catch (error) {
              console.error('Error in searchWeb tool:', error);
              throw error;
            }
          }
        })
      }
    });

    for(const toolResult of await result.toolCalls){
      if(toolResult.dynamic){
        continue;
      }

      if(toolResult.toolName === 'searchWeb'){
        console.log('toolResult',toolResult);
      }
    }

    return result.toUIMessageStreamResponse();
  }catch (err) {
    console.error('Error in chat route:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  }

