'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Shield, KeyRound, LogIn, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useInitStore } from '@/lib/useInitStore';
import Link from 'next/link';

interface ControlCenterProps {
  open: boolean;
  onClose: () => void;
}

export function ControlCenter({ open, onClose }: ControlCenterProps) {
  useInitStore();
  const apiKey = useStore((state) => state.apiKey);
  const setApiKey = useStore((state) => state.setApiKey);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const [tempKey, setTempKey] = useState(apiKey);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid' | 'checking'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey]);

  const handleValidate = async () => {
    if (!tempKey) {
      setStatus('invalid');
      setStatusMessage('Add a key first.');
      return;
    }
    setStatus('checking');
    setStatusMessage('Validating...');
    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: tempKey }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('valid');
        setStatusMessage('Key looks good!');
        setApiKey(tempKey);
      } else {
        setStatus('invalid');
        setStatusMessage(data.error || 'Key could not be verified');
      }
    } catch (error: any) {
      setStatus('invalid');
      setStatusMessage(error?.message || 'Validation failed');
    }
  };

  const handleSave = () => {
    setApiKey(tempKey);
    setStatus('idle');
    setStatusMessage('Saved locally to this browser.');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl relative overflow-hidden">
        <button
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-stone-100 text-stone-500"
          onClick={onClose}
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-stone-200 bg-gradient-to-r from-amber-100 via-white to-rose-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-amber-200 text-sm font-semibold text-amber-700">
            <Shield className="w-4 h-4" />
            Control Center
          </div>
          <h3 className="text-2xl font-serif font-bold text-secondary mt-3">Settings</h3>
          <p className="text-stone-600">Manage your OpenAI key and account.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-stone-800">OpenAI API Key</p>
                <p className="text-xs text-stone-500">Stored locally in your browser.</p>
              </div>
            </div>
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-primary focus:border-primary"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-full bg-primary text-white font-semibold shadow-sm hover:bg-secondary"
              >
                Save locally
              </button>
              <button
                onClick={handleValidate}
                className="px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
              >
                Validate key
              </button>
              {status === 'checking' && <span className="text-sm text-stone-500">Checking...</span>}
              {status === 'valid' && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> Key valid
                </span>
              )}
              {status === 'invalid' && (
                <span className="inline-flex items-center gap-1 text-sm text-red-500">
                  <AlertTriangle className="w-4 h-4" /> {statusMessage}
                </span>
              )}
            </div>
            {statusMessage && status !== 'invalid' && (
              <p className="text-xs text-stone-500">{statusMessage}</p>
            )}
          </div>

          <div className="border-t border-stone-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-800">Account</p>
                <p className="text-xs text-stone-500">
                  {user ? `Signed in as ${user.email}` : 'Not signed in'}
                </p>
              </div>
              {user ? (
                <div className="flex gap-2">
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:text-red-600 hover:border-red-200"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <a
                  href="/auth"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-200 text-stone-700 hover:border-primary hover:text-primary"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
