'use client';

import { useEffect } from 'react';
import { useToastStore } from '@food/lib/toastStore';

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => remove(t.id), 3000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, remove]);

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-lg border text-sm bg-white ${
            toast.type === 'success'
              ? 'border-emerald-200 text-emerald-800'
              : toast.type === 'error'
              ? 'border-red-200 text-red-700'
              : 'border-stone-200 text-stone-700'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
