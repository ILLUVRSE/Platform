// src/types/index.ts

export interface Stock {
  symbol: string;
  name: string;
  sector?: string;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  high52Week: number;
  low52Week: number;
  dividendYield: number;
  sector?: string;
}

export interface Fundamentals {
  symbol: string;
  marketCap: number;
  peRatio: number;
  forwardPE?: number;
  eps: number;
  revenueTTM?: number;
  profitMargin?: number;
  dividendYield?: number;
  beta?: number;
}

export interface Candle {
  time: number; // ms epoch
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  url: string;
  timestamp: number;
  relatedTickers: string[];
}

export interface Grid {
  id: string;
  name: string;
  tickers: string[];
  pollIntervalMs?: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: number;
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  averageCost: number;
}

export interface Portfolio {
  cashBalance: number;
  positions: PortfolioPosition[];
  transactions: Transaction[];
}

export type AlertDirection = "above" | "below";

export interface PriceAlert {
  id: string;
  symbol: string;
  target: number;
  direction: AlertDirection;
  createdAt: number;
  note?: string;
}

// Services

export interface QuoteService {
  getQuote(symbol: string): Promise<Quote>;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  searchStocks(query: string): Promise<Stock[]>;
  getIntraday?(symbol: string): Promise<Candle[]>;
  getFundamentals?(symbol: string): Promise<Fundamentals>;
}

export interface NewsService {
  getNewsForTicker(symbol: string): Promise<NewsArticle[]>;
  getGeneralNews(): Promise<NewsArticle[]>;
}

export interface StorageService {
  // Grids
  getGrids(): Grid[];
  saveGrid(grid: Grid): void;
  deleteGrid(id: string): void;
  
  // Portfolio
  getPortfolio(): Portfolio;
  savePortfolio(portfolio: Portfolio): void;
  
  // Initialization
  initializeDefaults(): void;
}
