
import { type UIMessage } from 'ai';
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/server/auth/user-sync';
import { userCache } from '@/server/redis';
import { revalidatePath } from 'next/cache';
import {
  createOrGetSession,
  getSessionWithMessages,
  persistAgentResult,
} from '@/server/db/chat-persistence';
import { after } from 'next/server';
import { observe, updateActiveTrace } from '@langfuse/tracing';
import { langfuseSpanProcessor } from '../../../instrumentation';
import { performDeepSearch } from '@/server/search/deep-search';

export const maxDuration = 60;

async function handler(req: Request) {
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

    // Run the agent loop - now returns a stream instead of awaiting completion
    const { stream } = await performDeepSearch({
      question,
      userId: user.id
    });

    // ─────────────────────────────────────────────────────────────
    // 4. PERSIST RESULT (via after() since we return stream immediately)
    // ─────────────────────────────────────────────────────────────
    // We use stream.text promise to get the final answer for persistence
    after(async () => {
      try {
        const answer = await stream.text;

        updateActiveTrace({
          sessionId,
          output: answer
        });

        await persistAgentResult({
          sessionId,
          allMessages,
          answer,
          isNew,
        });

        revalidatePath('/chat');
        revalidatePath(`/chat/${sessionId}`);

        await langfuseSpanProcessor.forceFlush();
      } catch (err) {
        console.error('Error persisting agent result:', err);
      }
    });

    // ─────────────────────────────────────────────────────────────
    // 5. RETURN REAL STREAM RESPONSE
    // ─────────────────────────────────────────────────────────────
    return stream.toUIMessageStreamResponse();

  } catch (err) {
    console.error('Error in chat route:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const POST = observe(handler, {
  name: 'Chat API Handler',
  endOnExit: false,
});