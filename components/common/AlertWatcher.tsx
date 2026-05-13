'use client';

import { useAlertWatcher } from '@/hooks/useAlertWatcher';

/**
 * 전역 가격 알림 워처.
 * layout에서 1회 마운트되어 활성 알림을 주기적으로 평가한다.
 */
export default function AlertWatcher() {
  useAlertWatcher();
  return null;
}
