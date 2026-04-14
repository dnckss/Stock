const PARQET_BASE = 'https://assets.parqet.com/logos/symbol';

/**
 * 주식 티커에 대한 로고 URL을 반환한다.
 * Parqet CDN에서 SVG 로고를 제공 (대부분의 미국 상장사 커버).
 * 매핑에 없는 티커도 시도 — Parqet에 있을 수 있음.
 */
export function getStockLogoUrl(ticker: string): string {
  return `${PARQET_BASE}/${ticker.toUpperCase()}`;
}
