import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PlatformBar } from "@/components/PlatformBar";
import SiteChrome from "@news/components/site-chrome";

const geistSans = localFont({
  src: "../../fonts/Body.ttf",
  variable: "--font-geist-sans",
  weight: "400",
  display: "swap"
});

const geistMono = localFont({
  src: "../../fonts/Mono.ttf",
  variable: "--font-geist-mono",
  weight: "400",
  display: "swap"
});

export const metadata: Metadata = {
  title: "ILLUVRSE News — Global Public Access News Network",
  description: "Region-aware public access news, features, and radio with verifiable sources and open data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-black text-slate-100 antialiased`}>
      <PlatformBar />
      <SiteChrome>{children}</SiteChrome>
    </div>
  );
}
