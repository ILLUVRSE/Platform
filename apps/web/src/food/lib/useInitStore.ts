'use client';

import { useEffect } from 'react';
import { useStore } from './store';

// Ensures the store initialization runs only once on the client.
export function useInitStore() {
  useEffect(() => {
    const { initialized, loading, init } = useStore.getState();
    if (!initialized && !loading) {
      void init();
    }
  }, []);
}
