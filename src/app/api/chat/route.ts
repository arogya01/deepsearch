// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/server/auth/user-sync';
import { userCache } from '@/server/redis';

export const maxDuration = 30; // optional for long streams

export async function POST(req: Request) {
  // Authenticate user with Clerk
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
            console.log('calling the tool')
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/search-web`, { method: 'POST', body: JSON.stringify({ query }) });
            console.log('response',response);
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
        console.log('toolResult',toolResult);
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
