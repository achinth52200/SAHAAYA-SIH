'use client';

import { useEffect, useRef } from 'react';

interface Options {
  /** How often to refetch while the tab is visible. */
  intervalMs?: number;
  /** Set false to pause (e.g. while auth is still hydrating). */
  enabled?: boolean;
}

/**
 * Keeps a page's data fresh without a manual browser refresh.
 *
 * Dashboard pages used to fetch once on mount, so anything that happened afterwards
 * — a victim submitting a check-in, new alerts being generated — stayed invisible
 * until the officer reloaded the page.
 *
 * Refetches on an interval, when the tab regains focus, and when it becomes visible
 * again. Polling is skipped while the tab is hidden so a backgrounded console does
 * not keep hammering the API.
 */
export function useAutoRefresh(callback: () => void | Promise<void>, options: Options = {}) {
  const { intervalMs = 20000, enabled = true } = options;

  // Keep the latest callback without re-arming the timer on every render.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      void callbackRef.current();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') run();
    };

    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const timer = window.setInterval(run, intervalMs);

    return () => {
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs]);
}
