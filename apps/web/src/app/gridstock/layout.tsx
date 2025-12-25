// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@gridstock/components/layout/Navbar";
import { PlatformBar } from "@gridstock/components/layout/PlatformBar";

export const metadata: Metadata = {
  title: "GridStock",
  description: "Market at a glance, research in depth, trade for fun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="gridstock-surface min-h-screen bg-black text-white antialiased">
      <PlatformBar />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
