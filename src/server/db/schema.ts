import { pgTable, serial, text, timestamp, jsonb, boolean, integer, index, uniqueIndex, bigserial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(), // linking to clerk user, 
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  profileImageUrl: text('profile_image_url'),
  subscriptionTier: text('subscription_tier').default('free').notNull(),
  preferences: jsonb('preferences').$type<{
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
  }>().default({}),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// chat_sessions
// -----------------------------------------------------------------------------
export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(), // e.g. chat_<nanoid>
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  messageCount: integer('message_count').default(0).notNull(),
  activeStreamId: text('active_stream_id'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('chat_sessions_user_id_idx').on(table.userId),
  userActiveIdx: index('chat_sessions_user_active_idx').on(table.userId, table.isActive),
  activeStreamIdx: index('chat_sessions_active_stream_idx').on(table.activeStreamId),
  lastMessageIdx: index('chat_sessions_last_message_idx').on(table.lastMessageAt),
}));

// -----------------------------------------------------------------------------
// messages
// -----------------------------------------------------------------------------
export const messages = pgTable('messages', {
  id: text('id').primaryKey(), // msg_<nanoid> from AI SDK
  sessionId: text('session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(), // position within the session
  role: text('role').notNull(), // 'user' | 'assistant' | 'system' | 'tool'
  status: text('status')
    .notNull()
    .$type<'pending' | 'streaming' | 'completed' | 'errored'>(),
  content: jsonb('content').$type<unknown>().default(null),
  metadata: jsonb('metadata').$type<{
    finishReason?: string;
    model?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    [key: string]: unknown;
  }>(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sessionSequenceIdx: uniqueIndex('messages_session_sequence_idx')
    .on(table.sessionId, table.sequence),
  sessionStatusIdx: index('messages_session_status_idx')
    .on(table.sessionId, table.status),
}));

// -----------------------------------------------------------------------------
// message_parts
// -----------------------------------------------------------------------------
export const messageParts = pgTable('message_parts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  messageId: text('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  partIndex: integer('part_index').notNull(),
  type: text('type').notNull(), // e.g. text-delta, text, tool-call, tool-result, data-*
  payload: jsonb('payload').$type<unknown>().notNull(),
  isFinal: boolean('is_final').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  messageIndexIdx: uniqueIndex('message_parts_message_index_idx')
    .on(table.messageId, table.partIndex),
  messageFinalIdx: index('message_parts_message_final_idx')
    .on(table.messageId, table.isFinal),
}));

export const resumableStreams = pgTable('resumable_streams', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  messageId: text('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  status: text('status')
    .notNull()
    .$type<'active' | 'completed' | 'cancelled' | 'expired'>(),
  cursor: integer('cursor').default(0).notNull(),
  metadata: jsonb('metadata'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index('resumable_streams_session_idx').on(table.sessionId),
  statusExpiryIdx: index('resumable_streams_status_expiry_idx').on(
    table.status,
    table.expiresAt,
  ),
}));

export const searchQueries = pgTable('search_queries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  query: text('query').notNull(),
  source: text('source').default('web'), // 'web', 'chat', etc.
  resultCount: integer('result_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
