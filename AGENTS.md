# DeepSearch AI Coding Agent Guide

## Commands
- **Build**: `npm run build` - Build production Next.js app
- **Lint**: `npm run lint` - Run ESLint
- **Dev**: `npm run dev` - Start dev server with Turbopack
- **Database**: `npm run drizzle:push` - Push schema changes, `npm run drizzle:studio` - Open DB studio
- **Redis**: `npm run redis:start` - Start Redis container, `npm run redis:check` - Check connection
- **Test**: No test framework configured (check with user if needed)

## Architecture
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript (strict mode)
- **Database**: PostgreSQL with Drizzle ORM (schema: `src/server/db/schema.ts`)
- **Cache**: Redis (via ioredis)
- **Auth**: Clerk (`@clerk/nextjs`)
- **AI**: Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/google`)
- **Observability**: Langfuse tracing + OpenTelemetry
- **Structure**: `src/app/` (routes/components), `src/server/` (auth/db/redis/search), `src/lib/` (utilities), `src/components/` (shared UI)

## Code Style
- **Imports**: Use `@/*` alias for src imports (e.g., `@/components/ui/button`)
- **Typing**: TypeScript strict mode enabled, avoid `any`
- **Conventions**: Use "use client" for client components, server components by default
- **UI**: shadcn/ui + Radix UI components with Tailwind CSS v4
