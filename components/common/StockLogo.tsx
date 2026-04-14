'use client';

import { useState } from 'react';
import { getStockLogoUrl } from '@/lib/logos';

interface StockLogoProps {
  ticker: string;
  size: number;
  className?: string;
}

export default function StockLogo({ ticker, size, className = '' }: StockLogoProps) {
  const [errored, setErrored] = useState(false);
  const logoUrl = getStockLogoUrl(ticker);

  return (
    <div
      className={`shrink-0 rounded-xl overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {!errored ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoUrl}
          alt={`${ticker} logo`}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
          <span
            className="font-bold text-zinc-300 font-mono"
            style={{ fontSize: size * 0.3 }}
          >
            {ticker.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
