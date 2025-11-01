# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeepSearch is a Next.js 15 AI chat application with deep web search capabilities. It features resumable streaming for AI responses, allowing users to refresh or close tabs without losing progress. The app uses Google's Gemini 2.5 Flash model via the AI SDK, with Clerk authentication, PostgreSQL database (via Drizzle ORM), and Redis for caching and stream persistence.

## Development Commands

### Running the Application
```bash
npm run dev              # Start Next.js dev server with Turbopack
npm run dev:debug        # Start with Node inspector
npm run dev:debug-brk    # Start with Node inspector (break on start)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

### Database (Drizzle ORM)
```bash
npm run drizzle:generate # Generate migration files from schema
npm run drizzle:push     # Push schema changes to database
npm run drizzle:studio   # Open Drizzle Studio GUI
```

**Important**: After modifying `src/server/db/schema.ts`, run `drizzle:generate` to create migrations, then `drizzle:push` to apply them.

### Redis (Docker-based)
```bash
npm run redis:start      # Start/create Redis container
npm run redis:check      # Check if Redis is running
npm run redis:stop       # Stop Redis container
npm run redis:logs       # View Redis container logs
npm run redis:cli        # Open Redis CLI (password: arogya30)
npm run redis:insight    # Open RedisInsight (if installed)
```

Redis is required for:
- User session caching and rate limiting
- Resumable stream persistence (stream state survives tab close/refresh)

## Architecture

### Request Flow (Chat API)
1. **POST /api/chat** - User sends message
   - Authenticates via Clerk
   - Rate limiting check (20 req/hour via Redis)
   - Creates/retrieves chat session from PostgreSQL
   - Clears any previous `activeStreamId`
   - Streams AI response using AI SDK's `streamText`
   - On tool calls, executes `searchWeb` tool (Serper API)
   - Saves messages to PostgreSQL with sequence numbers
   - Creates resumable stream in Redis with unique ID
   - Stores `activeStreamId` in session metadata

2. **GET /api/chat/[id]/stream** - Resume interrupted stream
   - Authenticates via Clerk
   - Loads session metadata (fast query, no messages)
   - Returns 204 if no `activeStreamId`
   - Resumes stream from Redis cursor position if active

### Core Components

**Server Layer (`src/server/`)**
- `db/` - Drizzle schema, migrations, and persistence utilities
  - `schema.ts` - Database tables: users, chatSessions, messages, messageParts, resumableStreams, searchQueries
  - `chat-persistence.ts` - Session CRUD, message saving, title generation
  - `sessions.ts` - Session metadata queries
  - `types.ts` - TypeScript interfaces for DB entities
- `redis/` - Redis clients and stream context
  - `index.ts` - Singleton Redis client, UserCache class for rate limiting
  - `resumable-stream.ts` - `createResumableStreamContext` config with ioredis pub/sub
- `auth/` - Clerk user synchronization
  - `user-sync.ts` - `ensureUserExists()` syncs Clerk user to PostgreSQL
- `search/` - Web search integration
  - `web-search.ts` - `performWebSearch()` using Serper API, logs queries to DB

**API Routes (`src/app/api/`)**
- `chat/route.ts` - POST handler for new messages
- `chat/[id]/stream/route.ts` - GET handler for resuming streams
- `search-web/route.ts` - Standalone search endpoint
- `user/profile/route.ts` - User profile operations

**Client Components (`src/app/components/`)**
- `chat-window.tsx` - Main chat UI using AI SDK's `useChat` hook with `resume: true`
- `tool-call-card.tsx` - Displays searchWeb tool calls with expandable results

**Instrumentation**
- `src/instrumentation.ts` - Langfuse + OpenTelemetry setup for AI observability
  - Auto-traces AI SDK operations via `experimental_telemetry: { isEnabled: true }`
  - Filters out Next.js infra spans
  - Uses `@langfuse/otel` span processor

### Key Design Patterns

**Resumable Streams**
- Streams stored in Redis with TTL (default expiration)
- Each stream has unique ID, stored in `chatSessions.activeStreamId`
- Client automatically resumes on mount if `activeStreamId` exists
- Stop button removed (abort signal incompatible with resumable streams)
- See `RESUMABLE_STREAMS_IMPLEMENTATION.md` for full flow diagram

**Database Structure**
- Sessions have `messageCount` for efficient pagination
- Messages use `sequence` field for ordering within session
- Message parts stored separately for streaming updates
- All relationships use `onDelete: cascade`

**Observability**
- Langfuse integration via OpenTelemetry (passive tracing)
- AI SDK telemetry automatically captures generations
- Environment vars (LANGFUSE_*) are optional for development
- See `LANGFUSE_ANALYSIS.md` for coverage gaps and improvement suggestions

**Authentication & Caching**
- Clerk for user auth (requires CLERK_* env vars)
- User data synced to PostgreSQL on each request
- Redis caches user data (1hr TTL) to reduce DB queries
- Rate limiting stored in Redis (per-user, per-endpoint)

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection (format: `redis://:password@localhost:6379`)
- `CLERK_SECRET_KEY` - Clerk authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk client-side
- `SERPER_API_KEY` - Serper web search API
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Gemini API

