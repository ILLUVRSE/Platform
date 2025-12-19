'use client';

import { useState } from 'react';

export default function OpenAIKeyPage() {
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('openai-api-key') ?? '';
  });
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = () => {
    window.localStorage.setItem('openai-api-key', apiKey.trim());
    setStatus('Saved locally in this browser.');
    setTimeout(() => setStatus(null), 3000);
  };

  const masked = apiKey ? `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}` : 'Not set';

  return (
    <main
      className="mx-auto min-h-screen max-w-3xl px-4 py-12"
      style={{ background: 'var(--cream)', color: 'var(--text)' }}
    >
      <div className="rounded-3xl border p-8 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--forest)' }}>
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: 'var(--forest)' }}>
          OpenAI API Key
        </h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--text)' }}>
          Store your OpenAI API key in this browser so experimental tools can access it. The key never leaves your device and is saved to localStorage.
        </p>

        <div className="mt-6 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--forest)' }}>
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--text)' }}
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition"
            style={{ background: 'var(--sage)', color: '#fff', boxShadow: '0 10px 20px -12px rgba(62,95,80,0.4)' }}
          >
            Save to browser
          </button>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Current: {masked}
          </div>
          {status && (
            <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--forest)' }}>
              {status}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border px-4 py-3 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--cream)', color: 'var(--muted)' }}>
          Tip: For server-side usage, set the environment variable `OPENAI_API_KEY` instead. This page only stores the key locally for client-side features.
        </div>
      </div>
    </main>
  );
}
