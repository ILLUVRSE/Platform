import type { Metadata } from "next";
import { Playfair_Display, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "../components/TopNav";
import { Footer } from "../components/Footer";

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
  title: "ILLUVRSE | Trusted artifacts, StorySphere studio, and LiveLoop",
  description:
    "ILLUVRSE is the governed platform for creators and operators: IDEA, Kernel signing, Marketplace, StorySphere studio, LiveLoop, and GameGrid.",
  metadataBase: new URL("https://www.illuvrse.com")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} bg-slate-800 text-cream antialiased`}
      >
        <div className="bg-gradient-to-br from-slate-800 via-slate-700/40 to-ink min-h-screen">
          <TopNav />
          <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
