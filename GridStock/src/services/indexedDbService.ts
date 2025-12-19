// src/services/indexedDbService.ts
// Lightweight IndexedDB-backed storage with versioned migrations and in-memory cache fallback.
import { Grid, Portfolio } from "@/types";
import { DEFAULT_GRIDS, DEFAULT_PORTFOLIO } from "./storageDefaults";

const DB_NAME = "gridstock_db";
const DB_VERSION = 1;
const STORE_KEY = "singleton";

type StoreName = "grids" | "portfolio";

export class IndexedDbService {
  private db: IDBDatabase | null = null;
  private gridCache: Grid[] = DEFAULT_GRIDS;
  private portfolioCache: Portfolio = DEFAULT_PORTFOLIO;
  private readyPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.readyPromise = this.open();
    }
  }

  private open(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("grids")) {
          db.createObjectStore("grids");
        }
        if (!db.objectStoreNames.contains("portfolio")) {
          db.createObjectStore("portfolio");
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => {
        console.warn("IndexedDB unavailable, using in-memory cache");
        resolve();
      };
    });
  }

  private async ensureReady() {
    if (this.readyPromise) await this.readyPromise;
  }

  private writeStore<T>(store: StoreName, value: T) {
    if (!this.db) return;
    const tx = this.db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, STORE_KEY);
  }

  private async readStore<T>(store: StoreName): Promise<T | null> {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(store, "readonly");
      const req = tx.objectStore(store).get(STORE_KEY);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  }

  async initializeDefaults() {
    await this.ensureReady();
    const [savedGrids, savedPortfolio] = await Promise.all([
      this.readStore<Grid[]>("grids"),
      this.readStore<Portfolio>("portfolio"),
    ]);
    this.gridCache = savedGrids && savedGrids.length > 0 ? savedGrids : DEFAULT_GRIDS;
    this.portfolioCache = savedPortfolio ?? DEFAULT_PORTFOLIO;
    // Persist defaults if missing
    if (!savedGrids) this.writeStore("grids", this.gridCache);
    if (!savedPortfolio) this.writeStore("portfolio", this.portfolioCache);
  }

  getGrids(): Grid[] {
    return this.gridCache;
  }

  saveGrid(grid: Grid): void {
    const grids = [...this.gridCache];
    const idx = grids.findIndex((g) => g.id === grid.id);
    if (idx >= 0) grids[idx] = grid;
    else grids.push(grid);
    this.gridCache = grids;
    this.writeStore("grids", grids);
  }

  deleteGrid(id: string): void {
    this.gridCache = this.gridCache.filter((g) => g.id !== id);
    this.writeStore("grids", this.gridCache);
  }

  getPortfolio(): Portfolio {
    return this.portfolioCache;
  }

  savePortfolio(portfolio: Portfolio): void {
    this.portfolioCache = portfolio;
    this.writeStore("portfolio", portfolio);
  }
}
