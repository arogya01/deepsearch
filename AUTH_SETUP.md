# Authentication Setup Guide

This document explains how the Clerk + Drizzle + PostgreSQL + Redis authentication architecture works in your DeepSearch application.

## Architecture Overview

```
User Authentication Flow:
User Login/Signup → Clerk Auth → API Routes → Database Sync → Redis Cache
```

## Components

### 1. Clerk Authentication
- Handles user sign-up, sign-in, and session management
- Provides JWT tokens and user data
- Already configured in `src/middleware.ts` and `src/app/layout.tsx`

### 2. Database Schema (`src/server/db/schema.ts`)
- **users**: Core user data synced from Clerk
- **chatSessions**: User chat history and sessions
- **searchQueries**: Search analytics and user queries

### 3. User Synchronization (`src/server/auth/user-sync.ts`)
- `ensureUserExists()`: Creates/updates user in database from Clerk data
- `getUserByClerkId()`: Fetches user by Clerk ID
- `updateUserPreferences()`: Updates user preferences
- `updateUserSubscription()`: Manages subscription tiers

### 4. Redis Caching (`src/server/redis/index.ts`)
- User data caching with TTL
- Session management
- Rate limiting for API endpoints
- Last active tracking

### 5. Protected API Routes
- **Chat API** (`/api/chat`): Authentication + rate limiting (20 req/hour)
- **Search API** (`/api/search-web`): Authentication + rate limiting (50 req/hour) + query logging
- **User Profile API** (`/api/user/profile`): GET/PATCH user data with caching

## Environment Variables Required

Make sure you have these environment variables set:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/deepsearch

# Redis (optional, defaults to localhost:6379)
REDIS_URL=redis://localhost:6379

# Search API
SERPER_API_KEY=your_serper_api_key
```

## Usage Examples

### 1. Getting Current User in API Routes
```typescript
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/server/auth/user-sync';

export async function POST(req: Request) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = await ensureUserExists(clerkUser);
  // Use user.id for database operations
}
```

### 2. Rate Limiting
```typescript
import { userCache } from '@/server/redis';

const isLimited = await userCache.isRateLimited(user.clerkId, 'api-endpoint', 100, 3600);
if (isLimited) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### 3. Caching User Data
```typescript
// Set cache
await userCache.setUser(clerkId, userData);

// Get from cache
const cachedUser = await userCache.getUser(clerkId);
```

## Database Migrations

1. Generate migrations: `npm run drizzle:generate`
2. Push to database: `npm run drizzle:push`
3. Open studio: `npm run drizzle:studio`

## Data Flow

1. **User signs in** → Clerk handles authentication
2. **API request made** → Middleware validates Clerk session
3. **API route called** → `ensureUserExists()` syncs user data
4. **Database sync** → User data stored/updated in PostgreSQL
5. **Redis cache** → Frequently accessed data cached
6. **Rate limiting** → Redis tracks API usage per user
7. **Analytics** → Search queries logged for insights

## Features Implemented

✅ User authentication with Clerk
✅ Database schema for users, chat sessions, and search queries
✅ User synchronization between Clerk and database
✅ Redis caching for performance
✅ Rate limiting per user
✅ Search query analytics
✅ User preferences management
✅ Protected API routes
✅ Session tracking

## Next Steps

- Set up Clerk webhooks for real-time user sync
- Implement subscription management
- Add user dashboard
- Set up analytics dashboard
- Configure production Redis
- Add more user preference options
