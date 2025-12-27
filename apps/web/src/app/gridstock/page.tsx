// src/app/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertDirection, AlertEvent, Grid, NewsArticle, PriceAlert, Quote } from "@gridstock/types";
import { ViewDensitySetting } from "@gridstock/types/settings";
import { storageService, quoteService } from "@gridstock/services/localStorageService";
import { fetchNewsForTickers } from "@gridstock/services/newsAggregator";
import { settingsService } from "@gridstock/services/settingsService";
import { alertsService } from "@gridstock/services/alertsService";
import { StockTile } from "@gridstock/components/dashboard/StockTile";
import { GridManager } from "@gridstock/components/dashboard/GridManager";
import { LiveNewsPanel } from "@gridstock/components/dashboard/LiveNewsPanel";
import { Button } from "@gridstock/components/ui/Button";
import { Input } from "@gridstock/components/ui/Input";
import { Badge } from "@gridstock/components/ui/Badge";

const FILTER_PRESETS_KEY = "gridstock_filter_presets";
const STALE_MULTIPLIER = 2.5;

type FilterPreset = {
  id: string;
  name: string;
  filters: {
    sectorFilter: string;
    capFilter: string;
    trendFilter: TrendFilter;
    sortBy: SortBy;
  };
};

const sortGridsByPin = (items: Grid[]) => {
  const pinned = items.filter((g) => g.pinned);
  const unpinned = items.filter((g) => !g.pinned);
  return [...pinned, ...unpinned];
};

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
  const [lastQuoteUpdatedAt, setLastQuoteUpdatedAt] = useState<number | null>(null);
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [activePresetId, setActivePresetId] = useState("");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddQuery, setQuickAddQuery] = useState("");
  const [quickAddResults, setQuickAddResults] = useState<{ symbol: string; name: string }[]>([]);
  const [quickAddSelected, setQuickAddSelected] = useState<string[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertEvent[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const tickerInputRef = useRef<HTMLInputElement | null>(null);
  const quickAddInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize data
  useEffect(() => {
    setTimeout(() => {
      storageService.initializeDefaults();
      const loadedGrids = sortGridsByPin(storageService.getGrids());
      setGrids(loadedGrids);
      setPortfolioTickers(
        storageService.getPortfolio().positions.map((p) => p.symbol.toUpperCase())
      );
      setAlerts(alertsService.getAlerts());
      setAlertHistory(alertsService.getHistory());
      setNotificationsEnabled(alertsService.getPreferences().notificationsEnabled);
      const rawPresets =
        typeof window !== "undefined" ? localStorage.getItem(FILTER_PRESETS_KEY) : null;
      if (rawPresets) {
        try {
          setFilterPresets(JSON.parse(rawPresets) as FilterPreset[]);
        } catch {
          setFilterPresets([]);
        }
      }
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

  const marketMode = useMemo(() => {
    if (process.env.NEXT_PUBLIC_FORCE_MOCK === "true") return "Simulated";
    return process.env.NEXT_PUBLIC_MARKET_API_KEY ? "Live" : "Simulated";
  }, []);

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
        setLastQuoteUpdatedAt(null);
        return;
      }
      setLoadingQuotes(true);
      setQuoteError("");
      try {
        const data = await quoteService.getQuotes(active.tickers);
        setQuotes(data);
        setLastQuoteUpdatedAt(Date.now());
        const { triggered, alerts: updatedAlerts } = alertsService.evaluate(data);
        setAlerts(updatedAlerts);
        if (triggered.length > 0) {
          setTriggeredAlerts((prev) => [...triggered, ...prev]);
          const events = alertsService.recordTriggers(triggered, data);
          if (events.length > 0) {
            setAlertHistory(alertsService.getHistory());
          }
          if (
            notificationsEnabled &&
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            events.forEach((event) => {
              new Notification(`Alert hit: ${event.symbol}`, {
                body: `${event.symbol} ${event.direction === "above" ? "≥" : "≤"} $${event.target.toFixed(2)} at $${event.price.toFixed(2)}`,
              });
            });
          }
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
  }, [activeGridId, grids, pollingVersion, notificationsEnabled]);

  const handleCreateGrid = (name: string) => {
    const pollMs = settingsService.get().defaultPollMs;
    const newGrid: Grid = {
      id: Date.now().toString(),
      name,
      tickers: [],
      pollIntervalMs: pollMs,
      pinned: false,
    };
    storageService.saveGrid(newGrid);
    const next = sortGridsByPin(storageService.getGrids());
    storageService.saveGrids(next);
    setGrids(next);
    setActiveGridId(newGrid.id);
  };

  const handleDeleteGrid = (id: string) => {
    storageService.deleteGrid(id);
    const updated = sortGridsByPin(storageService.getGrids());
    storageService.saveGrids(updated);
    setGrids(updated);
    setActiveGridId(updated[0]?.id ?? "");
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

  const handleDeleteAlert = (id: string) => {
    alertsService.deleteAlert(id);
    setAlerts(alertsService.getAlerts());
  };

  const handleSnoozeAlert = (id: string, minutes: number) => {
    alertsService.snoozeAlert(id, Date.now() + minutes * 60 * 1000);
    setAlerts(alertsService.getAlerts());
  };

  const handleClearSnooze = (id: string) => {
    alertsService.clearSnooze(id);
    setAlerts(alertsService.getAlerts());
  };

  const handleClearAlertHistory = () => {
    alertsService.saveHistory([]);
    setAlertHistory([]);
  };

  const handleRemoveTicker = (symbol: string) => {
    const grid = grids.find((g) => g.id === activeGridId);
    if (!grid) return;
    const updatedGrid = {
      ...grid,
      tickers: grid.tickers.filter((t) => t !== symbol),
    };
    handleUpdateGrid(updatedGrid);
  };

  const persistPresets = (next: FilterPreset[]) => {
    setFilterPresets(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(FILTER_PRESETS_KEY, JSON.stringify(next));
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    const next: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: {
        sectorFilter,
        capFilter,
        trendFilter,
        sortBy,
      },
    };
    persistPresets([next, ...filterPresets]);
    setActivePresetId(next.id);
    setPresetName("");
    setIsSavingPreset(false);
  };

  const handleApplyPreset = (id: string) => {
    const preset = filterPresets.find((p) => p.id === id);
    if (!preset) return;
    setSectorFilter(preset.filters.sectorFilter);
    setCapFilter(preset.filters.capFilter);
    setTrendFilter(preset.filters.trendFilter);
    setSortBy(preset.filters.sortBy);
    setActivePresetId(id);
  };

  const handleDeletePreset = (id: string) => {
    persistPresets(filterPresets.filter((p) => p.id !== id));
    if (activePresetId === id) setActivePresetId("");
  };

  const toggleQuickAddSelection = (symbol: string) => {
    setQuickAddSelected((prev) =>
      prev.includes(symbol)
        ? prev.filter((item) => item !== symbol)
        : [...prev, symbol]
    );
  };

  const handleQuickAdd = () => {
    if (!activeGrid || quickAddSelected.length === 0) return;
    const nextTickers = Array.from(
      new Set([...activeGrid.tickers, ...quickAddSelected.map((t) => t.toUpperCase())])
    );
    const updatedGrid = { ...activeGrid, tickers: nextTickers };
    handleUpdateGrid(updatedGrid);
    setIsQuickAddOpen(false);
    setQuickAddSelected([]);
  };

  const handleToggleNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      alertsService.savePreferences({ notificationsEnabled: false });
      return;
    }
    const permission = await Notification.requestPermission();
    const enabled = permission === "granted";
    setNotificationsEnabled(enabled);
    alertsService.savePreferences({ notificationsEnabled: enabled });
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

  useEffect(() => {
    const id = setTimeout(async () => {
      if (quickAddQuery.trim().length < 1) {
        setQuickAddResults([]);
        return;
      }
      const matches = await quoteService.searchStocks(quickAddQuery);
      setQuickAddResults(
        matches.slice(0, 8).map((m) => ({ symbol: m.symbol, name: m.name }))
      );
    }, 250);
    return () => clearTimeout(id);
  }, [quickAddQuery]);

  useEffect(() => {
    if (!isQuickAddOpen) return;
    setQuickAddQuery("");
    setQuickAddResults([]);
    setQuickAddSelected([]);
    setTimeout(() => quickAddInputRef.current?.focus(), 10);
  }, [isQuickAddOpen]);

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
    const fromGrid = grids.find((g) => g.id === fromId);
    const toGrid = grids.find((g) => g.id === toId);
    if (!fromGrid || !toGrid) return;
    if (Boolean(fromGrid.pinned) !== Boolean(toGrid.pinned)) return;
    const group = grids.filter((g) => Boolean(g.pinned) === Boolean(fromGrid.pinned));
    const otherGroup = grids.filter((g) => Boolean(g.pinned) !== Boolean(fromGrid.pinned));
    const fromIndex = group.findIndex((g) => g.id === fromId);
    const toIndex = group.findIndex((g) => g.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reorderedGroup = [...group];
    const [moved] = reorderedGroup.splice(fromIndex, 1);
    reorderedGroup.splice(toIndex, 0, moved);
    const reordered = fromGrid.pinned ? [...reorderedGroup, ...otherGroup] : [...otherGroup, ...reorderedGroup];
    storageService.saveGrids(reordered);
    setGrids(reordered);
  };

  const handleUpdateGrid = (grid: Grid) => {
    storageService.saveGrid(grid);
    const next = sortGridsByPin(storageService.getGrids());
    storageService.saveGrids(next);
    setGrids(next);
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

  const activeTickerSet = useMemo(
    () => new Set((activeGrid?.tickers || []).map((t) => t.toUpperCase())),
    [activeGrid?.tickers]
  );

  const lastUpdatedLabel = lastQuoteUpdatedAt
    ? new Date(lastQuoteUpdatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const isStale = useMemo(() => {
    if (!lastQuoteUpdatedAt) return false;
    const interval = activeGrid?.pollIntervalMs ?? 4000;
    return Date.now() - lastQuoteUpdatedAt > interval * STALE_MULTIPLIER;
  }, [activeGrid?.pollIntervalMs, lastQuoteUpdatedAt]);

  const topMovers = useMemo(() => {
    const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
    return {
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse(),
    };
  }, [quotes]);

  const sectorRollup = useMemo(() => {
    const map = new Map<string, { count: number; avg: number }>();
    quotes.forEach((q) => {
      const key = q.sector || "Unknown";
      const entry = map.get(key) || { count: 0, avg: 0 };
      const nextCount = entry.count + 1;
      const nextAvg = (entry.avg * entry.count + q.changePercent) / nextCount;
      map.set(key, { count: nextCount, avg: nextAvg });
    });
    return Array.from(map.entries())
      .map(([sector, data]) => ({ sector, ...data }))
      .sort((a, b) => Math.abs(b.avg) - Math.abs(a.avg))
      .slice(0, 6);
  }, [quotes]);

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
    <div className="space-y-8">
      <header className="gs-panel-strong rounded-3xl p-6 sm:p-8 animate-rise">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Market Overview
            </h1>
            <p className="text-slate-300">
              Track your favorite sectors and stocks in real-time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-400">
            <Badge variant={marketMode === "Live" ? "success" : "warning"}>
              {marketMode === "Live" ? "Live feed" : "Simulated feed"}
            </Badge>
            <span className="gs-chip-muted rounded-full px-3 py-1">
              Last update {lastUpdatedLabel}
            </span>
            {activeGrid && (
              <span className="gs-chip-muted rounded-full px-3 py-1">
                Poll {((activeGrid.pollIntervalMs ?? 4000) / 1000).toFixed(1)}s
              </span>
            )}
            {isStale && <Badge variant="warning">Stale</Badge>}
            {quoteError && <span className="text-rose-300">Refresh issues detected</span>}
          </div>
        </div>
      </header>

      <div className="animate-rise animate-rise-delay-1">
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-rise animate-rise-delay-2">
        <div className="xl:col-span-2 space-y-4">
          {activeGrid ? (
            <>
              {loadingQuotes && activeGrid.tickers.length > 0 && (
                <div className="text-slate-400 text-center py-4">
                  Refreshing quotes...
                </div>
              )}

              {activeGrid.tickers.length === 0 && (
                <div className="text-center py-12 border border-dashed border-[color:var(--grid-border)] rounded-2xl gs-panel-soft">
                  <h3 className="text-lg font-medium text-slate-200 mb-2">
                    This grid is empty
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Add some stocks to start tracking.
                  </p>
                  <Button onClick={() => setIsAddingTicker(true)}>
                    Add First Ticker
                  </Button>
                </div>
              )}

          {/* Filters */}
          <div className="gs-panel rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <div className="text-sm text-slate-400">Filters:</div>
            <select
              className="gs-select text-sm px-3 py-2 rounded-full"
              value={sectorFilter}
              onChange={(e) => {
                setSectorFilter(e.target.value);
                setActivePresetId("");
              }}
            >
              <option value="all">All sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="gs-select text-sm px-3 py-2 rounded-full"
              value={capFilter}
              onChange={(e) => {
                setCapFilter(e.target.value);
                setActivePresetId("");
              }}
            >
              <option value="all">All caps</option>
              <option value="mega">Mega (&gt;= $100B)</option>
              <option value="large">Large ($10B–$100B)</option>
              <option value="mid">Mid ($2B–$10B)</option>
              <option value="small">Small (&lt; $2B)</option>
            </select>
            <select
              className="gs-select text-sm px-3 py-2 rounded-full"
              value={trendFilter}
              onChange={(e) => {
                setTrendFilter(e.target.value as TrendFilter);
                setActivePresetId("");
              }}
            >
              <option value="all">All</option>
              <option value="gainers">Gainers</option>
              <option value="losers">Losers</option>
            </select>
            <select
              className="gs-select text-sm px-3 py-2 rounded-full"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortBy);
                setActivePresetId("");
              }}
            >
              <option value="symbol">Sort: Symbol</option>
              <option value="price">Sort: Price</option>
              <option value="change">Sort: % Change</option>
            </select>
            <select
              className="gs-select text-sm px-3 py-2 rounded-full"
              value={activePresetId}
              onChange={(e) => {
                const id = e.target.value;
                if (id) handleApplyPreset(id);
                else setActivePresetId("");
              }}
            >
              <option value="">Presets</option>
              {filterPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            {filterPresets.length > 0 && activePresetId && (
              <button
                type="button"
                onClick={() => handleDeletePreset(activePresetId)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Delete preset
              </button>
            )}
            {!isSavingPreset ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsSavingPreset(true)}
              >
                Save preset
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-36"
                />
                <Button size="sm" onClick={handleSavePreset}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsSavingPreset(false)}>
                  Cancel
                </Button>
              </div>
            )}
            <Button size="sm" variant="secondary" onClick={() => setIsQuickAddOpen(true)}>
              Quick add
            </Button>
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
          <div className="gs-panel rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Alerts</h3>
                <p className="text-xs text-slate-400">Track price triggers with an inbox.</p>
              </div>
              <Button
                size="sm"
                variant={notificationsEnabled ? "primary" : "secondary"}
                onClick={handleToggleNotifications}
              >
                {notificationsEnabled ? "Notifications on" : "Enable notifications"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-400">Create alert:</span>
              <Input
                placeholder="Symbol"
                value={alertSymbol}
                onChange={(e) => setAlertSymbol(e.target.value.toUpperCase())}
                className="w-28"
              />
              <select
                className="gs-select text-sm px-3 py-2 rounded-full"
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
              <Button size="sm" onClick={handleAddAlert}>
                Add Alert
              </Button>
            </div>

            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((a) => {
                  const now = Date.now();
                  const snoozed = a.snoozedUntil && a.snoozedUntil > now;
                  const snoozeLabel = snoozed
                    ? `Snoozed until ${new Date(a.snoozedUntil).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Active";
                  return (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-2 gs-panel-soft rounded-xl px-3 py-2 text-xs text-slate-300"
                    >
                      <span className="font-medium text-slate-100">
                        {a.symbol} {a.direction === "above" ? "≥" : "≤"} ${a.target.toFixed(2)}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={snoozed ? "text-yellow-300" : "text-emerald-300"}>
                          {snoozeLabel}
                        </span>
                        <button
                          className="text-slate-400 hover:text-white"
                          onClick={() => handleSnoozeAlert(a.id, 60)}
                        >
                          Snooze 1h
                        </button>
                        {snoozed && (
                          <button
                            className="text-slate-400 hover:text-white"
                            onClick={() => handleClearSnooze(a.id)}
                          >
                            Clear
                          </button>
                        )}
                        <button
                          className="text-rose-300 hover:text-rose-200"
                          onClick={() => handleDeleteAlert(a.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-500">No active alerts yet.</div>
            )}

            <div className="border-t border-[color:var(--grid-border)] pt-3 space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>Triggered</span>
                <span>{triggeredAlerts.length} new</span>
              </div>
              {triggeredAlerts.length > 0 ? (
                <div className="space-y-2">
                  {triggeredAlerts.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-2 bg-[rgb(var(--grid-success)/0.14)] border border-[rgb(var(--grid-success)/0.4)] text-emerald-200 text-xs px-3 py-2 rounded-xl"
                    >
                      <span>
                        Alert hit: {a.symbol} {a.direction === "above" ? "≥" : "≤"} ${a.target.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/gridstock/stock/${a.symbol}`}
                          className="text-emerald-100 hover:text-white"
                        >
                          Open
                        </Link>
                        <button
                          className="text-emerald-100 hover:text-white"
                          onClick={() =>
                            setTriggeredAlerts((prev) =>
                              prev.filter((t) => t.id !== a.id)
                            )
                          }
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500">No new triggers.</div>
              )}

              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>History</span>
                {alertHistory.length > 0 && (
                  <button
                    className="text-slate-400 hover:text-white"
                    onClick={handleClearAlertHistory}
                  >
                    Clear
                  </button>
                )}
              </div>
              {alertHistory.length > 0 ? (
                <div className="space-y-2">
                  {alertHistory.slice(0, 6).map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400"
                    >
                      <span>
                        {event.symbol} {event.direction === "above" ? "≥" : "≤"} ${event.target.toFixed(2)} at ${event.price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>
                          {new Date(event.triggeredAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Link
                          href={`/gridstock/stock/${event.symbol}`}
                          className="text-slate-300 hover:text-white"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500">No history yet.</div>
              )}
            </div>
          </div>

              {quoteError && (
                <div className="text-rose-200 text-sm bg-rose-500/10 border border-rose-500/40 p-3 rounded-xl">
                  {quoteError}{" "}
                  {lastQuoteUpdatedAt
                    ? `Showing last update at ${lastUpdatedLabel}.`
                    : "No cached update yet."}
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
                    <StockTile
                      quote={quote}
                      density={viewDensity}
                      onRemove={handleRemoveTicker}
                      marketMode={marketMode}
                      isStale={
                        isStale ||
                        (quote.timestamp
                          ? Date.now() - quote.timestamp >
                            (activeGrid?.pollIntervalMs ?? 4000) * STALE_MULTIPLIER
                          : false)
                      }
                    />
                  </div>
                ))}

                {/* Add Ticker Tile */}
                <div className="min-h-32 flex items-center justify-center">
                  {!isAddingTicker ? (
                    <div className="w-full h-full min-h-[128px] border-2 border-dashed border-[color:var(--grid-border)] rounded-2xl gs-panel-soft flex flex-col items-center justify-center text-slate-400 hover:text-white hover:border-[rgb(var(--grid-accent)/0.4)] transition-colors gap-2">
                      <button
                        onClick={() => {
                          setIsAddingTicker(true);
                          setTimeout(() => tickerInputRef.current?.focus(), 10);
                        }}
                        className="flex flex-col items-center"
                      >
                        <span className="text-4xl font-light mb-1">+</span>
                        <span className="text-sm font-semibold">Add Ticker</span>
                      </button>
                      <button
                        onClick={() => setIsQuickAddOpen(true)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Quick add multiple
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full min-h-[128px] gs-panel rounded-2xl p-4 flex flex-col justify-center gap-3">
                      <Input
                        placeholder="Symbol (e.g. AAPL)"
                        value={newTicker}
                        onChange={(e) => setNewTicker(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
                        ref={tickerInputRef}
                      />
                      {tickerError && (
                        <p className="text-rose-300 text-xs">{tickerError}</p>
                      )}
                      {searchResults.length > 0 && (
                        <div className="gs-panel-soft rounded-xl p-2 text-sm text-slate-200 space-y-1 max-h-40 overflow-y-auto">
                          {searchResults.map((s) => (
                            <button
                              key={s.symbol}
                              className="w-full text-left px-2 py-1 rounded hover:bg-white/5"
                              onClick={() => {
                                setNewTicker(s.symbol);
                                setTickerError("");
                              }}
                            >
                              <span className="font-bold">{s.symbol}</span>
                              <span className="text-slate-400 ml-2">{s.name}</span>
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
              <p className="text-slate-500">Create a grid to get started.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="gs-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Top Movers</h3>
              <span className="text-xs text-slate-500">Active grid</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Gainers</div>
                {topMovers.gainers.length > 0 ? (
                  topMovers.gainers.map((q) => (
                    <div key={q.symbol} className="flex items-center justify-between text-sm">
                      <span className="text-slate-200">{q.symbol}</span>
                      <span className="text-green-400">+{q.changePercent.toFixed(2)}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">No data yet.</div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Losers</div>
                {topMovers.losers.length > 0 ? (
                  topMovers.losers.map((q) => (
                    <div key={q.symbol} className="flex items-center justify-between text-sm">
                      <span className="text-slate-200">{q.symbol}</span>
                      <span className="text-red-400">{q.changePercent.toFixed(2)}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">No data yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="gs-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Sector Rollup</h3>
              <span className="text-xs text-slate-500">Avg change</span>
            </div>
            {sectorRollup.length > 0 ? (
              <div className="space-y-2">
                {sectorRollup.map((s) => (
                  <div key={s.sector} className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">{s.sector}</span>
                    <span className={s.avg >= 0 ? "text-green-400" : "text-red-400"}>
                      {s.avg >= 0 ? "+" : ""}{s.avg.toFixed(2)}% | {s.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">No sector data yet.</div>
            )}
          </div>

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

      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsQuickAddOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] gs-panel-strong border-l border-[color:var(--grid-border)] p-5 space-y-4 overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Quick Add</h3>
                <p className="text-xs text-slate-400">
                  Add multiple tickers to {activeGrid?.name || "your grid"}.
                </p>
              </div>
              <button
                className="text-sm text-slate-400 hover:text-white"
                onClick={() => setIsQuickAddOpen(false)}
              >
                Close
              </button>
            </div>

            <Input
              placeholder="Search tickers"
              value={quickAddQuery}
              onChange={(e) => setQuickAddQuery(e.target.value)}
              ref={quickAddInputRef}
            />

            <div className="space-y-2">
              {quickAddResults.length > 0 ? (
                quickAddResults.map((result) => {
                  const symbol = result.symbol.toUpperCase();
                  const isSelected = quickAddSelected.includes(symbol);
                  const isDisabled = activeTickerSet.has(symbol);
                  return (
                    <label
                      key={symbol}
                      className={`flex items-center justify-between gap-3 rounded-xl border border-[color:var(--grid-border)] px-3 py-2 text-sm ${isDisabled ? "opacity-50" : "hover:border-[rgb(var(--grid-accent)/0.4)]"} gs-panel-soft`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleQuickAddSelection(symbol)}
                          className="accent-emerald-400"
                        />
                        <div>
                          <div className="text-slate-100 font-semibold">{symbol}</div>
                          <div className="text-xs text-slate-400">{result.name}</div>
                        </div>
                      </div>
                      {isDisabled && <span className="text-xs text-slate-500">In grid</span>}
                    </label>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500">Search for symbols to add.</div>
              )}
            </div>

            {quickAddSelected.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                  Selected
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickAddSelected.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => toggleQuickAddSelection(symbol)}
                      className="px-2 py-1 rounded-full bg-[color:var(--grid-panel-strong)] border border-[color:var(--grid-border)] text-xs text-slate-200 hover:border-[rgb(var(--grid-accent)/0.4)]"
                    >
                      {symbol} x
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                className="w-full"
                onClick={handleQuickAdd}
                disabled={!activeGrid || quickAddSelected.length === 0}
              >
                Add selected
              </Button>
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => setIsQuickAddOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
