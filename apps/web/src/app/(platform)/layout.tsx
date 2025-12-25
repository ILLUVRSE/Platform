import type { ReactNode } from "react";
import { PlatformBar } from "@/components/PlatformBar";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="platform-shell min-h-screen bg-[color:var(--bg-cream)] text-[color:var(--text)]">
      <PlatformBar />
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">{children}</main>
      <Footer />
    </div>
  );
}
