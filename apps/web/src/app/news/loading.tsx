export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-slate-100">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]">
        <span className="h-2 w-2 animate-ping rounded-full bg-amber-300" />
      Loading ILLUVRSE News…
      </div>
    </main>
  );
}
