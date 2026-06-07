'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Globe,
  Target,
  Star,
  GitCompare,
  Newspaper,
  CalendarDays,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** 전역 내비게이션 단일 소스 — 좌측 끝 hover 시 열리는 오버레이 사이드바. */
const NAV_ITEMS: {
  href: string;
  label: string;
  icon: React.ElementType;
  match: (p: string) => boolean;
}[] = [
  { href: '/', label: 'Terminal', icon: Home, match: (p) => p === '/' },
  { href: '/markets', label: 'Markets', icon: Globe, match: (p) => p.startsWith('/markets') },
  { href: '/strategy', label: 'Strategy', icon: Target, match: (p) => p.startsWith('/strategy') },
  { href: '/watchlist', label: 'Watchlist', icon: Star, match: (p) => p.startsWith('/watchlist') },
  { href: '/compare', label: 'Compare', icon: GitCompare, match: (p) => p.startsWith('/compare') },
  { href: '/news/list', label: 'News', icon: Newspaper, match: (p) => p.startsWith('/news') },
  { href: '/economic-calendar', label: 'Calendar', icon: CalendarDays, match: (p) => p.startsWith('/economic-calendar') },
];

const OPEN_EDGE_PX = 14;
const CLOSE_DELAY_MS = 180;

export default function NavSidebar() {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  // 좌측 끝(hot-zone) hover 감지 → 열기
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (e.clientX <= OPEN_EDGE_PX && !openRef.current) setOpen(true);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Esc 로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 라우트 변경 시 자동 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 언마운트 시 타이머 정리
  useEffect(() => () => clearCloseTimer(), []);

  return (
    <>
      {/* 닫혀있을 때 발견성/터치용 핸들 */}
      <button
        type="button"
        aria-label="메뉴 열기"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          'fixed left-0 top-1/2 z-40 flex h-16 w-4 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-zinc-800 bg-zinc-900/90 text-zinc-500 transition-opacity hover:text-green-500',
          open ? 'pointer-events-none opacity-0' : 'opacity-100',
        )}
      >
        <ChevronRight className="h-3 w-3" />
      </button>

      {/* 사이드바 패널 (오버레이) */}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : '-100%' }}
        transition={{ type: 'tween', duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
        aria-hidden={!open}
        className="fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r border-zinc-800 bg-[#0a0a0a]/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        {/* 브랜드 */}
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <span className="font-mono text-sm font-bold tracking-wider text-zinc-100">
            Quant<span className="text-green-500">ix</span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
            Menu
          </span>
        </div>

        {/* 내비 항목 */}
        <nav className="terminal-scroll flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                    active
                      ? 'bg-zinc-800/70 text-green-500'
                      : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </motion.aside>
    </>
  );
}
