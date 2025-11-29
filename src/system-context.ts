

type QuerySearchResult = {
    date: string; 
    title: string; 
    url: string; 
    snippet: string; 
}; 

type QueryResult = {
    query: string; 
    result: QuerySearchResult[]; 
}

type ScrapeResult = {
    url:string; 
    result: string; 
}


export class SystemContext{
    // the current step in the loop 
    private step = 0; 
    // the history of all queries searched
    private queryHistory: QueryResult[] = []; 
    // the history of all URL's scraped
    private scrapeHistory: ScrapeResult[] = [];     
    

    shouldStop(){
        return this.step >= 10; 
    }

    reportQueries(queries: QueryResult[]){
        return this.queryHistory.push(...queries); 
    }

    reportScrapes(scrapes: ScrapeResult[]){
        return this.scrapeHistory.push(...scrapes); 
    }

}