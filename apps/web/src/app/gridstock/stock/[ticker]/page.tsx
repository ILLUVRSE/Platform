// src/app/stock/[ticker]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertEvent, Fundamentals, NewsArticle, PriceAlert, Quote, Stock } from "@gridstock/types";
import { quoteService, newsService } from "@gridstock/services/localStorageService";
import { alertsService } from "@gridstock/services/alertsService";
import { StockChart } from "@gridstock/components/stock/StockChart";
import { NewsList } from "@gridstock/components/stock/NewsList";
import { FundamentalsPanel } from "@gridstock/components/stock/FundamentalsPanel";
import { Button } from "@gridstock/components/ui/Button";
import { Badge } from "@gridstock/components/ui/Badge";
import { TradeModal } from "@gridstock/components/portfolio/TradeModal";

export default function StockDetail() {
  const params = useParams();
  const ticker = (params.ticker as string).toUpperCase();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [stockInfo, setStockInfo] = useState<Stock | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [newsError, setNewsError] = useState("");
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [fundamentalsError, setFundamentalsError] = useState("");
  const [fundamentalsLoading, setFundamentalsLoading] = useState(false);
  const [alertHistory, setAlertHistory] = useState<AlertEvent[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const q = await quoteService.getQuote(ticker);
        setQuote(q);
        setQuoteError("");
      } catch (err) {
        console.warn("Quote load failed", err);
        setQuoteError("Unable to load quote right now.");
      }

      const found = await quoteService.searchStocks(ticker);
      const exact = found.find(s => s.symbol === ticker);
      setStockInfo(exact || { symbol: ticker, name: `${ticker} Inc.`, sector: "Unknown" });

      try {
        const n = await newsService.getNewsForTicker(ticker);
        setNews(n);
        setNewsError("");
      } catch (err) {
        console.warn("News load failed", err);
        setNewsError("Unable to load news right now.");
      }

      try {
        setFundamentalsLoading(true);
        const f = await quoteService.getFundamentals?.(ticker);
        setFundamentals(f || null);
        setFundamentalsError("");
      } catch (err) {
        console.warn("Fundamentals load failed", err);
        setFundamentalsError("Unable to load fundamentals right now.");
      } finally {
        setFundamentalsLoading(false);
      }
    };

    loadData();
    const interval = setInterval(async () => {
       try {
         const q = await quoteService.getQuote(ticker);
         setQuote(q);
       } catch (err) {
         console.warn("Quote refresh failed", err);
         setQuoteError("Live updates paused; retrying.");
       }
    }, 3000);

    return () => clearInterval(interval);
  }, [ticker]);

  useEffect(() => {
    const history = alertsService.getHistory().filter((event) => event.symbol === ticker);
    const alerts = alertsService.getAlerts().filter((alert) => alert.symbol === ticker);
    setAlertHistory(history.slice(0, 5));
    setActiveAlerts(alerts);
  }, [ticker]);

  if (!quote || !stockInfo) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Loading...</div>;
  }

  const isPositive = quote.change >= 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
           <h1 className="text-4xl font-bold tracking-tight mb-1">{stockInfo.name}</h1>
           <div className="flex items-center gap-3">
             <Badge variant="neutral">{stockInfo.sector || "Stock"}</Badge>
             <span className="text-gray-400 font-mono">{ticker}</span>
           </div>
        </div>
        
        <div className="text-right">
           <div className="text-5xl font-bold tracking-tighter mb-1">
             ${quote.price.toFixed(2)}
           </div>
           <div className={`font-medium text-lg ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? "+" : ""}{quote.change.toFixed(2)} ({isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%)
           </div>
           {quoteError && <div className="text-xs text-red-400 mt-1">{quoteError}</div>}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Chart & Stats */}
        <div className="lg:col-span-2 space-y-8">
           <StockChart isPositive={isPositive} symbol={ticker} />

           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-gray-900 rounded-xl border border-gray-800">
              <Stat label="Market Cap" value={`$${(quote.marketCap / 1e9).toFixed(1)}B`} />
              <Stat label="P/E Ratio" value={quote.peRatio.toFixed(2)} />
              <Stat label="52W High" value={quote.high52Week.toFixed(2)} />
              <Stat label="52W Low" value={quote.low52Week.toFixed(2)} />
              <Stat label="Volume" value={(quote.volume / 1e6).toFixed(1) + "M"} />
              <Stat label="Div Yield" value={quote.dividendYield.toFixed(2) + "%"} />
              <Stat label="Avg Vol" value="12.5M" />
              <Stat label="Beta" value="1.2" />
           </div>

           <FundamentalsPanel data={fundamentals} loading={fundamentalsLoading} error={fundamentalsError} />

           {newsError && (
             <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-2 rounded">
               {newsError}
             </div>
           )}
           <NewsList news={news} />
        </div>

        {/* Right Col: Actions & Sidebar */}
        <div className="space-y-6">
           <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-lg">Trade {ticker}</h3>
              <p className="text-sm text-gray-400">
                Practice trading with virtual currency. No real money involved.
              </p>
              <Button className="w-full text-lg py-4" onClick={() => setIsTradeModalOpen(true)}>
                Trade / Simulate
              </Button>
           </div>

           <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
              <h3 className="font-bold text-lg">Alert hits</h3>
              {alertHistory.length > 0 ? (
                <div className="space-y-2 text-sm text-gray-300">
                  {alertHistory.map((event) => (
                    <div key={event.id} className="flex items-center justify-between">
                      <span>
                        {event.direction === "above" ? "Above" : "Below"} ${event.target.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.triggeredAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No alert hits yet.</div>
              )}
              {activeAlerts.length > 0 && (
                <div className="text-xs text-gray-500">
                  Active alerts: {activeAlerts.map((a) => a.target.toFixed(2)).join(", ")}
                </div>
              )}
              <Link href="/gridstock" className="text-xs text-green-400 hover:text-green-200">
                Manage alerts &gt;
              </Link>
           </div>

           <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4">Analyst Rating</h3>
              <div className="flex items-center gap-2 mb-2">
                 <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[60%]"></div>
                 </div>
                 <span className="text-green-500 font-bold">Buy</span>
              </div>
              <p className="text-xs text-gray-500">Based on 24 analyst ratings</p>
           </div>
        </div>
      </div>

      {isTradeModalOpen && (
        <TradeModal 
           isOpen={isTradeModalOpen} 
           onClose={() => setIsTradeModalOpen(false)} 
           quote={quote}
           ticker={ticker}
        />
      )}
    </div>
  );
}

const Stat = ({ label, value }: { label: string, value: string | number }) => (
  <div>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="font-medium text-white">{value}</div>
  </div>
);
