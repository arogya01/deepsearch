
import FireCrawl from "@mendable/firecrawl-js"; 

export interface WebScraperResult {
    success: boolean; 
    markdown?:string; 
    html?:string; 
     metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
    [key: string]: unknown;
  };
}

export async function performWebScrape(urlToCrawl: string, userId: number) : Promise<WebScraperResult>{
 
    const apiKey = process.env.FIRECRAWL_API_KEY; 
    if(!apiKey){
        throw new Error('FIRECRAWL_API_KEY is not set in environment variables');
    }

    const app = new FireCrawl({
        apiKey: apiKey,
    }); 

    console.log(`Starting web scrape for URL: ${urlToCrawl} by user ID: ${userId}`);

    try {
        const response = await app.scrape(urlToCrawl, {
            formats: ['markdown', 'html'],
        });

        if (!response) {
            throw new Error('Invalid response from FireCrawl API');
        }

        console.log(`Web scrape successful for URL: ${urlToCrawl}`);

        return {
            success: true,
            markdown: response.markdown,
            html: response.html,
            metadata: response.metadata,
        };
    } catch (error) {
        console.error(`Error during web scrape for URL: ${urlToCrawl}`, error);
        throw new Error(`Web scrape failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

}