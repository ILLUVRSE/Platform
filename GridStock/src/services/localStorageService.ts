// src/services/localStorageService.ts
import { Grid, Portfolio, StorageService } from "@/types";
import { DEFAULT_GRIDS, DEFAULT_PORTFOLIO } from "./storageDefaults";

import { IndexedDbService } from "./indexedDbService";
import { ResilientNewsService, ResilientQuoteService } from "./marketDataService";

const GRIDS_KEY = "gridstock_grids";
const PORTFOLIO_KEY = "gridstock_portfolio";

export class HybridStorageService implements StorageService {
  private idb = new IndexedDbService();

  initializeDefaults(): void {
    // Kick off async IndexedDB init, but also seed localStorage for instant availability
    void this.idb.initializeDefaults();
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(GRIDS_KEY)) {
      localStorage.setItem(GRIDS_KEY, JSON.stringify(DEFAULT_GRIDS));
    }
    if (!localStorage.getItem(PORTFOLIO_KEY)) {
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(DEFAULT_PORTFOLIO));
    }
  }

  getGrids(): Grid[] {
    if (typeof window === "undefined") return DEFAULT_GRIDS;
    const cached = this.idb.getGrids();
    if (cached.length > 0) return cached;
    const data = localStorage.getItem(GRIDS_KEY);
    return data ? JSON.parse(data) : DEFAULT_GRIDS;
  }

  saveGrid(grid: Grid): void {
    this.idb.saveGrid(grid);
    if (typeof window === "undefined") return;
    const grids = this.getGrids();
    const index = grids.findIndex((g) => g.id === grid.id);
    if (index >= 0) {
      grids[index] = grid;
    } else {
      grids.push(grid);
    }
    localStorage.setItem(GRIDS_KEY, JSON.stringify(grids));
  }

  deleteGrid(id: string): void {
    this.idb.deleteGrid(id);
    if (typeof window === "undefined") return;
    const grids = this.getGrids().filter((g) => g.id !== id);
    localStorage.setItem(GRIDS_KEY, JSON.stringify(grids));
  }

  getPortfolio(): Portfolio {
    if (typeof window === "undefined") return DEFAULT_PORTFOLIO;
    const cached = this.idb.getPortfolio();
    if (cached) return cached;
    const data = localStorage.getItem(PORTFOLIO_KEY);
    return data ? JSON.parse(data) : DEFAULT_PORTFOLIO;
  }

  savePortfolio(portfolio: Portfolio): void {
    this.idb.savePortfolio(portfolio);
    if (typeof window === "undefined") return;
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
  }
}

export const storageService = new HybridStorageService();
export const quoteService = new ResilientQuoteService();
export const newsService = new ResilientNewsService();
