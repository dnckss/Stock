import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-500 font-mono">본문 로딩 중...</p>
      </div>
    </div>
  );
}

