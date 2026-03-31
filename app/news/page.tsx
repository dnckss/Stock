import NewsDetailView from '@/components/news/NewsDetailView';
import { fetchNewsDetail } from '@/lib/api';
import type { ApiNewsAnalysis } from '@/types/dashboard';

type SearchParams = Record<string, string | string[] | undefined>;

function normalizeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] ?? '').trim();
  return typeof value === 'string' ? value.trim() : '';
}

export default async function NewsDetailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const url = normalizeParam(sp.url);
  const titleFromList = normalizeParam(sp.title);
  const publisherFromList = normalizeParam(sp.publisher);
  const timestampFromList = normalizeParam(sp.timestamp);
  const refreshRequested = normalizeParam(sp.refresh) === '1';

  const isLoading = false;
  let error: string | null = null;
  let articleMarkdown = '';
  let fetchedAt = '';
  let apiTitle = '';
  let apiPublisher = '';
  let apiTimestamp = '';
  let extractionStatus: string | null = null;
  let media: Array<{ type: string; url: string; caption?: string | null; thumbnail_url?: string | null; provider?: string | null; start_time?: number | null }> = [];
  let mediaDomains: string[] = [];
  let initialAnalysis: ApiNewsAnalysis | null = null;

  if (!url) {
    error = 'url 파라미터가 필요합니다';
  } else {
    try {
      const data = await fetchNewsDetail(url, {
        refresh: refreshRequested,
        analyze: true,
      });
      apiTitle = typeof data.title === 'string' ? data.title.trim() : '';
      apiPublisher =
        typeof data.publisher === 'string' ? data.publisher.trim() : '';
      apiTimestamp =
        typeof data.timestamp === 'string' ? data.timestamp.trim() : '';
      articleMarkdown =
        typeof data.article_markdown === 'string'
          ? data.article_markdown
          : typeof data.article_text === 'string'
            ? data.article_text
            : '';
      fetchedAt = typeof data.fetched_at === 'string' ? data.fetched_at : '';
      extractionStatus =
        typeof data.extraction_status === 'string' ? data.extraction_status : null;
      media = Array.isArray(data.media)
        ? data.media
            .filter((m): m is { type: string; url: string; caption?: string | null; thumbnail_url?: string | null; provider?: string | null; start_time?: number | null } => !!m && typeof m.url === 'string')
            .map((m) => ({
              type: String(m.type ?? ''),
              url: m.url,
              caption: m.caption ?? null,
              thumbnail_url: m.thumbnail_url ?? null,
              provider: m.provider ?? null,
              start_time: m.start_time ?? null,
            }))
        : [];
      mediaDomains =
        Array.isArray(data.domains?.media)
          ? data.domains?.media.filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
          : [];
      initialAnalysis =
        data.analysis && typeof data.analysis === 'object' ? data.analysis : null;
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : '뉴스 본문을 불러올 수 없습니다';
    }
  }

  const title = apiTitle || titleFromList || '뉴스 상세';
  const publisher = apiPublisher || publisherFromList;
  const timestamp = apiTimestamp || timestampFromList;
  const backHref = '/';

  return (
    <NewsDetailView
      key={`${url}|${fetchedAt}`}
      backHref={backHref}
      url={url}
      title={title}
      publisher={publisher}
      timestamp={timestamp}
      fetchedAt={fetchedAt}
      articleMarkdown={articleMarkdown}
      extractionStatus={extractionStatus}
      media={media}
      mediaDomains={mediaDomains}
      initialAnalysis={initialAnalysis}
      isLoading={isLoading}
      error={error}
    />
  );
}

