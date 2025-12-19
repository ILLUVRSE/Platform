import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PlatformBar } from "../components/PlatformBar";
import { TopNav } from "../components/TopNav";
import { Footer } from "../components/Footer";

const headingFont = localFont({
  src: "../fonts/Heading.ttf",
  variable: "--font-heading",
  weight: "700",
  display: "swap"
});

const bodyFont = localFont({
  src: "../fonts/Body.ttf",
  variable: "--font-body",
  weight: "400",
  display: "swap"
});

const monoFont = localFont({
  src: "../fonts/Mono.ttf",
  variable: "--font-mono",
  weight: "400",
  display: "swap"
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
        className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} bg-[color:var(--bg-cream)] text-[color:var(--text)] antialiased`}
      >
        <div className="min-h-screen" style={{ background: "var(--bg-cream)" }}>
          <PlatformBar />
          <TopNav />
          <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
