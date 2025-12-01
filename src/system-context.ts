type QuerySearchResult = {
  date: string;
  title: string;
  url: string;
  snippet: string;
};

type QueryResult = {
  query: string;
  result: QuerySearchResult[];
};

type ScrapeResult = {
  url: string;
  result: string;
};

type Message = { role: "user" | "assistant" | "system"; content: string };

export class SystemContext {
  // the current step in the loop
  private userQuestion: string = "";
  private step = 0;
  // the history of all queries searched
  private queryHistory: QueryResult[] = [];
  // the history of all URL's scraped
  private scrapeHistory: ScrapeResult[] = [];
  // the history of all messages
  private messages: Message[] = [];

  getStep() {
    return this.step;
  }

  incrementStep() {
    this.step++;
  }

  setQuestion(question: string) {
    this.userQuestion = question;
  }

  getQuestion(): string {
    return this.userQuestion;
  }

  getContextSummary(): string {
    let summary = "";
    if (this.queryHistory.length > 0) {
      summary += "## Search Results \n";
      for (const q of this.queryHistory) {
        summary += `\nQuery: "${q.query}"`;
        for (const r of q.result) {
          summary += `- [${r.title}](${r.url}): ${r.snippet}\n`;
        }
      }
    }

    if (this.scrapeHistory.length > 0) {
      summary += "\n## Scraped Content\n";
      for (const s of this.scrapeHistory) {
        summary += `\nURL: ${s.url}\n`;
        summary += `Content:\n${s.result.slice(0, 2000)}...\n`;
      }
    }

    if (!summary) {
      summary = "No Research Collected yet.";
    }

    return summary;
  }

  shouldStop() {
    return this.step >= 10;
  }

  reportQueries(queries: QueryResult[]) {
    return this.queryHistory.push(...queries);
  }

  reportScrapes(scrapes: ScrapeResult[]) {
    return this.scrapeHistory.push(...scrapes);
  }

  addMessage(message: Message) {
    this.messages.push(message);
  }

  getMessages(): Message[] {
    return this.messages;
  }
}
