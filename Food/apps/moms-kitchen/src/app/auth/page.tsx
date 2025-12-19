'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useInitStore } from '@/lib/useInitStore';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  useInitStore();
  const user = useStore((state) => state.user);
  const login = useStore((state) => state.login);
  const register = useStore((state) => state.register);
  const loading = useStore((state) => state.loading);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const strength =
    password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Medium' : password.length > 0 ? 'Weak' : '';

  useEffect(() => {
    if (user) router.push('/');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-300 via-rose-200 to-amber-100 p-8">
        <h1 className="text-3xl font-serif font-bold text-secondary mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create an account'}
        </h1>
        <p className="text-stone-600">
          Save recipes to the cloud so Mom&apos;s favorites follow you everywhere.
        </p>
      </div>

      <div className="p-8 space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border ${
              mode === 'login'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'border-stone-200 text-stone-600'
            }`}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border ${
              mode === 'register'
                ? 'bg-secondary text-white border-secondary shadow-sm'
                : 'border-stone-200 text-stone-600'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-primary focus:border-primary"
              required
            />
            {mode === 'register' && strength && (
              <p className="text-xs mt-1">
                Strength:{' '}
                <span
                  className={
                    strength === 'Strong'
                      ? 'text-green-600'
                      : strength === 'Medium'
                      ? 'text-amber-600'
                      : 'text-red-500'
                  }
                >
                  {strength}
                </span>
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-full font-medium shadow-sm hover:bg-secondary transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-stone-500">
          We keep your recipes on this device in a local file database while you develop. Add real email
          sending later for magic links.
        </p>
      </div>
    </div>
  );
}
