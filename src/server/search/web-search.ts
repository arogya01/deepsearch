// Shared web search logic that can be used by both API routes and tools
import { db } from '@/server/db';
import { searchQueries } from '@/server/db/schema';

export interface WebSearchResult {
  organic?: Array<{
    title: string;
    link: string;
    snippet: string;
    position: number;
  }>;
  answerBox?: {
    answer: string;
    title: string;
    link: string;
  };
  knowledgeGraph?: {
    title: string;
    type: string;
    description: string;
  };
}

export async function performWebSearch(
  query: string,
  userId: number
): Promise<WebSearchResult> {
  // Check API key configuration
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error('SERPER_API_KEY not configured');
  }

  console.log('Performing web search for query:', query);

  const data = JSON.stringify({ q: query });

  // Make API request with error handling
  let response: Response;
  try {
    response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: data,
      redirect: 'follow',
    });
  } catch (error) {
    console.error('Error making request to SERPER API:', error);
    throw new Error('Failed to connect to search service');
  }

  // Check if the API response was successful
  if (!response.ok) {
    console.error('SERPER API returned error:', response.status, response.statusText);
    throw new Error(
      `Search service returned error: ${response.status} ${response.statusText}`
    );
  }

  // Parse response with error handling
  let result: WebSearchResult;
  try {
    const responseText = await response.text();
    result = JSON.parse(responseText) as WebSearchResult;
    console.log('Search results received successfully');

    // Log search query for analytics
    const resultCount = result.organic?.length || 0;
    await db
      .insert(searchQueries)
      .values({
        userId,
        query,
        source: 'web',
        resultCount,
      })
      .catch((error) => {
        console.error('Failed to log search query:', error);
        // Don't fail the request if logging fails
      });

    return result;
  } catch (error) {
    console.error('Error parsing SERPER API response:', error);
    throw new Error('Invalid response from search service');
  }
}



