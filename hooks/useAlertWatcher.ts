'use client';

import { useEffect, useMemo, useRef } from 'react';
import { fetchStockQuote, parseQuote } from '@/lib/api';
import { useAlerts } from '@/hooks/useAlerts';
import { ALERT_POLL_INTERVAL_MS } from '@/lib/constants';

/**
 * 활성 가격 알림을 주기적으로 평가하고, 조건 도달 시 브라우저 알림을 발화한다.
 *
 * - 알림은 useAlerts(localStorage)로 관리되며 본 훅은 read + trigger만 수행
 * - Notification 권한이 'granted'가 아니면 폴링 자체를 건너뜀
 * - 각 ticker는 1회 fetch로 그룹핑 (Promise.allSettled)
 * - 발화 후 markTriggered로 중복 발화 방지
 */
export function useAlertWatcher(): void {
  const { alerts, markTriggered, notify } = useAlerts();
  const inflightRef = useRef(false);

  // 활성 알림 식별자만 추출 — 동일 구성이면 effect를 재실행하지 않는다
  const activeKey = useMemo(
    () =>
      alerts
        .filter((a) => !a.triggered)
        .map((a) => `${a.id}:${a.ticker}:${a.targetPrice}:${a.direction}`)
        .sort()
        .join('|'),
    [alerts],
  );

  useEffect(() => {
    const active = alerts.filter((a) => !a.triggered);
    if (active.length === 0) return;

    let cancelled = false;

    const evaluate = async () => {
      if (cancelled || inflightRef.current) return;
      if (
        typeof Notification === 'undefined' ||
        Notification.permission !== 'granted'
      ) {
        return;
      }
      inflightRef.current = true;
      try {
        const tickers = Array.from(new Set(active.map((a) => a.ticker)));
        const results = await Promise.allSettled(
          tickers.map(async (t) => ({ ticker: t, quote: parseQuote(await fetchStockQuote(t)) })),
        );
        if (cancelled) return;

        const priceMap = new Map<string, number>();
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value.quote) {
            priceMap.set(r.value.ticker, r.value.quote.price);
          }
        }

        for (const alert of active) {
          const price = priceMap.get(alert.ticker);
          if (price == null || !Number.isFinite(price)) continue;
          const hit =
            alert.direction === 'above'
              ? price >= alert.targetPrice
              : price <= alert.targetPrice;
          if (!hit) continue;

          const dirSym = alert.direction === 'above' ? '↑' : '↓';
          const dirLabel = alert.direction === 'above' ? '이상' : '이하';
          notify(
            `${alert.ticker} ${dirSym} $${alert.targetPrice.toFixed(2)}`,
            `현재가 $${price.toFixed(2)} (목표 ${dirLabel} 도달)`,
          );
          markTriggered(alert.id);
        }
      } catch {
        // 폴링 실패는 무시 — 다음 인터벌에서 재시도
      } finally {
        inflightRef.current = false;
      }
    };

    void evaluate();
    const id = setInterval(() => void evaluate(), ALERT_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // activeKey가 동일하면 재실행하지 않음. alerts는 closure로 캡처해도 OK
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, markTriggered, notify]);
}
