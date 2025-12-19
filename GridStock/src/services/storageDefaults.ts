// src/services/storageDefaults.ts
import { Grid, Portfolio } from "@/types";

export const DEFAULT_GRIDS: Grid[] = [
  {
    id: "default-1",
    name: "Big Tech",
    tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA"],
    pollIntervalMs: 4000,
  },
  {
    id: "default-2",
    name: "Dividends",
    tickers: ["KO", "JNJ", "PG", "XOM", "JPM", "V"],
    pollIntervalMs: 6000,
  },
  {
    id: "default-3",
    name: "Meme / High Risk",
    tickers: ["GME", "AMC", "TSLA", "PLTR", "HOOD"],
    pollIntervalMs: 3000,
  },
];

export const DEFAULT_PORTFOLIO: Portfolio = {
  cashBalance: 100000,
  positions: [],
  transactions: [],
};
