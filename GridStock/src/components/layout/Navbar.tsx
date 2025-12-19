// src/components/layout/Navbar.tsx
import Link from 'next/link';
import React from 'react';

const isLive = Boolean(process.env.NEXT_PUBLIC_MARKET_API_KEY);

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center font-bold text-gray-900">
                G
              </div>
              <span className="font-bold text-xl text-white tracking-tight">GridStock</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Dashboard
              </Link>
            <Link href="/portfolio" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Portfolio
              </Link>
              <Link href="/game" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Game
              </Link>
              <Link href="/minigames/doomball" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Doomball
              </Link>
              <Link href="/minigames/pixelpuck" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                PixelPuck
              </Link>
              <Link href="/heatmap" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Heatmap
              </Link>
              <Link href="/settings" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Settings
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className={`text-xs px-2 py-1 rounded ${isLive ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'text-gray-500 bg-gray-800'}`}>
                {isLive ? 'Live Market' : 'Simulated Market'}
             </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
