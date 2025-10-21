// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage, tool, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/server/auth/user-sync';
import { userCache } from '@/server/redis';
import { performWebSearch } from '@/server/search/web-search';
import { revalidatePath } from 'next/cache';
import {
  createOrGetSession,
  saveMessages,
  updateSessionMetadata,
  generateSessionTitle,
  extractFirstUserMessage,
  getSessionWithMessages,
} from '@/server/db/chat-persistence';
import { after } from 'next/server';
import {
  observe,
  updateActiveObservation,
  updateActiveTrace,
} from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import { langfuseSpanProcessor } from "../../../instrumentation";


export const maxDuration = 30; // optional for long streams

export async function POST(req: Request) {

  try{
  // Authenticate user with Clerk
  const clerkUser = await currentUser();
  
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

  const { messages, id }: { messages: UIMessage[]; id?: string } = await req.json();

  // Create or get existing chat session
  const { sessionId, isNew } = await createOrGetSession(user.id, id);
  console.log(`Chat session: ${sessionId} (${isNew ? 'new' : 'existing'})`);

  // Load existing messages if this is a continuing conversation
  let allMessages = messages;
  if (!isNew && messages.length === 0) {
    const sessionData = await getSessionWithMessages(sessionId);
    if (sessionData) {
      allMessages = sessionData.messages;
    }
  }

    const result = streamText({
      model: google('gemini-2.5-flash'),
      experimental_telemetry: {
        isEnabled: true,
        // metadata: { 
        //   langfusePrompt: prompt.toJSON() // This links the Generation to your prompt in Langfuse
        // },
      },
      messages: convertToModelMessages(allMessages),
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
              console.log('Search completed successfully',result);
              return result;
            } catch (error) {
              console.error('Error in searchWeb tool:', error);
              throw error;
            }
          }
        })
      }, 
      onFinish: async (result) => {
        updateActiveObservation({
          output: result.content,
        });
        updateActiveTrace({
          output: result.content,
        });
   
        // End span manually after stream has finished
        trace.getActiveSpan().end();
      },
      onError: async (error) => {
        updateActiveObservation({
          output: error,
          level: "ERROR"
        });
        updateActiveTrace({
          output: error,
        });
   
        // End span manually after stream has finished
        trace.getActiveSpan()?.end();
      },
    });

    // Create stream with custom data part for session ID
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Send session info as custom data part (transient, won't be in message history)
        writer.write({
          type: 'data-session',
          id: 'session-info',
          data: { 
            sessionId: sessionId,
            isNew: isNew,
          },
          transient: true,
        });

        // Merge the AI response stream
        writer.merge(result.toUIMessageStream());
      },
    });

    // Handle persistence in the background after stream completes
    result.text.then(async (text) => {
      try {
        console.log('Stream finished, saving to database...');
        
        // Reconstruct messages with the completed response
        const response = await result.response;
        const assistantMessage: UIMessage = {
          id: response.id,
          role: 'assistant',
          parts: [{ type: 'text', text }],
        };
        
        const finishedMessages = [...allMessages, assistantMessage];
        await saveMessages(sessionId, finishedMessages);

        if (isNew) {
          const firstUserText = extractFirstUserMessage(finishedMessages);
          if (firstUserText) {
            const title = generateSessionTitle(firstUserText);
            await updateSessionMetadata(sessionId, { title });
          }
        }

        await updateSessionMetadata(sessionId, {
          messageCount: finishedMessages.length,
          lastMessageAt: new Date(),
        });

        revalidatePath('/chat');
        revalidatePath(`/chat/${sessionId}`);

        console.log(`Saved ${finishedMessages.length} messages to session ${sessionId}`);
      } catch (error) {
        console.error('Error saving messages to database:', error);
      }
    });

    after(async () => await langfuseSpanProcessor.forceFlush());

    return createUIMessageStreamResponse({ stream });
  }catch (err) {
    console.error('Error in chat route:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  }

