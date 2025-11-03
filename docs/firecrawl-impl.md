---
name: Firecrawl Web Scraping Integration
description: Implementation plan for integrating Firecrawl as a web scraping tool to enable the LLM to extract detailed content from specific web pages
---

# Firecrawl Web Scraping Integration

## Overview
This document outlines the integration of Firecrawl as a web scraping tool to enable the LLM to extract detailed content from specific web pages.

## Current Status
- **Package**: `@mendable/firecrawl-js` - NOT YET INSTALLED
- **API Key**: Already configured in `.env` as `FIRECRAWL_API_KEY`

## Implementation Plan

### 1. Install Dependencies
```bash
npm install @mendable/firecrawl-js
```

### 2. Create Web Scraper Module
**File**: `src/server/search/web-scraper.ts`

**Features**:
- Import FirecrawlApp from `@mendable/firecrawl-js`
- Define `WebScraperResult` interface with:
  - `success: boolean`
  - `markdown: string`
  - `html?: string`
  - `metadata?: object` (title, description, language, sourceURL, etc.)
- Implement `performWebScrape(urlToCrawl: string, userId: number)` function
  - Validates `FIRECRAWL_API_KEY` from environment
  - Creates FirecrawlApp instance
  - Calls `app.scrapeUrl()` with formats: `['markdown', 'html']`
  - Comprehensive error handling
  - Console logging for debugging
  - Database logging to `searchQueries` table (source: 'web-scraper')

### 3. Update Chat Route
**File**: `src/app/api/chat/route.ts`

**Changes**:
- Add import: `import { performWebScrape } from '@/server/search/web-scraper';`
- Update `webScraper` tool:
  - Fix schema: `z.string().url().min(1).max(500)`
  - Add `execute` function that calls `performWebScrape(urlToCrawl, user.id)`
  - Error handling and logging
- Update system prompt:
  - Add: "Use the webScraper tool to extract detailed content from specific web pages when you have a URL."

## Configuration

### Rate Limiting
- Uses same rate limit as web search (20 requests per hour per user)
- Shares the chat rate limit counter

### Database Logging
- Scrapes are logged to `searchQueries` table
- Source field: `'web-scraper'`
- Query field: stores the scraped URL
- Result count: always 1

### API Configuration
```env
FIRECRAWL_API_KEY=fc-e6b4759506184b6bac42b7278e125346
```

## Tool Behavior

### When to Use Each Tool

**`searchWeb`**: 
- Finding pages based on keywords
- Getting search results with titles and snippets
- Discovering URLs to scrape

**`webScraper`**:
- Extracting full content from a known URL
- Getting detailed page text in markdown format
- Accessing structured page metadata

### LLM Workflow Example
1. User asks: "What's on the homepage of example.com?"
2. LLM calls `webScraper` with URL: "https://example.com"
3. Tool returns markdown content + metadata
4. LLM synthesizes response from scraped content

## Error Handling

### Common Errors
- Missing API key: "Firecrawl API key is invalid or missing"
- Rate limit exceeded: "Firecrawl API rate limit exceeded. Please try again later."
- Timeout: "Scraping timeout for URL: {url}"
- General errors: "Web scraping failed: {error message}"

### Logging
All operations are logged with `[WebScraper]` prefix:
- Scrape start
- API calls
- Success/failure
- Database logging attempts

## Multi-Step Tool Calling

The LLM can chain tools together (up to 5 steps via `stepCountIs(5)`):
1. Search for information (`searchWeb`)
2. Scrape top result URL (`webScraper`)
3. Analyze scraped content
4. Search for related information
5. Final response synthesis

## Implementation Details

### WebScraperResult Interface
```typescript
export interface WebScraperResult {
  success: boolean;
  markdown: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
    [key: string]: unknown;
  };
}
```

### performWebScrape Function
```typescript
export async function performWebScrape(
  urlToCrawl: string,
  userId: number
): Promise<WebScraperResult> {
  // Validate API key
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is not configured');
  }

  // Initialize Firecrawl client
  const app = new FirecrawlApp({ apiKey });

  // Perform the scrape with both markdown and html formats
  const scrapeResult = await app.scrapeUrl(urlToCrawl, {
    formats: ['markdown', 'html'],
  });

  // Log to database
  await db.insert(searchQueries).values({
    userId,
    query: urlToCrawl,
    source: 'web-scraper',
    resultCount: 1,
    createdAt: new Date(),
  });

  // Format and return the result
  return {
    success: true,
    markdown: scrapeResult.markdown || '',
    html: scrapeResult.html,
    metadata: {
      title: scrapeResult.metadata?.title,
      description: scrapeResult.metadata?.description,
      language: scrapeResult.metadata?.language,
      sourceURL: scrapeResult.metadata?.sourceURL || urlToCrawl,
      ...scrapeResult.metadata,
    },
  };
}
```

## Next Steps

1. ✅ Install `@mendable/firecrawl-js`
2. ✅ Create `src/server/search/web-scraper.ts`
3. ✅ Update `src/app/api/chat/route.ts`
4. ✅ Restart development server
5. ✅ Test scraping functionality

## Testing

### Manual Test
```typescript
// In chat interface, ask:
"Can you scrape https://example.com and tell me what's on it?"
```

### Expected Flow
1. LLM recognizes URL in request
2. Calls `webScraper` tool
3. Firecrawl scrapes the page
4. Returns markdown + HTML + metadata
5. LLM provides summary of page content

## Maintenance Notes

- Firecrawl API key should be rotated periodically
- Monitor rate limits in Firecrawl dashboard
- Check database logs for scraping analytics
- Update max URL length if needed (currently 500 chars)
