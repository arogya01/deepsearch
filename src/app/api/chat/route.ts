
import { type UIMessage, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/server/auth/user-sync';
import { userCache } from '@/server/redis';
import { revalidatePath } from 'next/cache';
import {
  createOrGetSession,
  getSessionWithMessages,
  persistAgentResult,
} from '@/server/db/chat-persistence';
import { startActiveObservation } from '@langfuse/tracing';
import { langfuseSpanProcessor } from '../../../instrumentation';
import { performDeepSearch } from '@/server/search/deep-search';

export const maxDuration = 60;

export async function POST(req: Request) {
  return startActiveObservation('Chat API Handler', async (rootSpan) => {
    try {
      // ─────────────────────────────────────────────────────────────
      // 1. AUTHENTICATION & RATE LIMITING
      // ─────────────────────────────────────────────────────────────
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const user = await ensureUserExists(clerkUser);
      await userCache.updateLastActive(user.clerkId);

      const isLimited = await userCache.isRateLimited(user.clerkId, 'chat', 20, 3600);
      if (isLimited) {
        return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }

      // ─────────────────────────────────────────────────────────────
      // 2. SESSION MANAGEMENT
      // ─────────────────────────────────────────────────────────────
      const { messages, id }: { messages: UIMessage[]; id?: string } = await req.json();
      const { sessionId, isNew } = await createOrGetSession(user.id, id);

      // Update trace with session info
      rootSpan.updateTrace({
        sessionId,
        userId: user.clerkId,
      });

      console.log(`Chat session: ${sessionId} (${isNew ? 'new' : 'existing'})`);

      let allMessages = messages;
      if (!isNew && messages.length === 0) {
        const sessionData = await getSessionWithMessages(sessionId);
        if (sessionData) {
          allMessages = sessionData.messages;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 3. EXECUTE AGENT LOOP
      // ─────────────────────────────────────────────────────────────
      // Extract the latest user question
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      let question = '';

      if (lastUserMessage) {
        if ('content' in lastUserMessage && typeof lastUserMessage.content === 'string') {
          question = lastUserMessage.content;
        } else if (lastUserMessage.parts) {
          question = lastUserMessage.parts
            .filter(p => p.type === 'text')
            .map(p => (p as { text: string }).text)
            .join('');
        }
      }

      // Set trace input after extracting the question
      rootSpan.updateTrace({ input: question });

      const uiMessageStream = createUIMessageStream({
        execute: async ({ writer }) => {
          try {
            // Run the agent loop - passing the writer to stream intermediate actions
            const { stream: finalStream, actions } = await performDeepSearch({
              question,
              userId: user.id,
              writer
            });

            // ─────────────────────────────────────────────────────────────
            // 4. PERSIST RESULT
            // ─────────────────────────────────────────────────────────────
            const answer = await finalStream.text;

            // Set trace-level output and end the span
            rootSpan.updateTrace({
              output: answer,
            });
            rootSpan.update({ output: { answer, status: 'complete' } }).end();

            await persistAgentResult({
              sessionId,
              allMessages,
              answer,
              actions,
              isNew,
            });

            revalidatePath('/chat');
            revalidatePath(`/chat/${sessionId}`);

            await langfuseSpanProcessor.forceFlush();

            // Merge the final output stream into our UI message stream
            writer.merge(finalStream.toUIMessageStream({ sendStart: false }));
          } catch (error) {
            console.error('Error in agent loop execution:', error);
            writer.write({
              type: 'text-delta',
              id: 'err-' + Date.now(),
              delta: '\n\nAn error occurred while performing the search. Please try again.',
            });
          }
        },
      });

      // Note: span will be ended inside the execute callback after answer is captured

      return createUIMessageStreamResponse({ stream: uiMessageStream });

    } catch (err) {
      console.error('Error in chat route:', err);
      rootSpan.update({ output: { error: 'Request failed' } });
      return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });
}