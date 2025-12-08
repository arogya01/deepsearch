import { db } from './index';
import { chatSessions, messages, messageParts } from './schema';
import { eq, and, desc } from 'drizzle-orm';
import { StreamTextResult, type UIMessage } from 'ai';
import {
  type UpdateSessionMetadata,
  type SaveMessageParams,
  type SessionWithMessages,
} from './types';

// ============================================================================
// Session Management
// ============================================================================

/**
 * Creates a new chat session or retrieves an existing one
 */
export async function createOrGetSession(
  userId: number,
  chatId?: string
): Promise<{ sessionId: string; isNew: boolean }> {
  // If chatId is provided, try to get existing session
  if (chatId) {
    const existingSession = await db.query.chatSessions.findFirst({
      where: and(
        eq(chatSessions.id, chatId),
        eq(chatSessions.userId, userId)
      ),
    });

    if (existingSession) {
      return { sessionId: existingSession.id, isNew: false };
    }
  }

  // Generate a new chat ID using nanoid-style format
  const newChatId = chatId || `chat_${generateNanoId()}`;

  // Create new session with placeholder title
  await db.insert(chatSessions).values({
    id: newChatId,
    userId,
    title: 'New Conversation',
    isActive: true,
    messageCount: 0,
    lastMessageAt: null,
  });

  return { sessionId: newChatId, isNew: true };
}

/**
 * Gets a chat session by ID (without messages)
 */
export async function getSession(sessionId: string) {
  return await db.query.chatSessions.findFirst({
    where: eq(chatSessions.id, sessionId)
  });
}

/**
 * Updates session metadata (title, message count, last message time)
 */
export async function updateSessionMetadata(
  sessionId: string,
  metadata: UpdateSessionMetadata
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (metadata.title !== undefined) {
    updateData.title = metadata.title;
  }
  if (metadata.messageCount !== undefined) {
    updateData.messageCount = metadata.messageCount;
  }
  if (metadata.lastMessageAt !== undefined) {
    updateData.lastMessageAt = metadata.lastMessageAt;
  }
  if (metadata.isActive !== undefined) {
    updateData.isActive = metadata.isActive;
  }
  if (metadata.activeStreamId !== undefined) {
    updateData.activeStreamId = metadata.activeStreamId;
  }

  await db
    .update(chatSessions)
    .set(updateData)
    .where(eq(chatSessions.id, sessionId));
}

/**
 * Generates a session title from the first user message
 */
export function generateSessionTitle(firstMessage: string): string {
  // Truncate to 50 characters and add ellipsis if needed
  const maxLength = 50;
  const trimmed = firstMessage.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength).trim() + '...';
}

// ============================================================================
// Message Persistence
// ============================================================================

/**
 * Saves an array of UIMessages to the database after stream completion
 * Uses upsert to handle sequence conflicts gracefully
 */
export async function saveMessages(
  sessionId: string,
  uiMessages: UIMessage[]
): Promise<void> {
  for (let i = 0; i < uiMessages.length; i++) {
    const message = uiMessages[i];

    // Upsert message with sequence - handles conflicts automatically
    await upsertMessage(sessionId, message, i);

    // Save message parts (text, tool calls, tool results)
    await saveMessageParts(message.id, message.parts);
  }
}

/**
 * Upserts a message - inserts if new, updates if exists at the same position
 * Handles sequence conflicts by overwriting the message at that position
 */
async function upsertMessage(
  sessionId: string,
  message: UIMessage,
  sequence: number
): Promise<void> {
  const isCompleted = message.parts.some(part =>
    'isFinal' in part && part.isFinal
  );

  const now = new Date();
  const messageData: SaveMessageParams = {
    id: message.id,
    sessionId,
    sequence,
    role: message.role,
    status: isCompleted ? 'completed' : 'streaming',
    content: null, // We store content in message_parts
    metadata: {},
    startedAt: now,
    completedAt: isCompleted ? now : undefined,
  };

  // Upsert: Insert or update on conflict with (sessionId, sequence)
  await db.insert(messages)
    .values(messageData)
    .onConflictDoUpdate({
      target: [messages.sessionId, messages.sequence],
      set: {
        id: messageData.id,
        role: messageData.role,
        status: messageData.status,
        content: messageData.content,
        metadata: messageData.metadata,
        completedAt: messageData.completedAt,
        updatedAt: now,
      },
    });
}

// /**
//  * Inserts a new message into the database
//  */
// async function insertMessage(
//   sessionId: string,
//   message: UIMessage,
//   sequence: number
// ): Promise<void> {
//   const isCompleted = message.parts.some(part => 
//     'isFinal' in part && part.isFinal
//   );

//   const messageData: SaveMessageParams = {
//     id: message.id,
//     sessionId,
//     sequence,
//     role: message.role,
//     status: isCompleted ? 'completed' : 'streaming',
//     content: null, // We store content in message_parts
//     metadata: {},
//     startedAt: new Date(),
//     completedAt: isCompleted ? new Date() : undefined,
//   };

//   await db.insert(messages).values(messageData);
// }

// /**
//  * Updates an existing message
//  */
// async function updateMessage(message: UIMessage): Promise<void> {
//   const isCompleted = message.parts.some(part => 
//     'isFinal' in part && part.isFinal
//   );

//   await db
//     .update(messages)
//     .set({
//       status: isCompleted ? 'completed' : 'streaming',
//       completedAt: isCompleted ? new Date() : undefined,
//       updatedAt: new Date(),
//     })
//     .where(eq(messages.id, message.id));
// }

