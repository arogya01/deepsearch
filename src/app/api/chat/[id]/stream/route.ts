// app/api/chat/[id]/stream/route.ts
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/server/auth/user-sync';
import { getSession } from '@/server/db/chat-persistence';
import { getStreamContext } from '@/server/redis/resumable-stream';
import { UI_MESSAGE_STREAM_HEADERS } from 'ai';
import { after } from 'next/server';

export const maxDuration = 30;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user with Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }    

    // Get the chat ID from route params
    const { id } = await params;

    // Load the chat session
    const session = await getSession(id);

    if (!session) {
      return Response.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if there's an active stream to resume
    if (!session.activeStreamId) {
      // No active stream - return 204 No Content
      console.log(`No active stream for session: ${id}`);
      return new Response(null, { status: 204 });
    }

    console.log(`Resuming stream: ${session.activeStreamId} for session: ${id}`);

    // Resume the existing stream from Redis
    const streamContext = getStreamContext();
    const resumedStream = await streamContext.resumeExistingStream(
      session.activeStreamId
    );

    // Return the resumed stream with proper headers
    return new Response(resumedStream, {
      headers: UI_MESSAGE_STREAM_HEADERS,
    });
  } catch (error) {
    console.error('Error resuming stream:', error);
    return new Response(JSON.stringify({ error: 'Failed to resume stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

