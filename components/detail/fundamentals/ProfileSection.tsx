'use client';

import { useState } from 'react';
import { Building2, Globe, Users, MapPin, ExternalLink } from 'lucide-react';
import { formatMarketCap } from '@/lib/api';
import type { FundamentalsProfile } from '@/types/dashboard';

function InfoRow({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-zinc-800/30 last:border-b-0">
      <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
      <span className="text-[11px] text-zinc-500 w-16 shrink-0">{label}</span>
      <span className="text-[11px] text-zinc-200 truncate">{value}</span>
    </div>
  );
}

export default function ProfileSection({ profile }: { profile: FundamentalsProfile | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!profile) {
    return (
      <div className="px-4 py-8 text-center">
        <span className="text-[11px] text-zinc-600">기업 개요 데이터가 없습니다</span>
      </div>
    );
  }

  const badges = [profile.sector, profile.industry].filter(Boolean);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Company name + badges */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">{profile.name || '-'}</h3>
        {badges.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {badges.map((b) => (
              <span
                key={b}
                className="inline-flex text-[9px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {profile.description && (
        <div>
          <p
            className={`text-[11px] text-zinc-400 leading-relaxed ${
              !expanded ? 'line-clamp-3' : ''
            }`}
          >
            {profile.description}
          </p>
          {profile.description.length > 150 && (
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 mt-1 transition-colors"
            >
              {expanded ? '접기' : '더보기'}
            </button>
          )}
        </div>
      )}

      {/* Key info card */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3.5 py-1">
        <InfoRow
          icon={Building2}
          label="시가총액"
          value={
            profile.marketCapDisplay ||
            (profile.marketCap != null ? formatMarketCap(profile.marketCap) : '-')
          }
        />
        {profile.sharesOutstanding != null && (
          <InfoRow
            icon={Building2}
            label="발행주식"
            value={profile.sharesOutstanding.toLocaleString('en-US')}
          />
        )}
        <InfoRow
          icon={Users}
          label="직원 수"
          value={profile.employees != null ? profile.employees.toLocaleString('en-US') + '명' : ''}
        />
        <InfoRow icon={MapPin} label="본사" value={profile.headquarters} />
        <InfoRow icon={Globe} label="국가" value={profile.country} />
      </div>

      {/* Website */}
      {profile.website && (
        <a
          href={profile.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          {profile.website.replace(/^https?:\/\/(?:www\.)?/, '').replace(/\/$/, '')}
        </a>
      )}

      {/* Officers */}
      {profile.officers.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
            주요 임원
          </p>
          <div className="space-y-1.5">
            {profile.officers.map((o, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-300">{o.name}</span>
                <span className="text-[10px] text-zinc-500 truncate ml-2">{o.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
