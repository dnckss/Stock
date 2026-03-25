import NewsDetailView from '@/components/news/NewsDetailView';
import { fetchNewsDetail } from '@/lib/api';

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

  const isLoading = false;
  let error: string | null = null;
  let articleText = '';
  let fetchedAt = '';
  let apiTitle = '';
  let apiPublisher = '';
  let apiTimestamp = '';

  if (!url) {
    error = 'url 파라미터가 필요합니다';
  } else {
    try {
      const data = await fetchNewsDetail(url);
      apiTitle = typeof data.title === 'string' ? data.title.trim() : '';
      apiPublisher =
        typeof data.publisher === 'string' ? data.publisher.trim() : '';
      apiTimestamp =
        typeof data.timestamp === 'string' ? data.timestamp.trim() : '';
      articleText = typeof data.article_text === 'string' ? data.article_text : '';
      fetchedAt = typeof data.fetched_at === 'string' ? data.fetched_at : '';
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
      backHref={backHref}
      url={url}
      title={title}
      publisher={publisher}
      timestamp={timestamp}
      fetchedAt={fetchedAt}
      articleText={articleText}
      isLoading={isLoading}
      error={error}
    />
  );
}

