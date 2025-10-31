# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start Next.js dev server with Turbopack
- `npm run dev:debug` - Start dev server with Node.js inspector
- `npm run dev:debug-brk` - Start dev server with Node.js inspector (break on start)
- `npm run build` - Build production Next.js application
- `npm start` - Start production server
- `npm run lint` - Run ESLint checks

### Database (Drizzle ORM + PostgreSQL)
- `npm run drizzle:generate` - Generate migrations from schema changes
- `npm run drizzle:push` - Push schema changes to database (without migrations)
- `npm run drizzle:studio` - Open Drizzle Studio for database management

### Redis (Docker-based)
- `npm run redis:start` - Start Redis container (script: `./start-redis.sh`)
- `npm run redis:check` - Check Redis connection
- `npm run redis:stop` - Stop Redis container
- `npm run redis:logs` - View Redis container logs
- `npm run redis:cli` - Open Redis CLI (password: arogya30)
- `npm run redis:insight` - Open RedisInsight application

### Testing
No test framework is currently configured. Ask user before setting up tests.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 19 + shadcn/ui + Radix UI + Tailwind CSS v4
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Redis (via ioredis)
- **Authentication**: Clerk
- **AI**: Vercel AI SDK with Google Gemini 2.5 Flash
- **Observability**: Langfuse + OpenTelemetry
- **Search**: Serper API for web search

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/         # Streaming chat with AI + tool calling
│   │   ├── search-web/   # Web search endpoint
│   │   └── user/         # User profile management
│   ├── chat/             # Chat UI routes
│   ├── components/       # Page-specific components
│   ├── actions/          # Server actions
│   └── utils/            # Page-level utilities
├── components/            # Shared UI components
│   ├── ui/               # shadcn/ui components
│   ├── app-sidebar.tsx   # Application sidebar
│   └── conditional-header.tsx
├── server/                # Backend logic
│   ├── auth/             # User sync with Clerk
│   │   └── user-sync.ts  # ensureUserExists(), getUserByClerkId()
│   ├── db/               # Database layer
│   │   ├── schema.ts     # Drizzle schema definitions
│   │   ├── chat-persistence.ts  # Chat/message CRUD
│   │   ├── sessions.ts   # Session management
│   │   └── types.ts      # Type definitions
│   ├── redis/            # Redis cache layer
│   │   └── index.ts      # UserCache class, rate limiting
│   └── search/           # Search functionality
│       └── web-search.ts # performWebSearch()
├── lib/                   # Shared utilities
├── hooks/                 # React hooks
├── middleware.ts          # Clerk auth + route protection
└── instrumentation.ts     # Langfuse/OpenTelemetry setup
```

### Database Schema

**users** - User accounts synced from Clerk
- Links via `clerkId` to Clerk users
- Tracks `subscriptionTier`, `preferences`, `lastActiveAt`

**chatSessions** - Chat conversations
- Each session has a unique ID (format: `chat_<nanoid>`)
- References `userId`, tracks `title`, `isActive`, `messageCount`

**messages** - Individual messages in sessions
- Stores role (`user|assistant|system|tool`), status, metadata
- Each message has ordered `sequence` within session

**messageParts** - Granular message content
- Stores text, tool calls, tool results as separate parts
- Supports streaming with `isFinal` flag

**resumableStreams** - Stream resumption state
- Enables pausing/resuming long-running AI responses

**searchQueries** - Analytics for search usage
- Logs user searches for insights

### Key Patterns

#### Authentication Flow
1. Clerk handles auth in `middleware.ts` (protects `/chat` routes)
2. API routes call `currentUser()` from Clerk
3. `ensureUserExists()` syncs user data to PostgreSQL
4. Redis caches user data with 1-hour TTL
5. Rate limiting via Redis (20 chat requests/hour, 50 search requests/hour)

#### AI Tool Calling (Vercel AI SDK v5)
Located in: `src/app/api/chat/route.ts`

- Uses `streamText()` with `stopWhen: stepCountIs(5)` for multi-step execution
- Tool: `searchWeb` - calls `performWebSearch()` to query Serper API
- Model: Google Gemini 2.5 Flash
- Returns `toUIMessageStreamResponse()` for `useChat` hook
- Saves final messages to DB after stream completion
- Langfuse observability tracks each generation

#### Message Persistence
- Uses `upsert` pattern to handle sequence conflicts gracefully
- Stores message parts separately for structured tool results
- Updates session metadata (title, message count, last message time)
- Auto-generates session titles from first user message

#### Redis Usage
- User data caching (TTL: 1 hour)
- Session data caching
- Rate limiting counters
- Last active tracking

### Import Aliases
Always use `@/*` for imports:
```typescript
import { Button } from '@/components/ui/button'
import { db } from '@/server/db'
import { userCache } from '@/server/redis'
```

### Code Conventions
- **Client Components**: Add `"use client"` directive at top
- **Server Components**: Default (no directive needed)
- **TypeScript**: Strict mode enabled, avoid `any`
- **Styling**: Use Tailwind CSS v4 utilities
- **UI Components**: Prefer shadcn/ui components from `@/components/ui/`

## Environment Variables

Required for development:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/deepsearch

# Redis
REDIS_URL=redis://localhost:6379

# Search API
SERPER_API_KEY=your_serper_api_key

# Langfuse (optional)
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
```

## Development Workflow

### Starting the Application
1. Start Redis: `npm run redis:start`
2. Check Redis connection: `npm run redis:check`
3. Ensure PostgreSQL is running with DATABASE_URL configured
4. Push DB schema: `npm run drizzle:push` (first time only)
5. Start dev server: `npm run dev`
6. Open http://localhost:3000

### Making Schema Changes
1. Edit `src/server/db/schema.ts`
2. Generate migration: `npm run drizzle:generate`
3. Push changes: `npm run drizzle:push`
4. Verify in Drizzle Studio: `npm run drizzle:studio`

### Adding New AI Tools
See `TOOL_CALLING_SETUP.md` for detailed guide on:
- Defining new tools with Zod schemas
- Multi-step tool execution
- Handling tool results in UI
- Common pitfalls and debugging

### Authentication Setup
See `AUTH_SETUP.md` for:
- Clerk + Drizzle + Redis integration
- User sync patterns
- Rate limiting implementation
- Protected route configuration

## Important Notes

### AI SDK v5 Multi-Step Tool Calling
**CRITICAL**: Always use `stopWhen: stepCountIs(5)` in `streamText()` calls. Without this, the model will call tools but never generate a final response using the tool results.

### Database Persistence
Messages are saved **after** the stream completes. The code handles converting AI SDK's `ModelMessage[]` (with `input/output` fields) to `UIMessage[]` format (with `args/result` fields) for persistence.

### Redis Password
The Redis container password is hardcoded as `arogya30` in scripts. Use environment variable for production.

### Turbopack
Development server uses Turbopack for faster builds. Some features may differ from webpack.

## Helpful Scripts

Located in repository root:
- `start-database.sh` - Database initialization script
- `start-redis.sh` - Redis Docker container setup
- `check-redis.sh` - Redis connection test
- `start-redis-ui.sh` - RedisInsight launcher
