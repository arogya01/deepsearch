import { pgTable, serial, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(), // linking to clerk user
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

// Chat/Search history table for user sessions
export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull(),
  title: text('title'),
  messages: jsonb('messages').$type<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metaData?:{
      toolCalls: any[]; // any[] because toolCalls can be of any type
      searchResults: any[];
    }
  }>>().default([]),
  isActive: boolean('is_active').default(true),
  messageCount: integer('message_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Search queries for analytics
export const searchQueries = pgTable('search_queries', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  query: text('query').notNull(),
  source: text('source').default('web'), // 'web', 'chat', etc.
  resultCount: serial('result_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
