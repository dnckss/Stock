'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'quantix_alerts';

export interface PriceAlert {
  id: string;
  ticker: string;
  targetPrice: number;
  direction: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
}

function loadAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAlerts(alerts: PriceAlert[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); } catch { /* silent */ }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => { setAlerts(loadAlerts()); }, []);

  const add = useCallback((ticker: string, targetPrice: number, direction: 'above' | 'below') => {
    setAlerts((prev) => {
      const next = [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ticker: ticker.toUpperCase(),
        targetPrice,
        direction,
        createdAt: Date.now(),
        triggered: false,
      }];
      saveAlerts(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setAlerts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveAlerts(next);
      return next;
    });
  }, []);

  const markTriggered = useCallback((id: string) => {
    setAlerts((prev) => {
      const next = prev.map((a) => a.id === id ? { ...a, triggered: true } : a);
      saveAlerts(next);
      return next;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const notify = useCallback((title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  return { alerts, add, remove, markTriggered, requestPermission, notify };
}
