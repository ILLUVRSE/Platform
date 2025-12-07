import type { Metadata } from "next";
import { Playfair_Display, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppNav } from "../components/AppNav";

const headingFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700"]
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600"]
});

export const metadata: Metadata = {
  title: "StorySphere | Personal studio and LiveLoop",
  description:
    "StorySphere is the personal studio of ILLUVRSE: prompt to MP4, LiveLoop streaming, Player, and GameGrid arcade.",
  metadataBase: new URL("https://www.illuvrse.com")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} bg-slate-800 text-cream antialiased`}
      >
        <div className="bg-gradient-to-br from-slate-800 via-slate-700/40 to-ink min-h-screen">
          <AppNav />
          <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
