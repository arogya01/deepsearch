

import { currentUser } from '@clerk/nextjs/server';
import { ensureUserExists } from '@/server/auth/user-sync';
import { userCache } from '@/server/redis';
import { db } from '@/server/db';
import { searchQueries } from '@/server/db/schema';

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

        // Check API key configuration
        const apiKey = process.env.SERPER_API_KEY;
        if (!apiKey) {
            return Response.json({ error: 'SERPER_API_KEY not configured' }, { status: 500 });
        }
        
        console.log('calling search-web tool for query:', query);

        const data = JSON.stringify({
            "q": query
        });

        // Make API request with error handling
        let response: Response;
        try {
            response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: { 
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                },
                body: data, 
                redirect: "follow"
            });
        } catch (error) {
            console.error('Error making request to SERPER API:', error);
            return Response.json({ error: 'Failed to connect to search service' }, { status: 503 });
        }

        // Check if the API response was successful
        if (!response.ok) {
            console.error('SERPER API returned error:', response.status, response.statusText);
            return Response.json({ 
                error: `Search service returned error: ${response.status} ${response.statusText}` 
            }, { status: response.status === 429 ? 429 : 503 });
        }
        
        // Parse response with error handling
        let result: unknown;
        try {
            const responseText = await response.text();
            result = JSON.parse(responseText);
            console.log('Search results received successfully',responseText);
            
            // Log search query for analytics
            const resultCount = (result as any)?.organic?.length || 0;
            await db.insert(searchQueries).values({
                userId: user.id,
                query,
                source: 'web',
                resultCount,
            }).catch(error => {
                console.error('Failed to log search query:', error);
                // Don't fail the request if logging fails
            });
            
            return Response.json(result);
        } catch (error) {
            console.error('Error parsing SERPER API response:', error);
            return Response.json({ error: 'Invalid response from search service' }, { status: 502 });
        }

    } catch (error) {
        // Catch any unexpected errors
        console.error('Unexpected error in search-web route:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}