/**
 * Saves message parts (text, tool calls, tool results) to the database
 */
export async function saveMessageParts(
  messageId: string,
  parts: UIMessage['parts']
): Promise<void> {
  // Delete existing parts for this message (in case of updates)
  await db
    .delete(messageParts)
    .where(eq(messageParts.messageId, messageId));

  // Insert all parts
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isFinal = 'isFinal' in part ? Boolean(part.isFinal) : false;

    await db.insert(messageParts).values({
      messageId: messageId,
      partIndex: i,
      type: part.type,
      payload: part,
      isFinal: isFinal,
    });
  }
}

/**
 * Updates message metadata (e.g., token usage, finish reason)
 */
export async function updateMessageMetadata(
  messageId: string,
  metadata: SaveMessageParams['metadata']
): Promise<void> {
  await db
    .update(messages)
    .set({
      metadata,
      updatedAt: new Date(),
    })
    .where(eq(messages.id, messageId));
}


export async function persistStreamResult({
  sessionId,
  allMessages,
  result,
  isNew
}: {
  sessionId: string;
  allMessages: UIMessage[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: StreamTextResult<any, any>;
  isNew?: boolean;
}) {
  const finalText = await result.text;
  const response = await result.response;

  console.log('Stream Finished, saving to database');

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
        const content = message.content;
        if (Array.isArray(content)) {
          for (const part of content) {
            if (typeof part === 'object' && part !== null && 'type' in part && part.type === 'tool-call') {
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
        const content = message.content;
        if (Array.isArray(content)) {
          for (const part of content) {
            if (typeof part === 'object' && part !== null && 'type' in part && part.type === 'tool-result') {
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
  // Build merged parts array
  const mergedParts = [
    ...toolParts,
    ...(finalText ? [{ type: 'text' as const, text: finalText }] : []),
  ];


  const assistantMessage: UIMessage = {
    id: response.id,
    role: 'assistant',
    parts: mergedParts
  }

  console.log(`Assitant message has ${mergedParts.length} parts 
    ${JSON.stringify(mergedParts)}`);

  const finishedMessages = [...allMessages, assistantMessage];
  await saveMessages(sessionId, finishedMessages);


  if (isNew) {
    const firstUserText = extractFirstUserMessage(finishedMessages);
    if (firstUserText) {
      const title = generateSessionTitle(firstUserText);
      await updateSessionMetadata(sessionId, { title });
    }
  }

  // Update session metadata
  await updateSessionMetadata(sessionId, {
    messageCount: finishedMessages.length,
    lastMessageAt: new Date(),
  });
  console.log(`Saved ${finishedMessages.length} messages to session ${sessionId}`);
}

export async function persistAgentResult({
  sessionId,
  allMessages,
  answer,
  isNew,
}: {
  sessionId: string;
  allMessages: UIMessage[];
  answer: string;
  isNew?: boolean;
}) {
  const assistantMessage: UIMessage = {
    id: generateNanoId(),
    role: 'assistant',
    parts: [{ type: 'text', text: answer }],
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

  console.log(`Saved agent result to session ${sessionId}`);
}

// ============================================================================
// Message Retrieval
// ============================================================================

/**
 * Retrieves a chat session with all its messages
 */
export async function getSessionWithMessages(
  sessionId: string
): Promise<SessionWithMessages | null> {
  // Get session
  const session = await db.query.chatSessions.findFirst({
    where: eq(chatSessions.id, sessionId),
  });

  if (!session) {
    return null;
  }

  // Get all messages for this session, ordered by sequence
  const sessionMessages = await db.query.messages.findMany({
    where: eq(messages.sessionId, sessionId),
    orderBy: [messages.sequence],
  });

  // Reconstruct UIMessages by fetching parts for each message
  const uiMessages: UIMessage[] = [];

  for (const msg of sessionMessages) {
    const parts = await db.query.messageParts.findMany({
      where: eq(messageParts.messageId, msg.id),
      orderBy: [messageParts.partIndex],
    });

    // Reconstruct UIMessage
    const uiMessage: UIMessage = {
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      parts: parts.map(p => p.payload) as UIMessage['parts'],
    };

    uiMessages.push(uiMessage);
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    title: session.title,
    isActive: session.isActive,
    messageCount: session.messageCount,
    lastMessageAt: session.lastMessageAt,
    createdAt: session.createdAt,
    messages: uiMessages,
  };
}

/**
 * Gets recent chat sessions for a user
 */
export async function getUserSessions(
  userId: number,
  limit: number = 20
): Promise<Array<{
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
}>> {
  const sessions = await db.query.chatSessions.findMany({
    where: eq(chatSessions.userId, userId),
    orderBy: [desc(chatSessions.lastMessageAt)],
    limit,
  });

  return sessions.map(s => ({
    id: s.id,
    title: s.title,
    messageCount: s.messageCount,
    lastMessageAt: s.lastMessageAt,
    createdAt: s.createdAt,
  }));
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Simple nanoid-like generator for chat IDs
 */
function generateNanoId(size: number = 21): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let id = '';

  for (let i = 0; i < size; i++) {
    id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return id;
}

/**
 * Extracts the first user message text for title generation
 */
export function extractFirstUserMessage(uiMessages: UIMessage[]): string | null {
  const firstUserMessage = uiMessages.find(msg => msg.role === 'user');

  if (!firstUserMessage) {
    return null;
  }

  // Extract text from parts
  const textParts = firstUserMessage.parts
    .filter(part => part.type === 'text')
    .map(part => 'text' in part ? part.text : '')
    .join(' ');

  return textParts || null;
}

