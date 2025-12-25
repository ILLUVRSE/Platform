'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@food/lib/store';
import { Loader2, Shield, Trash2 } from 'lucide-react';
import { useInitStore } from '@food/lib/useInitStore';
import { isTelemetryEnabled, setTelemetry } from '@food/lib/telemetry';

interface Session {
  token: string;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  useInitStore();
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [telemetry, setTelemetryState] = useState(isTelemetryEnabled());

  useEffect(() => {
    if (!user) router.push('/food/auth');
  }, [user, router]);

  useEffect(() => {
    const loadSessions = async () => {
      const res = await fetch('/food/api/auth/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    };
    loadSessions();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/food/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not change password');
      setMessage('Password updated. Please keep it safe.');
      setOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      setMessage(error.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (token: string) => {
    await fetch('/food/api/auth/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    setSessions((prev) => prev.filter((s) => s.token !== token));
  };

  const handleDeleteAccount = async () => {
    if (!confirm('This will delete all recipes and data. Continue?')) return;
    const res = await fetch('/food/api/auth/delete', { method: 'POST' });
    if (res.ok) {
      await logout();
      router.push('/food');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-serif font-bold text-secondary">Account & Security</h1>
      </div>

      {message && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1">Current password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-stone-300 rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-1">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-stone-300 rounded-md"
          />
          <p className="text-xs text-stone-500 mt-1">Use at least 8 characters. Stronger passwords recommended.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-semibold"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Update password
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-800">Two-factor (placeholder)</p>
            <p className="text-xs text-stone-500">Toggle to simulate 2FA; not enforced yet.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={twoFAEnabled}
              onChange={(e) => setTwoFAEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
            />
            Enable 2FA
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-800">Telemetry (local console)</p>
            <p className="text-xs text-stone-500">Logs key actions to console only. No network.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={telemetry}
              onChange={(e) => {
                setTelemetryState(e.target.checked);
                setTelemetry(e.target.checked);
              }}
              className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
            />
            Enable
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-3">
        <h2 className="text-sm font-semibold text-stone-700">Active sessions</h2>
        <ul className="divide-y divide-stone-100">
          {sessions.map((s) => (
            <li key={s.token} className="py-2 flex items-center justify-between text-sm">
              <span>Started {new Date(s.createdAt).toLocaleString()}</span>
              <button
                onClick={() => handleRevoke(s.token)}
                className="text-stone-500 hover:text-red-500 text-xs"
              >
                Revoke
              </button>
            </li>
          ))}
          {sessions.length === 0 && <li className="py-2 text-stone-500 text-sm">No sessions found.</li>}
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-800">Delete account</p>
            <p className="text-xs text-stone-500">Removes all recipes, groceries, and planner data.</p>
          </div>
          <button
            onClick={handleDeleteAccount}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-sm"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
