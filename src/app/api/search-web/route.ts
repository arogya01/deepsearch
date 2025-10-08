
import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/server/auth/user-sync';
import { userCache } from '@/server/redis';
import { performWebSearch } from '@/server/search/web-search';

//create a POST route to search the web for a given query using SERPER API 

export async function POST(req: Request){
    try {
        // Authenticate user with Clerk
        const clerkUser = await currentUser();
        
        if (!clerkUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Sync user data and update last active
        const user = await ensureUserExists(clerkUser);
        await userCache.updateLastActive(user.clerkId);

        // Check rate limiting
        const isLimited = await userCache.isRateLimited(user.clerkId, 'search', 50, 3600); // 50 searches per hour
        if (isLimited) {
            return Response.json({ error: 'Search rate limit exceeded' }, { status: 429 });
        }

        // Parse request body with error handling
        let query: string;
        try {
            const body = await req.json();
            query = body.query;
            
            if (!query || typeof query !== 'string') {
                return Response.json({ error: 'Query parameter is required and must be a string' }, { status: 400 });
            }
        } catch (error) {
            console.error('Error parsing request body:', error);
            return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        // Perform the web search using shared logic
        const result = await performWebSearch(query, user.id);
        return Response.json(result);

    } catch (error) {
        // Catch any unexpected errors
        console.error('Unexpected error in search-web route:', error);
        
        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('SERPER_API_KEY')) {
                return Response.json({ error: error.message }, { status: 500 });
            }
            if (error.message.includes('Failed to connect')) {
                return Response.json({ error: error.message }, { status: 503 });
            }
            if (error.message.includes('Search service returned error')) {
                return Response.json({ error: error.message }, { status: 503 });
            }
            if (error.message.includes('Invalid response')) {
                return Response.json({ error: error.message }, { status: 502 });
            }
        }
        
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}