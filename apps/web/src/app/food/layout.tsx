import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@food/components/layout/Navbar";
import { PlatformBar } from "@/components/PlatformBar";
import { Playfair_Display, Manrope } from "next/font/google";
import { ToastHost } from "@food/components/ToastHost";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Mom's Kitchen",
  description: "Recipe Book & Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const persistenceReady = process.env.NEXT_PUBLIC_PERSISTENCE_READY === 'true';
  return (
    <div className={`${playfair.variable} ${manrope.variable} food-surface min-h-screen font-sans`}>
      <PlatformBar />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {!persistenceReady && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Data is stored in a local demo DB. Set DATABASE_URL and NEXT_PUBLIC_PERSISTENCE_READY=true for production.
          </div>
        )}
        {children}
      </main>
      <ToastHost />
    </div>
  );
}
