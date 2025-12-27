// src/app/portfolio/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NewsArticle, Portfolio, Quote } from "@gridstock/types";
import { storageService, quoteService } from "@gridstock/services/localStorageService";
import { fetchNewsForTickers } from "@gridstock/services/newsAggregator";
import { LiveNewsPanel } from "@gridstock/components/dashboard/LiveNewsPanel";
import { Card } from "@gridstock/components/ui/Card";
import { Badge } from "@gridstock/components/ui/Badge";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteUpdatedAt, setQuoteUpdatedAt] = useState<number | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState("");
  const [newsRefreshKey, setNewsRefreshKey] = useState(0);

  useEffect(() => {
    storageService.initializeDefaults();
    const data = storageService.getPortfolio();
    setPortfolio(data);
  }, []);

  const refreshQuotes = useCallback(async () => {
    if (!portfolio || portfolio.positions.length === 0) return;
    const symbols = portfolio.positions.map((p) => p.symbol);
    setQuoteLoading(true);
    setQuoteError("");
    try {
      const liveQuotes = await quoteService.getQuotes(symbols);
      const quoteMap: Record<string, Quote> = {};
      liveQuotes.forEach((q) => {
        quoteMap[q.symbol] = q;
      });
      setQuotes(quoteMap);
      setQuoteUpdatedAt(Date.now());
    } catch (err) {
      console.warn("Portfolio quotes refresh failed", err);
      setQuoteError("Unable to refresh quotes right now.");
    } finally {
      setQuoteLoading(false);
    }
  }, [portfolio]);

  useEffect(() => {
    if (!portfolio) return;
    refreshQuotes();
    const interval = setInterval(refreshQuotes, 8000);
    return () => clearInterval(interval);
  }, [portfolio, refreshQuotes]);

  useEffect(() => {
    if (!portfolio) return;
    let isMounted = true;

    const refreshNews = async () => {
      setNewsLoading(true);
      setNewsError("");
      try {
        const symbols = portfolio.positions.map((p) => p.symbol.toUpperCase());
        const articles = await fetchNewsForTickers(symbols);
        if (!isMounted) return;
        setNews(articles.slice(0, 14));
      } catch (err) {
        console.warn("Portfolio news load failed", err);
        if (isMounted) {
          setNewsError("Unable to refresh portfolio headlines right now.");
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
  }, [portfolio, newsRefreshKey]);

  const holdingTickers = useMemo(
    () => portfolio?.positions.map((p) => p.symbol.toUpperCase()) ?? [],
    [portfolio]
  );

  if (!portfolio) return <div className="p-10 text-center text-slate-500">Loading portfolio...</div>;

  const handleNewsRefresh = () => setNewsRefreshKey((v) => v + 1);

  // Calculate totals
  const totalMarketValue = portfolio.positions.reduce((sum, pos) => {
     const price = quotes[pos.symbol]?.price || pos.averageCost;
     return sum + (price * pos.quantity);
  }, 0);
  
  const totalValue = portfolio.cashBalance + totalMarketValue;
  const totalCostBasis = portfolio.positions.reduce((sum, pos) => sum + (pos.averageCost * pos.quantity), 0);
  // Total P/L is (Current Value - Cash Balance - Total Cost Basis) ? No. 
  // Simplified: Current Net Worth - Starting Cash? 
  // Or just P/L on open positions.
  const openPL = totalMarketValue - totalCostBasis;
  const openPLPercent = totalCostBasis > 0 ? (openPL / totalCostBasis) * 100 : 0;

  return (
    <div className="space-y-8">
      <header className="gs-panel-strong rounded-3xl p-6 sm:p-8">
         <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">My Portfolio</h1>
         <p className="text-slate-300">Track your performance and open positions.</p>
         <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm mt-3 text-slate-400">
           <Badge variant={quoteLoading ? "warning" : "success"}>
             {quoteLoading ? "Updating quotes..." : "Live feed active"}
           </Badge>
           {quoteUpdatedAt && (
             <span className="gs-chip-muted rounded-full px-3 py-1">
               Last sync {new Date(quoteUpdatedAt).toLocaleTimeString()}
             </span>
           )}
           <button
             className="text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline"
             onClick={refreshQuotes}
           >
             Refresh now
           </button>
           {quoteError && <span className="text-rose-300">{quoteError}</span>}
         </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="gs-panel-strong">
            <div className="text-sm text-slate-400 mb-1">Total Account Value</div>
            <div className="text-3xl font-bold text-white">${totalValue.toFixed(2)}</div>
         </Card>
         
         <Card className="gs-panel-strong">
            <div className="text-sm text-slate-400 mb-1">Buying Power</div>
            <div className="text-3xl font-bold text-white">${portfolio.cashBalance.toFixed(2)}</div>
         </Card>
         
         <Card className="gs-panel-strong">
            <div className="text-sm text-slate-400 mb-1">Unrealized P/L</div>
            <div className={`text-3xl font-bold ${openPL >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
               {openPL >= 0 ? '+' : ''}{openPL.toFixed(2)} ({openPLPercent.toFixed(2)}%)
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         <div className="xl:col-span-2 space-y-8">
            {/* Positions Table */}
            <div className="space-y-4">
               <h2 className="text-2xl font-bold">Positions</h2>
               {portfolio.positions.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-[color:var(--grid-border)] rounded-2xl gs-panel-soft">
                     <p className="text-slate-400 mb-4">You have no open positions.</p>
                     <Link href="/gridstock" className="text-emerald-300 hover:underline">Browse the market</Link>
                  </div>
               ) : (
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-[color:var(--grid-panel-strong)] text-xs uppercase font-semibold text-slate-300">
                           <tr>
                              <th className="px-6 py-4 rounded-tl-lg">Symbol</th>
                              <th className="px-6 py-4">Quantity</th>
                              <th className="px-6 py-4">Avg Cost</th>
                              <th className="px-6 py-4">Price</th>
                              <th className="px-6 py-4">Day Change</th>
                              <th className="px-6 py-4">Value</th>
                              <th className="px-6 py-4 rounded-tr-lg">Return</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-[color:var(--grid-border)] bg-[color:var(--grid-panel)]">
                           {portfolio.positions.map((pos) => {
                              const quote = quotes[pos.symbol];
                              const currentPrice = quote?.price || pos.averageCost;
                              const marketValue = pos.quantity * currentPrice;
                              const gain = marketValue - (pos.quantity * pos.averageCost);
                              const gainPercent = (gain / (pos.quantity * pos.averageCost)) * 100;

                              return (
                                 <tr key={pos.symbol} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">
                                       <Link href={`/gridstock/stock/${pos.symbol}`} className="hover:text-emerald-300">
                                          {pos.symbol}
                                       </Link>
                                    </td>
                                    <td className="px-6 py-4">{pos.quantity}</td>
                                    <td className="px-6 py-4">${pos.averageCost.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-white">${currentPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                      {quote ? (
                                        <Badge variant={quote.change >= 0 ? "success" : "danger"}>
                                          {quote.change >= 0 ? "+" : ""}
                                          {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                                        </Badge>
                                      ) : (
                                        <span className="text-slate-500 text-xs">Waiting…</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-white font-medium">${marketValue.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                       <Badge variant={gain >= 0 ? 'success' : 'danger'}>
                                          {gain >= 0 ? '+' : ''}{gain.toFixed(2)} ({gainPercent.toFixed(2)}%)
                                       </Badge>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>

            {/* Transaction History (Simplified) */}
            <div className="space-y-4">
               <h2 className="text-2xl font-bold">Recent Activity</h2>
               <div className="space-y-2">
                  {portfolio.transactions.slice(0, 5).map((tx) => (
                     <div key={tx.id} className="flex justify-between items-center gs-panel-soft p-4 rounded-xl border border-[color:var(--grid-border)]">
                        <div className="flex flex-col">
                           <span className="font-bold text-white">{tx.type} {tx.symbol}</span>
                           <span className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                           <div className="font-medium text-white">{tx.quantity} shares @ ${tx.price.toFixed(2)}</div>
                           <div className="text-sm text-slate-500">Total: ${(tx.quantity * tx.price).toFixed(2)}</div>
                        </div>
                     </div>
                  ))}
                  {portfolio.transactions.length === 0 && (
                     <p className="text-slate-500 text-sm">No recent transactions.</p>
                  )}
               </div>
            </div>
         </div>

         <div className="space-y-4">
            <LiveNewsPanel
               title="Portfolio Headlines"
               subtitle="Live news for symbols you own"
               news={news}
               loading={newsLoading}
               error={newsError}
               watchingTickers={holdingTickers}
               onRefresh={handleNewsRefresh}
            />
         </div>
      </div>
    </div>
  );
}
