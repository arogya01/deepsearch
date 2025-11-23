// app/api/chat/[id]/stream/route.ts
import { currentUser } from '@clerk/nextjs/server';
import { getSession, updateSessionMetadata } from '@/server/db/chat-persistence';
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

    const timestamp = new Date().toISOString();

    // Check if there's an active stream to resume
    if (!session.activeStreamId) {
      // No active stream - return 204 No Content
      console.log(`[STREAM-RESUME] No active stream found`, {
        sessionId: id,
        timestamp,
        status: 'no-stream'
      });
      return new Response(null, { status: 204 });
    }

    console.log(`[STREAM-RESUME] Attempting to resume stream`, {
      streamId: session.activeStreamId,
      sessionId: id,
      timestamp,
      user: clerkUser.id
    });

    // Resume the existing stream from Redis
    const streamContext = await getStreamContext();

    try {
      const resumedStream = await streamContext.resumeExistingStream(
        session.activeStreamId
      );

      if (!resumedStream) {
        console.error(`[STREAM-RESUME] ✗ Stream expired or not found in Redis`, {
          streamId: session.activeStreamId,
          sessionId: id,
          timestamp,
          reason: 'Stream may have exceeded 24-hour TTL or was never created'
        });

        // Clear the stale activeStreamId
        await updateSessionMetadata(id, { activeStreamId: null });

        return new Response(JSON.stringify({
          error: 'Stream expired',
          message: 'The stream has expired (24-hour limit) or was not found. Please start a new message.',
          streamId: session.activeStreamId,
          ttl: '24 hours'
        }), {
          status: 410, // Gone
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log(`[STREAM-RESUME] ✓ Successfully resumed stream`, {
        streamId: session.activeStreamId,
        sessionId: id,
        timestamp
      });

      // Return the resumed stream with proper headers
      return new Response(resumedStream, {
        headers: UI_MESSAGE_STREAM_HEADERS,
      });
    } catch (streamError) {
      console.error(`[STREAM-RESUME] ✗ Error resuming stream from Redis`, {
        streamId: session.activeStreamId,
        sessionId: id,
        timestamp,
        error: streamError instanceof Error ? streamError.message : String(streamError),
        stack: streamError instanceof Error ? streamError.stack : undefined
      });

      // Clear the problematic activeStreamId
      await updateSessionMetadata(id, { activeStreamId: null });

      return new Response(JSON.stringify({
        error: 'Failed to resume stream',
        message: 'An error occurred while resuming the stream. Please start a new message.',
        details: streamError instanceof Error ? streamError.message : String(streamError),
        streamId: session.activeStreamId
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error(`[STREAM-RESUME] ✗ Unexpected error in resume handler`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      error: 'Failed to resume stream',
      message: 'An unexpected error occurred. Please try again or start a new message.',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

