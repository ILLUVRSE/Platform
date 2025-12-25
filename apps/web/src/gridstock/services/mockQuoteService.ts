// src/services/mockQuoteService.ts
import { Quote, QuoteService, Stock, Fundamentals } from "@gridstock/types";

export const MOCK_STOCKS: Stock[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Cyclical" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial Services" },
  { symbol: "V", name: "Visa Inc.", sector: "Financial Services" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare" },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer Defensive" },
  { symbol: "PG", name: "Procter & Gamble Co.", sector: "Consumer Defensive" },
  { symbol: "XOM", name: "Exxon Mobil Corp.", sector: "Energy" },
  { symbol: "KO", name: "Coca-Cola Co.", sector: "Consumer Defensive" },
  { symbol: "DIS", name: "Walt Disney Co.", sector: "Communication Services" },
  { symbol: "GME", name: "GameStop Corp.", sector: "Consumer Cyclical" },
  { symbol: "AMC", name: "AMC Entertainment", sector: "Communication Services" },
];

export class MockQuoteService implements QuoteService {
  private getMockPrice(symbol: string): number {
    // Generate a consistent but semi-random price based on symbol string
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const basePrice = Math.abs(hash % 500) + 10;
    // Add some jitter
    return basePrice + (Math.random() - 0.5) * 5;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const price = this.getMockPrice(symbol);
    const prevClose = price / (1 + (Math.random() - 0.5) * 0.05); // +/- 2.5%
    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;
    const sector = MOCK_STOCKS.find((s) => s.symbol === symbol.toUpperCase())?.sector || "Unknown";

    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      timestamp: Date.now(),
      volume: Math.floor(Math.random() * 10000000) + 500000,
      marketCap: Math.floor(Math.random() * 2000000000000) + 1000000000,
      peRatio: parseFloat((Math.random() * 50 + 5).toFixed(2)),
      high52Week: parseFloat((price * 1.2).toFixed(2)),
      low52Week: parseFloat((price * 0.8).toFixed(2)),
      dividendYield: parseFloat((Math.random() * 5).toFixed(2)),
      sector,
    };
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    return Promise.all(symbols.map((s) => this.getQuote(s)));
  }

  async getIntraday(symbol: string) {
    const base = this.getMockPrice(symbol);
    const points: { time: number; open: number; high: number; low: number; close: number; volume: number }[] = [];
    const now = Date.now();
    let last = base;
    for (let i = 60; i >= 0; i--) {
      const t = now - i * 5 * 60 * 1000; // every 5 minutes
      const move = (Math.random() - 0.5) * 1.5;
      const open = last;
      const close = open + move;
      const high = Math.max(open, close) + Math.random();
      const low = Math.min(open, close) - Math.random();
      const volume = Math.floor(Math.random() * 50000) + 10000;
      points.push({
        time: t,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume,
      });
      last = close;
    }
    return points;
  }

  async getFundamentals(symbol: string): Promise<Fundamentals> {
    return {
      symbol: symbol.toUpperCase(),
      marketCap: Math.floor(Math.random() * 500_000) * 1_000_000,
      peRatio: parseFloat((Math.random() * 40 + 5).toFixed(2)),
      forwardPE: parseFloat((Math.random() * 35 + 5).toFixed(2)),
      eps: parseFloat((Math.random() * 10).toFixed(2)),
      revenueTTM: Math.floor(Math.random() * 200_000) * 1_000_000,
      profitMargin: parseFloat((Math.random() * 40).toFixed(2)),
      dividendYield: parseFloat((Math.random() * 5).toFixed(2)),
      beta: parseFloat((Math.random() * 2).toFixed(2)),
    };
  }

  async searchStocks(query: string): Promise<Stock[]> {
    const lowerQuery = query.toLowerCase();
    return MOCK_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(lowerQuery) ||
        s.name.toLowerCase().includes(lowerQuery)
    );
  }
}
