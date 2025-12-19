// src/app/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Grid, Quote, NewsArticle, PriceAlert, AlertDirection } from "@/types";
import { ViewDensitySetting } from "@/types/settings";
import { storageService, quoteService } from "@/services/localStorageService";
import { fetchNewsForTickers } from "@/services/newsAggregator";
import { settingsService } from "@/services/settingsService";
import { alertsService } from "@/services/alertsService";
import { StockTile } from "@/components/dashboard/StockTile";
import { GridManager } from "@/components/dashboard/GridManager";
import { LiveNewsPanel } from "@/components/dashboard/LiveNewsPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type TrendFilter = "all" | "gainers" | "losers";
type SortBy = "symbol" | "price" | "change";

export default function Dashboard() {
  const [grids, setGrids] = useState<Grid[]>([]);
  const [activeGridId, setActiveGridId] = useState<string>("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [newTicker, setNewTicker] = useState("");
  const [isAddingTicker, setIsAddingTicker] = useState(false);
  const [tickerError, setTickerError] = useState("");
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [viewDensity, setViewDensity] = useState<ViewDensitySetting>("regular");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [trendFilter, setTrendFilter] = useState<TrendFilter>("all");
  const [capFilter, setCapFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("symbol");
  const [dragTicker, setDragTicker] = useState<string | null>(null);
  const [dragGridId, setDragGridId] = useState<string | null>(null);
  const [pollingVersion, setPollingVersion] = useState(0);
  const [portfolioTickers, setPortfolioTickers] = useState<string[]>([]);
  const [newsFeed, setNewsFeed] = useState<NewsArticle[]>([]);
  const [newsError, setNewsError] = useState("");
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsRefreshKey, setNewsRefreshKey] = useState(0);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<PriceAlert[]>([]);
  const [alertSymbol, setAlertSymbol] = useState("");
  const [alertDirection, setAlertDirection] = useState<AlertDirection>("above");
  const [alertPrice, setAlertPrice] = useState("");
  const tickerInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize data
  useEffect(() => {
    setTimeout(() => {
      storageService.initializeDefaults();
      const loadedGrids = storageService.getGrids();
      setGrids(loadedGrids);
      setPortfolioTickers(
        storageService.getPortfolio().positions.map((p) => p.symbol.toUpperCase())
      );
      setAlerts(alertsService.getAlerts());
      if (loadedGrids.length > 0) {
        setActiveGridId(loadedGrids[0].id);
      }
      const savedSettings = settingsService.get();
      setViewDensity(savedSettings.viewDensity);
    }, 0);
  }, []);

  const activeGrid = useMemo(
    () => grids.find((g) => g.id === activeGridId),
    [grids, activeGridId]
  );

  useEffect(() => {
    if (activeGrid?.tickers.length) {
      setAlertSymbol(activeGrid.tickers[0]);
    }
  }, [activeGrid?.tickers]);
  // Poll for quotes
  useEffect(() => {
    if (!activeGridId) return;
    const active = grids.find((g) => g.id === activeGridId);
    if (!active) return;

    const fetchQuotes = async () => {
      if (!active.tickers.length) {
        setQuotes([]);
        return;
      }
      setLoadingQuotes(true);
      setQuoteError("");
      try {
        const data = await quoteService.getQuotes(active.tickers);
        setQuotes(data);
        const { triggered, remaining } = alertsService.evaluate(data);
        if (triggered.length > 0) {
          setTriggeredAlerts((prev) => [...triggered, ...prev]);
          setAlerts(remaining);
        }
      } catch (err) {
        console.warn("Quote refresh failed", err);
        setQuoteError("Unable to refresh quotes right now. Will retry.");
      } finally {
        setLoadingQuotes(false);
      }
    };

    fetchQuotes();
    const intervalMs = active.pollIntervalMs ?? 4000;
    const interval = setInterval(fetchQuotes, intervalMs);
    return () => clearInterval(interval);
  }, [activeGridId, grids, pollingVersion]);

  const handleCreateGrid = (name: string) => {
    const pollMs = settingsService.get().defaultPollMs;
    const newGrid: Grid = {
      id: Date.now().toString(),
      name,
      tickers: [],
      pollIntervalMs: pollMs,
    };
    storageService.saveGrid(newGrid);
    setGrids(storageService.getGrids());
    setActiveGridId(newGrid.id);
  };

  const handleDeleteGrid = (id: string) => {
    storageService.deleteGrid(id);
    const updatedGrids = storageService.getGrids();
    setGrids(updatedGrids);
    if (updatedGrids.length > 0) {
      setActiveGridId(updatedGrids[0].id);
    } else {
      setActiveGridId("");
    }
  };

  const handleAddTicker = async () => {
    if (!newTicker.trim() || !activeGridId) return;
    setTickerError("");
    const results = await quoteService.searchStocks(newTicker);
    const match = results.find((s) => s.symbol === newTicker.toUpperCase());
    if (!match) {
      setTickerError("That ticker was not found. Try another symbol.");
      return;
    }

    const activeGrid = grids.find((g) => g.id === activeGridId);
    if (activeGrid) {
      if (!activeGrid.tickers.includes(newTicker.toUpperCase())) {
        const updatedGrid = {
          ...activeGrid,
          tickers: [...activeGrid.tickers, newTicker.toUpperCase()],
        };
        storageService.saveGrid(updatedGrid);
        setGrids(storageService.getGrids());
      } else {
        setTickerError("Ticker already in this grid.");
        return;
      }
    }
    setNewTicker("");
    setIsAddingTicker(false);
  };

  const handleAddAlert = () => {
    if (!alertSymbol.trim() || !alertPrice) return;
    const target = Number(alertPrice);
    if (isNaN(target) || target <= 0) return;
    const created = alertsService.addAlert({
      symbol: alertSymbol.toUpperCase(),
      direction: alertDirection,
      target,
    });
    setAlerts([created, ...alerts]);
    setAlertPrice("");
  };

  // Autocomplete search
  useEffect(() => {
    const id = setTimeout(async () => {
      if (newTicker.trim().length < 1) {
        setSearchResults([]);
        return;
      }
      const matches = await quoteService.searchStocks(newTicker);
      setSearchResults(
        matches.slice(0, 5).map((m) => ({ symbol: m.symbol, name: m.name }))
      );
    }, 250);
    return () => clearTimeout(id);
  }, [newTicker]);

  const cycleGrid = useCallback((direction: 1 | -1) => {
    if (grids.length === 0) return;
    const currentIndex = grids.findIndex((g) => g.id === activeGridId);
    const nextIndex = (currentIndex + direction + grids.length) % grids.length;
    setActiveGridId(grids[nextIndex].id);
  }, [grids, activeGridId]);

  const handleManualNewsRefresh = useCallback(() => {
    setNewsRefreshKey((v) => v + 1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "/") {
        e.preventDefault();
        setIsAddingTicker(true);
        tickerInputRef.current?.focus();
        return;
      }
      if (e.key === "a") {
        setIsAddingTicker(true);
        tickerInputRef.current?.focus();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        cycleGrid(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        cycleGrid(-1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cycleGrid]);

  const handleReorderGrids = (fromId: string, toId: string) => {
    const fromIndex = grids.findIndex((g) => g.id === fromId);
    const toIndex = grids.findIndex((g) => g.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...grids];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    reordered.forEach((g) => storageService.saveGrid(g));
    setGrids(storageService.getGrids());
  };

  const handleUpdateGrid = (grid: Grid) => {
    storageService.saveGrid(grid);
    setGrids(storageService.getGrids());
    setPollingVersion((v) => v + 1);
  };

  const handleReorderTicker = (fromSymbol: string, toSymbol: string) => {
    const grid = grids.find((g) => g.id === activeGridId);
    if (!grid) return;
    const list = [...grid.tickers];
    const fromIndex = list.indexOf(fromSymbol);
    const toIndex = list.indexOf(toSymbol);
    if (fromIndex === -1 || toIndex === -1) return;
    list.splice(fromIndex, 1);
    list.splice(toIndex, 0, fromSymbol);
    const updatedGrid = { ...grid, tickers: list };
    handleUpdateGrid(updatedGrid);
  };

  const filteredQuotes = useMemo(() => {
    return quotes
      .filter((q) =>
        sectorFilter === "all" ? true : (q.sector || "Unknown") === sectorFilter
      )
      .filter((q) => {
        if (capFilter === "mega") return q.marketCap >= 1e11;
        if (capFilter === "large") return q.marketCap >= 1e10 && q.marketCap < 1e11;
        if (capFilter === "mid") return q.marketCap >= 2e9 && q.marketCap < 1e10;
        if (capFilter === "small") return q.marketCap < 2e9;
        return true;
      })
      .filter((q) => {
        if (trendFilter === "gainers") return q.change > 0;
        if (trendFilter === "losers") return q.change < 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
        if (sortBy === "price") return b.price - a.price;
        return b.changePercent - a.changePercent;
      });
  }, [quotes, sectorFilter, capFilter, trendFilter, sortBy]);

  const sectors = useMemo(
    () => Array.from(new Set(quotes.map((q) => q.sector || "Unknown"))),
    [quotes]
  );

  const trackingTickers = useMemo(
    () =>
      Array.from(
        new Set([...(activeGrid?.tickers || []), ...portfolioTickers]).values()
      ),
    [activeGrid?.tickers, portfolioTickers]
  );

  // Live news for active grid + portfolio holdings
  useEffect(() => {
    let isMounted = true;

    const refreshNews = async () => {
      setNewsLoading(true);
      setNewsError("");
      try {
        const portfolioSymbols = storageService
          .getPortfolio()
          .positions.map((p) => p.symbol.toUpperCase());
        if (isMounted) setPortfolioTickers(portfolioSymbols);

        const active = grids.find((g) => g.id === activeGridId);
        const activeTickers = active?.tickers || [];

        const articles = await fetchNewsForTickers([
          ...activeTickers,
          ...portfolioSymbols,
        ]);

        if (!isMounted) return;
        setNewsFeed(articles.slice(0, 14));
      } catch (err) {
        console.warn("News refresh failed", err);
        if (isMounted) {
          setNewsError(
            "Unable to refresh news right now. Showing cached headlines if available."
          );
        }
      } finally {
        if (isMounted) setNewsLoading(false);
      }
    };

    refreshNews();
    const interval = setInterval(refreshNews, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeGridId, grids, newsRefreshKey]);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Market Overview
        </h1>
        <p className="text-gray-400">
          Track your favorite sectors and stocks in real-time.
        </p>
      </header>

      <GridManager
        grids={grids}
        activeGridId={activeGridId}
        onSelectGrid={setActiveGridId}
        onCreateGrid={handleCreateGrid}
        onDeleteGrid={handleDeleteGrid}
        onReorderGrids={handleReorderGrids}
        onUpdateGrid={handleUpdateGrid}
        dragGridId={dragGridId}
        setDragGridId={setDragGridId}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {activeGrid ? (
            <>
              {loadingQuotes && activeGrid.tickers.length > 0 && (
                <div className="text-gray-500 text-center py-4">
                  Refreshing quotes...
                </div>
              )}

              {activeGrid.tickers.length === 0 && (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-gray-900/50">
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    This grid is empty
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Add some stocks to start tracking.
                  </p>
                  <Button onClick={() => setIsAddingTicker(true)}>
                    Add First Ticker
                  </Button>
                </div>
              )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-sm text-gray-400">Filters:</div>
                <select
                  className="bg-gray-800 text-sm px-3 py-2 rounded border border-gray-700"
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                >
                  <option value="all">All sectors</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  className="bg-gray-800 text-sm px-3 py-2 rounded border border-gray-700"
                  value={capFilter}
                  onChange={(e) => setCapFilter(e.target.value)}
                >
                  <option value="all">All caps</option>
                  <option value="mega">Mega (&gt;= $100B)</option>
                  <option value="large">Large ($10B–$100B)</option>
                  <option value="mid">Mid ($2B–$10B)</option>
                  <option value="small">Small (&lt; $2B)</option>
                </select>
                <select
                  className="bg-gray-800 text-sm px-3 py-2 rounded border border-gray-700"
                  value={trendFilter}
                  onChange={(e) =>
                    setTrendFilter(e.target.value as TrendFilter)
                  }
                >
                  <option value="all">All</option>
                  <option value="gainers">Gainers</option>
                  <option value="losers">Losers</option>
                </select>
                <select
                  className="bg-gray-800 text-sm px-3 py-2 rounded border border-gray-700"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                >
                  <option value="symbol">Sort: Symbol</option>
                  <option value="price">Sort: Price</option>
                  <option value="change">Sort: % Change</option>
                </select>
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant={viewDensity === "regular" ? "primary" : "secondary"}
                onClick={() => {
                  setViewDensity("regular");
                  settingsService.save({ viewDensity: "regular" });
                }}
              >
                Spacious
              </Button>
              <Button
                size="sm"
                variant={viewDensity === "compact" ? "primary" : "secondary"}
                onClick={() => {
                  setViewDensity("compact");
                  settingsService.save({ viewDensity: "compact" });
                }}
              >
                Compact
              </Button>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">Create alert:</span>
              <Input
                placeholder="Symbol"
                value={alertSymbol}
                onChange={(e) => setAlertSymbol(e.target.value.toUpperCase())}
                className="w-28"
              />
              <select
                className="bg-gray-800 text-sm px-3 py-2 rounded border border-gray-700"
                value={alertDirection}
                onChange={(e) => setAlertDirection(e.target.value as AlertDirection)}
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
              <Input
                placeholder="Price"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                className="w-28"
              />
              <Button size="sm" onClick={handleAddAlert}>Add Alert</Button>
            </div>
            {alerts.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {alerts.map((a) => (
                  <span
                    key={a.id}
                    className="px-2 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-200"
                  >
                    {a.symbol} {a.direction === "above" ? "≥" : "≤"} ${a.target.toFixed(2)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {triggeredAlerts.length > 0 && (
            <div className="space-y-2">
              {triggeredAlerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between bg-green-500/10 border border-green-500/40 text-green-200 text-sm px-3 py-2 rounded"
                >
                  <span>
                    Alert hit: {a.symbol} {a.direction === "above" ? "≥" : "≤"} ${a.target.toFixed(2)}
                  </span>
                  <button
                    className="text-xs text-green-100 hover:text-white"
                    onClick={() =>
                      setTriggeredAlerts((prev) => prev.filter((t) => t.id !== a.id))
                    }
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}

              {quoteError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-2 rounded">
                  {quoteError} (live API will be used when configured)
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredQuotes.map((quote) => (
                  <div
                    key={quote.symbol}
                    draggable
                    onDragStart={() => setDragTicker(quote.symbol)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragTicker && dragTicker !== quote.symbol) {
                        handleReorderTicker(dragTicker, quote.symbol);
                      }
                      setDragTicker(null);
                    }}
                  >
                    <StockTile quote={quote} density={viewDensity} />
                  </div>
                ))}

                {/* Add Ticker Tile */}
                <div className="min-h-32 flex items-center justify-center">
                  {!isAddingTicker ? (
                    <button
                      onClick={() => {
                        setIsAddingTicker(true);
                        setTimeout(() => tickerInputRef.current?.focus(), 10);
                      }}
                      className="w-full h-full min-h-[128px] border-2 border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-600 transition-colors group"
                    >
                      <span className="text-4xl font-light mb-1 group-hover:scale-110 transition-transform">
                        +
                      </span>
                      <span className="text-sm font-medium">Add Ticker</span>
                    </button>
                  ) : (
                    <div className="w-full h-full min-h-[128px] bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col justify-center gap-3">
                      <Input
                        placeholder="Symbol (e.g. AAPL)"
                        value={newTicker}
                        onChange={(e) => setNewTicker(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
                        ref={tickerInputRef}
                      />
                      {tickerError && (
                        <p className="text-red-400 text-xs">{tickerError}</p>
                      )}
                      {searchResults.length > 0 && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 space-y-1 max-h-40 overflow-y-auto">
                          {searchResults.map((s) => (
                            <button
                              key={s.symbol}
                              className="w-full text-left px-2 py-1 rounded hover:bg-gray-700"
                              onClick={() => {
                                setNewTicker(s.symbol);
                                setTickerError("");
                              }}
                            >
                              <span className="font-bold">{s.symbol}</span>
                              <span className="text-gray-400 ml-2">{s.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={handleAddTicker}
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setIsAddingTicker(false);
                            setTickerError("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500">Create a grid to get started.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <LiveNewsPanel
            title="Live Portfolio News"
            subtitle={
              trackingTickers.length
                ? `Watching ${trackingTickers.slice(0, 8).join(", ")}`
                : "Watching the market for you"
            }
            news={newsFeed}
            loading={newsLoading}
            error={newsError}
            watchingTickers={trackingTickers}
            onRefresh={handleManualNewsRefresh}
          />
        </div>
      </div>
    </div>
  );
}
