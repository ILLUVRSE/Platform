// src/components/portfolio/TradeModal.tsx
"use client";

import React, { useState } from "react";
import { Quote, Transaction } from "@gridstock/types";
import { storageService } from "@gridstock/services/localStorageService";
import { Button } from "@gridstock/components/ui/Button";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  ticker: string;
}

export const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose, quote, ticker }) => {
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const portfolio = storageService.getPortfolio();
  const currentPrice = quote.price;
  const estimatedTotal = quantity * currentPrice;

  // Find current position
  const position = portfolio.positions.find(p => p.symbol === ticker);
  const ownedQuantity = position ? position.quantity : 0;

  if (!isOpen) return null;

  const handleTrade = () => {
    setError("");
    setSuccess("");

    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    if (type === 'BUY') {
      if (estimatedTotal > portfolio.cashBalance) {
        setError(`Insufficient funds. You have $${portfolio.cashBalance.toFixed(2)}.`);
        return;
      }
      
      // Update Portfolio
      const newCash = portfolio.cashBalance - estimatedTotal;
      const newPositions = [...portfolio.positions];
      if (position) {
         // Averaging down/up cost basis logic could go here, for MVP just simple avg
         const totalCost = (position.averageCost * position.quantity) + estimatedTotal;
         const newQty = position.quantity + quantity;
         const newAvg = totalCost / newQty;
         
         const idx = newPositions.findIndex(p => p.symbol === ticker);
         newPositions[idx] = { ...position, quantity: newQty, averageCost: newAvg };
      } else {
         newPositions.push({ symbol: ticker, quantity: quantity, averageCost: currentPrice });
      }

      // eslint-disable-next-line react-hooks/purity
      const timestamp = Date.now();
      const transaction: Transaction = {
         // eslint-disable-next-line react-hooks/purity
         id: timestamp.toString() + Math.random().toString(),
         symbol: ticker,
         type: 'BUY',
         quantity,
         price: currentPrice,
         timestamp: timestamp
      };

      storageService.savePortfolio({
         cashBalance: newCash,
         positions: newPositions,
         transactions: [transaction, ...portfolio.transactions]
      });
      
      setSuccess(`Successfully bought ${quantity} shares of ${ticker}!`);
      setTimeout(onClose, 1500);

    } else { // SELL
       if (quantity > ownedQuantity) {
          setError(`You only own ${ownedQuantity} shares.`);
          return;
       }

       const newCash = portfolio.cashBalance + estimatedTotal;
       const newPositions = [...portfolio.positions];
       const idx = newPositions.findIndex(p => p.symbol === ticker);
       
       if (quantity === ownedQuantity) {
          // Remove position
          newPositions.splice(idx, 1);
       } else {
          // Reduce position
          newPositions[idx] = { ...position!, quantity: ownedQuantity - quantity };
       }

       // eslint-disable-next-line react-hooks/purity
       const timestamp = Date.now();
       const transaction: Transaction = {
          // eslint-disable-next-line react-hooks/purity
          id: timestamp.toString() + Math.random().toString(),
          symbol: ticker,
          type: 'SELL',
          quantity,
          price: currentPrice,
          timestamp: timestamp
       };

       storageService.savePortfolio({
          cashBalance: newCash,
          positions: newPositions,
          transactions: [transaction, ...portfolio.transactions]
       });

       setSuccess(`Successfully sold ${quantity} shares of ${ticker}!`);
       setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="gs-panel-strong rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
         <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Trade {ticker}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
         </div>

         <div className="flex gs-panel-soft rounded-full p-1">
            <button 
              className={`flex-1 py-2 rounded-full font-semibold text-xs uppercase tracking-wide transition-colors ${type === 'BUY' ? 'bg-[rgb(var(--grid-success)/0.2)] text-emerald-200 border border-[rgb(var(--grid-success)/0.5)]' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setType('BUY')}
            >
              Buy
            </button>
            <button 
              className={`flex-1 py-2 rounded-full font-semibold text-xs uppercase tracking-wide transition-colors ${type === 'SELL' ? 'bg-[rgb(var(--grid-danger)/0.2)] text-rose-200 border border-[rgb(var(--grid-danger)/0.5)]' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setType('SELL')}
            >
              Sell
            </button>
         </div>

         <div className="space-y-4">
            <div className="flex justify-between text-sm text-slate-400">
               <span>Available Cash: ${portfolio.cashBalance.toFixed(2)}</span>
               <span>Owned: {ownedQuantity} shares</span>
            </div>

            <div>
               <label className="text-sm text-slate-400 mb-1 block">Shares</label>
               <input 
                  type="number" 
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full gs-input rounded-lg px-3 py-3 text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--grid-accent)/0.35)]"
               />
            </div>

            <div className="flex justify-between items-center py-2 border-t border-[color:var(--grid-border)]">
               <span className="text-slate-400">Market Price</span>
               <span className="font-medium">${currentPrice.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-t border-[color:var(--grid-border)]">
               <span className="text-slate-400">Estimated Total</span>
               <span className="font-bold text-xl">${estimatedTotal.toFixed(2)}</span>
            </div>
            
            {error && <div className="text-rose-200 text-sm bg-rose-500/10 p-2 rounded">{error}</div>}
            {success && <div className="text-emerald-200 text-sm bg-emerald-500/10 p-2 rounded">{success}</div>}

            <Button 
               className="w-full py-3 text-lg"
               variant={type === "BUY" ? "primary" : "danger"}
               onClick={handleTrade}
            >
               {type} {ticker}
            </Button>
         </div>
      </div>
    </div>
  );
};