Optional (Langfuse observability):
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_HOST`

## Common Workflows

### Adding a New Tool to AI
1. Add tool definition in `src/app/api/chat/route.ts` `tools` object
2. Implement execute function (async operations supported)
3. Update `src/app/components/tool-call-card.tsx` if custom UI needed
4. Tool calls automatically logged via Langfuse telemetry

### Adding Database Tables
1. Define table in `src/server/db/schema.ts` using Drizzle schema
2. Add TypeScript types in `src/server/db/types.ts`
3. Run `npm run drizzle:generate` to create migration
4. Run `npm run drizzle:push` to apply to database
5. Add utility functions in relevant `src/server/db/*.ts` file

### Modifying Stream Behavior
- Stream config in `src/app/api/chat/route.ts` `streamText()` call
- Model selection: `google('gemini-2.5-flash')` (can swap to other AI SDK providers)
- System prompt in `system` array
- Resumable stream context in `src/server/redis/resumable-stream.ts`
- **Stream TTL**: 24 hours (hardcoded in resumable-stream package)
- **Never add abort/stop functionality** (incompatible with resumable streams)
  - `abortSignal` is intentionally removed from `streamText()` config
  - Streams continue running even when user closes/refreshes tab
  - Client stop button removed, users start new messages to abandon streams

### Debugging Redis Issues
```bash
npm run redis:check     # Verify container running
npm run redis:logs      # Check for errors
npm run redis:cli       # Inspect keys directly
> KEYS resumable-stream:*   # List active streams
> KEYS user:*               # List cached users
> KEYS session:*            # List cached sessions
> GET resumable-stream:{streamId}  # View stream data
> TTL resumable-stream:{streamId}  # Check expiration time
```

### Debugging Stream Lifecycle
Server logs include structured logging with prefixes:
- `[STREAM-CREATE]` - Stream creation events (shows streamId, sessionId, timestamp)
- `[STREAM-RESUME]` - Resume attempts (shows success ✓ or failure ✗)
- `[STREAM-FINISH]` - Stream completion (shows finishReason, usage metrics)
- `[STREAM-ERROR]` - Stream errors (includes full error details and stack traces)

Example log search:
```bash
# View all stream lifecycle events
npm run dev | grep "STREAM-"

# Track specific stream
npm run dev | grep "streamId123"

# Monitor resume attempts
npm run dev | grep "STREAM-RESUME"
```

### Testing Resumable Streams
1. Start chat with long query (triggers web search)
2. Refresh page mid-stream (Cmd/Ctrl+R)
3. Check DevTools Network tab for GET `/api/chat/[id]/stream` request
4. Response should continue from cursor position

## Important Notes

- **Abort Signal Intentionally Removed**: The `abortSignal: req.signal` parameter is **not** used in `streamText()` because it's incompatible with resumable streams. When users close/refresh tabs, streams continue running in background for resumption. This is by design.
- **Stop Button Removed**: Client UI has no stop button. Users start new messages to abandon old streams (which clears `activeStreamId`).
- **Stream Expiration**: Streams expire after 24 hours (hardcoded in resumable-stream package). Expired streams return 410 Gone with helpful error message.
- **Enhanced Logging**: Stream lifecycle events logged with `[STREAM-CREATE]`, `[STREAM-RESUME]`, `[STREAM-FINISH]`, and `[STREAM-ERROR]` prefixes for easy debugging.
- **Rate Limiting**: Enforced via Redis (`UserCache.isRateLimited()`), currently 20 requests/hour per user for chat endpoint.
- **Message Persistence**: Messages saved with `after()` hook (Next.js background task) to avoid blocking stream response.
- **Session Titles**: Auto-generated from first user message using `generateSessionTitle()`.
- **Search Query Logging**: All web searches logged to `searchQueries` table for analytics.
- **Multi-tab Support**: Multiple browser tabs can connect to same resumable stream simultaneously.
