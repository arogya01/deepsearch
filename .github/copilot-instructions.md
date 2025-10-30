# GitHub Copilot Instructions for DeepSearch

## Project Overview

DeepSearch is a Next.js 15 application that provides deep crawling capabilities to deliver richer and more insightful answers to user queries. The application uses AI-powered search with tool calling and persistent chat sessions.

## Technology Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **UI**: React 19, Tailwind CSS 4, Radix UI components
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis with ioredis
- **Authentication**: Clerk
- **AI**: Vercel AI SDK with Google Gemini
- **Observability**: Langfuse with OpenTelemetry
- **Linting**: ESLint with Next.js TypeScript config

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── actions/           # Server actions
│   ├── api/               # API routes
│   ├── chat/              # Chat interface
│   └── components/        # Page-specific components
├── components/            # Shared React components
│   └── ui/               # Reusable UI components (shadcn/ui)
├── server/               # Server-side logic
│   ├── auth/            # Authentication (Clerk + user sync)
│   ├── db/              # Database schema and queries (Drizzle)
│   ├── redis/           # Redis caching and rate limiting
│   └── search/          # Web search implementation
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── middleware.ts        # Next.js middleware (auth, rate limiting)
```

## Key Architecture Patterns

### Database Schema (Drizzle ORM)
- Use Drizzle ORM for all database interactions
- Schema defined in `src/server/db/schema.ts`
- Tables: `users`, `chatSessions`, `messages`, `searchQueries`
- Always use proper indexes for performance
- Follow cascade delete patterns for related data

### Authentication Flow
- Clerk handles authentication
- User data synced to PostgreSQL via `ensureUserExists()`
- Redis caches user data with TTL
- Protected routes use Clerk middleware in `src/middleware.ts`
- Reference: `AUTH_SETUP.md`

### Redis Caching
- User data cached with 1-hour TTL
- Rate limiting: chat (20 req/hour), search (50 req/hour)
- Session management and last active tracking
- Always handle Redis connection errors gracefully

### AI Tool Calling
- Use Vercel AI SDK with `streamText` and `stopWhen(stepCountIs(5))`
- Tools defined with Zod schemas for validation
- Always persist messages after tool calls complete
- Reference: `TOOL_CALLING_SETUP.md`

## Development Commands

```bash
# Development
npm run dev                 # Start dev server with Turbopack
npm run dev:debug          # Debug mode
npm run dev:debug-brk      # Debug mode with breakpoint

# Build and Lint
npm run build              # Production build
npm run lint               # Run ESLint

# Database (Drizzle)
npm run drizzle:generate   # Generate migrations
npm run drizzle:push       # Push schema to database
npm run drizzle:studio     # Open Drizzle Studio

# Redis
npm run redis:start        # Start Redis container
npm run redis:check        # Check Redis status
npm run redis:stop         # Stop Redis container
npm run redis:cli          # Access Redis CLI
```

## Coding Standards

### TypeScript
- Use strict TypeScript settings
- Avoid `any` types - use proper typing or `unknown`
- Define interfaces for complex data structures
- Use Zod for runtime validation of external data

### React Components
- Use functional components with hooks
- Follow Next.js 15 App Router patterns (Server/Client Components)
- Use "use client" directive only when necessary
- Prefer Server Components for data fetching

### Styling
- Use Tailwind CSS utility classes
- Follow existing component patterns from shadcn/ui
- Use `cn()` utility from `lib/utils.ts` for conditional classes

### API Routes
- Always authenticate users via Clerk
- Implement rate limiting for public endpoints
- Return proper HTTP status codes
- Handle errors gracefully with user-friendly messages

### Database Queries
- Use Drizzle ORM query builder
- Always handle query errors
- Use transactions for multi-table operations
- Index frequently queried columns

### Error Handling
- Use try-catch blocks for async operations
- Log errors with context for debugging
- Return user-friendly error messages
- Never expose sensitive information in errors

## Common Patterns

### Creating a New API Route
```typescript
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { rateLimit } from "@/server/redis";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const rateLimitResult = await rateLimit(userId, "endpoint-name", 10, 3600);
  if (!rateLimitResult.allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  
  // Your logic here
}
```

### Database Query with Error Handling
```typescript
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

try {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user[0];
} catch (error) {
  console.error("Database error:", error);
  throw new Error("Failed to fetch user");
}
```

### Redis Caching Pattern
```typescript
import { redis } from "@/server/redis";

const cacheKey = `user:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

const data = await fetchFromDatabase();
await redis.set(cacheKey, JSON.stringify(data), "EX", 3600);
return data;
```

## Important Files to Reference

- `AUTH_SETUP.md` - Authentication architecture and setup
- `TOOL_CALLING_SETUP.md` - AI tool calling implementation guide
- `README-DEBUG.md` - Debugging instructions
- `src/server/db/schema.ts` - Database schema
- `src/middleware.ts` - Auth and rate limiting middleware
- `src/app/api/chat/route.ts` - Main chat API with AI streaming

## Testing and Debugging

### Before Committing
1. Run `npm run lint` to check for linting errors
2. Run `npm run build` to ensure production build works
3. Test API endpoints with proper authentication
4. Verify database migrations if schema changed

### Debugging
- Use VS Code launch configurations in `.vscode/launch.json`
- Check Redis with `npm run redis:check`
- View database with `npm run drizzle:studio`
- Check logs for Langfuse tracing in production

## Environment Setup

Required environment variables (see `AUTH_SETUP.md`):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key
- `LANGFUSE_*` - Langfuse observability keys

## Security Considerations

- Never commit API keys or secrets
- Always validate user input with Zod schemas
- Use rate limiting for all public endpoints
- Sanitize user data before database insertion
- Use prepared statements (Drizzle handles this)
- Keep dependencies up to date

## Performance Best Practices

- Use Redis caching for frequently accessed data
- Implement proper database indexes
- Use Next.js Image component for images
- Leverage Server Components for data fetching
- Implement proper loading states and Suspense boundaries
- Use streaming responses for AI-generated content

## When Making Changes

1. **Understand existing patterns** - Review similar implementations first
2. **Follow TypeScript types** - Don't bypass type safety
3. **Test with authentication** - Most endpoints require auth
4. **Check rate limits** - Don't trigger rate limit errors during testing
5. **Update documentation** - If changing architecture, update relevant .md files
6. **Verify Redis/DB connections** - Ensure services are running locally
