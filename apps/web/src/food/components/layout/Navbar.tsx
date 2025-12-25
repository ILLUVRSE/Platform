'use client';

import Link from "next/link";
import { Home, ShoppingBasket, ChefHat, LogOut, Sparkles, SlidersHorizontal, CalendarDays, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@food/lib/store";
import { useInitStore } from "@food/lib/useInitStore";
import { ControlCenter } from "./ControlCenter";

export function Navbar() {
  useInitStore();
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const [showSettings, setShowSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setMenuOpen(false);
    void logout();
  };

  return (
    <nav className="bg-white/90 backdrop-blur border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex">
            <Link href="/food" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="p-2 rounded-full bg-gradient-to-br from-amber-200 to-rose-200 border border-stone-200 group-hover:scale-105 transition-transform">
                <ChefHat className="h-6 w-6 text-primary" />
              </div>
              <span className="font-serif text-xl font-bold text-secondary group-hover:text-primary transition-colors">
                Mom's Kitchen
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/food/sous-chef"
                className="inline-flex items-center px-1 pt-1 text-sm font-semibold text-stone-700 hover:text-primary transition-colors"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Sous Chef
              </Link>
              <Link
                href="/food"
                className="inline-flex items-center px-1 pt-1 text-sm font-semibold text-stone-700 hover:text-primary transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Recipes
              </Link>
              <Link
                href="/food/grocery-list"
                className="inline-flex items-center px-1 pt-1 text-sm font-semibold text-stone-700 hover:text-primary transition-colors"
              >
                <ShoppingBasket className="w-4 h-4 mr-2" />
                Grocery List
              </Link>
              <Link
                href="/food/meal-planner"
                className="inline-flex items-center px-1 pt-1 text-sm font-semibold text-stone-700 hover:text-primary transition-colors"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Meal Planner
              </Link>

              <Link
                href="/food/auth"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Account
              </Link>

              {user ? (
                <>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 hover:border-red-200 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Settings
                  </button>
                  <Link
                    href="/food/auth"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="food-mobile-nav"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div
            id="food-mobile-nav"
            className="md:hidden border-t border-stone-200 pb-4 pt-3 space-y-2"
          >
            <Link
              href="/food"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50"
              onClick={() => setMenuOpen(false)}
            >
              <Home className="w-4 h-4" />
              Recipes
            </Link>
            <Link
              href="/food/sous-chef"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50"
              onClick={() => setMenuOpen(false)}
            >
              <Sparkles className="w-4 h-4" />
              Sous Chef
            </Link>
            <Link
              href="/food/grocery-list"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50"
              onClick={() => setMenuOpen(false)}
            >
              <ShoppingBasket className="w-4 h-4" />
              Grocery List
            </Link>
            <Link
              href="/food/meal-planner"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50"
              onClick={() => setMenuOpen(false)}
            >
              <CalendarDays className="w-4 h-4" />
              Meal Planner
            </Link>
            <div className="border-t border-stone-200 pt-3 space-y-2">
              <button
                onClick={() => {
                  setShowSettings(true);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Settings
              </button>
              {user ? (
                <>
                  <Link
                    href="/food/auth"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Sparkles className="w-4 h-4" />
                    Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-stone-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/food/auth"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Sparkles className="w-4 h-4" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      <ControlCenter open={showSettings} onClose={() => setShowSettings(false)} />
    </nav>
  );
}
