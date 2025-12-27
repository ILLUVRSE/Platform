// src/components/layout/Navbar.tsx
import Link from 'next/link';
import React from 'react';
import { Badge } from "@gridstock/components/ui/Badge";

const isLive =
  process.env.NEXT_PUBLIC_FORCE_MOCK !== "true" &&
  Boolean(process.env.NEXT_PUBLIC_MARKET_API_KEY);

export const Navbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 border-b border-[color:var(--grid-border)] bg-black/70 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/gridstock" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-300 to-sky-400 flex items-center justify-center font-bold text-slate-950 shadow-[0_10px_24px_-18px_rgba(56,189,248,0.7)]">
                G
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-lg text-white tracking-tight">GridStock</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  Market Terminal
                </span>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/gridstock" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Dashboard
              </Link>
            <Link href="/gridstock/portfolio" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Portfolio
              </Link>
              <Link href="/gridstock/game" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Game
              </Link>
              <Link href="/gridstock/minigames/doomball" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Doomball
              </Link>
              <Link href="/gridstock/minigames/pixelpuck" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                PixelPuck
              </Link>
              <Link href="/gridstock/heatmap" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Heatmap
              </Link>
              <Link href="/gridstock/settings" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Settings
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <Badge variant={isLive ? "success" : "warning"}>
                {isLive ? 'Live Market' : 'Simulated Market'}
             </Badge>
          </div>
        </div>
      </div>
    </nav>
  );
};
