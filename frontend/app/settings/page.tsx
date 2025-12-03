export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="uppercase text-xs tracking-[0.3em] text-white/60 mb-2">
          Settings
        </p>
        <h1 className="text-3xl font-serif font-bold">Settings</h1>
        <p className="text-white/75">
          Future home for theme toggles, endpoint config, and keys. For now, edit
          your <code>.env</code> and restart Docker.
        </p>
      </header>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
        - Theme: Dark teal (default).<br />
        - Backend: {process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"}<br />
        - ComfyUI: http://127.0.0.1:8188/<br />
        - MinIO Console: http://localhost:9001/browser/storysphere-media
      </div>
    </div>
  );
}
