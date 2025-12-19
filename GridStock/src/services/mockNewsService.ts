// src/services/mockNewsService.ts
import { NewsArticle, NewsService } from "@/types";

const HEADLINE_TEMPLATES = [
  "{TICKER} reports strong earnings beat",
  "{TICKER} faces regulatory headwinds",
  "Why {TICKER} is trending today",
  "Analyst upgrades {TICKER} to Buy",
  "{TICKER} announces new product line",
  "Market volatility impacts {TICKER}",
  "Insiders are buying {TICKER}",
  "{TICKER} CEO speaks on future growth",
  "Investors worried about {TICKER} debt",
  "{TICKER} hits 52-week high",
];

const SOURCES = ["CNBC", "Bloomberg", "Reuters", "Financial Times", "Wall Street Journal"];

export class MockNewsService implements NewsService {
  private generateNews(symbol?: string): NewsArticle {
    const ticker = symbol || "MARKET";
    const template = HEADLINE_TEMPLATES[Math.floor(Math.random() * HEADLINE_TEMPLATES.length)];
    const headline = template.replace("{TICKER}", ticker);
    
    return {
      id: Math.random().toString(36).substring(7),
      headline,
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      url: "#",
      timestamp: Date.now() - Math.floor(Math.random() * 86400000), // Within last 24h
      relatedTickers: [ticker],
    };
  }

  async getNewsForTicker(symbol: string): Promise<NewsArticle[]> {
    // Generate 3-5 articles
    const count = Math.floor(Math.random() * 3) + 3;
    return Array.from({ length: count }).map(() => this.generateNews(symbol));
  }

  async getGeneralNews(): Promise<NewsArticle[]> {
     const count = 5;
     const majorTickers = ["AAPL", "TSLA", "SPY", "BTC", "NVDA"];
     return Array.from({ length: count }).map(() => 
        this.generateNews(majorTickers[Math.floor(Math.random() * majorTickers.length)])
     );
  }
}
