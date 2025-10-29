// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage, tool, stepCountIs, generateId } from 'ai';
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
  updateActiveObservation,
  updateActiveTrace,
} from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import { langfuseSpanProcessor } from "../../../instrumentation";
import { getStreamContext } from '@/server/redis/resumable-stream';


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

  // Clear any previous active stream when starting a new message
  await updateSessionMetadata(sessionId, { activeStreamId: null });

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
        'Use the searchWeb tool to search the web for information when needed.',
        'After getting search results, provide a comprehensive answer based on the information found.',
        'Do not fabricate information - always use the search tool to get real data.',
        'If you are not sure about something, say you do not know.',
      ].join('\n'),
      tools: {
        searchWeb: tool({
          description: 'Search the web for a given query. Use this to find current, factual information.',           
          inputSchema: z.object({
            query: z.string().describe('The search query to look up')
          }), 
          execute: async ({ query }) => {
            console.log('Executing searchWeb tool for query:', query);
            try {
              // Call the shared search function directly with user.id
              const result = await performWebSearch(query, user.id);
              console.log('Search completed successfully', result);
              return result;
            } catch (error) {
              console.error('Error in searchWeb tool:', error);
              throw error;
            }
          }
        })
      },
      // CRITICAL: Enable multi-step tool calling so model can use tool results in its response
      stopWhen: stepCountIs(5),
      // Optional: Log each step for debugging
      onStepFinish: async ({ toolResults, text }) => {
        if (toolResults && toolResults.length > 0) {
          console.log('Step finished with tool results:', toolResults.map(r => ({
            toolName: r.toolName,
            hasOutput: !!r.output
          })));
        }
        if (text) {
          console.log('Step finished with text length:', text.length);
        }
      },
      onFinish: async (result) => {
        updateActiveObservation({
          output: result.content,
        });
        updateActiveTrace({
          output: result.content,
        });
   
        // Clear the active stream when finished
        await updateSessionMetadata(sessionId, { activeStreamId: null });
   
        // End span manually after stream has finished
        trace.getActiveSpan()?.end();
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

    // Handle persistence in the background after stream completes
    result.text.then(async (finalText) => {
      const response = await result.response;
      try {
        console.log('Stream finished, saving to database...');
        
        // Extract tool calls and results from response.messages
        // response.messages contains the full conversation including tool activity
        // ModelMessage uses 'input' for tool calls and 'output' for tool results
        const toolParts: Array<{
          type: 'tool-call';
          toolCallId: string;
          toolName: string;
          args: unknown;
        } | {
          type: 'tool-result';
          toolCallId: string;
          toolName: string;
          result: unknown;
        }> = [];
        
        if (response.messages) {
          for (const message of response.messages) {
            if (message.role === 'assistant' && 'content' in message) {
              // Extract tool-call parts from assistant messages
              const content = message.content;
              if (Array.isArray(content)) {
                for (const part of content) {
                  if (typeof part === 'object' && part !== null && 'type' in part && part.type === 'tool-call') {
                    // ModelMessage ToolCallPart has 'input' field
                    toolParts.push({
                      type: 'tool-call',
                      toolCallId: part.toolCallId,
                      toolName: part.toolName,
                      args: part.input,
                    });
                  }
                }
              }
            } else if (message.role === 'tool' && 'content' in message) {
              // Extract tool-result parts from tool messages
              const content = message.content;
              if (Array.isArray(content)) {
                for (const part of content) {
                  if (typeof part === 'object' && part !== null && 'type' in part && part.type === 'tool-result') {
                    // ModelMessage ToolResultPart has 'output' field
                    toolParts.push({
                      type: 'tool-result',
                      toolCallId: part.toolCallId,
                      toolName: part.toolName,
                      result: part.output,
                    });
                  }
                }
              }
            }
          }
        }
        
        // Build merged parts array: tool calls, tool results, then final text
        // Note: We store tool parts in a simplified format for database persistence
        // The UI will handle rendering these parts correctly
        const mergedParts = [
          ...toolParts,
          ...(finalText ? [{ type: 'text' as const, text: finalText }] : []),
        ];
        
        // Convert response to UIMessage format for storage with all parts
        // Cast to UIMessage since our storage format is simpler than the streaming format
        const assistantMessage: UIMessage = {
          id: response.id,
          role: 'assistant',
          parts: mergedParts as unknown as UIMessage['parts'],
        };
        
        console.log(`Assistant message has ${mergedParts.length} parts (${toolParts.length} tool parts, ${finalText ? 1 : 0} text part)`);
        
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

    // Return the stream response with resumable stream support
    return result.toUIMessageStreamResponse({
      async consumeSseStream({ stream }) {
        const streamId = generateId();
        const streamContext = getStreamContext();
        
        // Create resumable stream and store in Redis
        await streamContext.createNewResumableStream(streamId, () => stream);
        
        // Save the stream ID to the session for resumption
        await updateSessionMetadata(sessionId, { activeStreamId: streamId });
        
        console.log(`Created resumable stream: ${streamId} for session: ${sessionId}`);
      }
    });
  }catch (err) {
    console.error('Error in chat route:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  }

