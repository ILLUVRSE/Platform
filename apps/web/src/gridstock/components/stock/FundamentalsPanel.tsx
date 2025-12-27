// src/components/stock/FundamentalsPanel.tsx
import React from "react";
import { Fundamentals } from "@gridstock/types";
import { Card } from "@gridstock/components/ui/Card";

interface Props {
  data: Fundamentals | null;
  loading: boolean;
  error?: string;
}

export const FundamentalsPanel: React.FC<Props> = ({ data, loading, error }) => {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Fundamentals</h3>
        {loading && <span className="text-xs text-slate-400">Updating…</span>}
      </div>
      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-2 rounded">
          {error}
        </div>
      )}
      {data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <Fact label="Market Cap" value={fmtMoney(data.marketCap)} />
          <Fact label="P/E (TTM)" value={fmtNumber(data.peRatio)} />
          <Fact label="Forward P/E" value={fmtNumber(data.forwardPE)} />
          <Fact label="EPS" value={fmtNumber(data.eps)} />
          <Fact label="Revenue TTM" value={fmtMoney(data.revenueTTM)} />
          <Fact label="Profit Margin" value={fmtPercent(data.profitMargin)} />
          <Fact label="Dividend Yield" value={fmtPercent(data.dividendYield)} />
          <Fact label="Beta" value={fmtNumber(data.beta)} />
        </div>
      ) : (
        !loading && <div className="text-slate-500 text-sm">No fundamentals available.</div>
      )}
    </Card>
  );
};

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="font-semibold text-white">{value}</div>
  </div>
);

function fmtMoney(v?: number) {
  if (!v || Number.isNaN(v)) return "—";
  if (Math.abs(v) > 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (Math.abs(v) > 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) > 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toFixed(2)}`;
}

function fmtPercent(v?: number) {
  if (v === undefined || Number.isNaN(v)) return "—";
  return `${v.toFixed(2)}%`;
}

function fmtNumber(v?: number) {
  if (v === undefined || Number.isNaN(v)) return "—";
  return v.toFixed(2);
}
