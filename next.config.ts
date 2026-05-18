import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/**
 * 홈 디렉터리 등 상위에 다른 lockfile(yarn.lock 등)이 있으면 Next가
 * 워크스페이스 루트를 잘못 잡아 Turbopack 오류가 날 수 있습니다.
 * 이 파일이 있는 디렉터리를 앱 루트로 고정합니다.
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
 *
 * 개발 서버는 `package.json`의 `dev` 스크립트가 `next dev --webpack`을 쓰도록 되어 있습니다.
 * (Next 16 기본 Turbopack에서 ProjectContainer 등 내부 오류가 날 때 우회)
 * Turbopack으로만 돌리려면: `npm run dev:turbo`
 */
const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.parqet.com' },
    ],
  },
  // 응답을 gzip으로 압축 (정적 자산은 별도 캐시)
  compress: true,
  // 프로덕션 번들에 소스맵 노출 안 함 (보안 + 크기)
  productionBrowserSourceMaps: false,
  // 응답 헤더의 X-Powered-By: Next.js 제거
  poweredByHeader: false,
  // 패키지 전체 import 대신 사용된 심볼만 트리쉐이크
  // — lucide-react, recharts, framer-motion 등 barrel re-export가 큰 라이브러리에 효과
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      'react-markdown',
      'remark-gfm',
      'rehype-sanitize',
      '@base-ui/react',
      'react-gauge-component',
    ],
  },
  // 프로덕션 빌드에서 console.* 제거 (단, error/warn 은 보존)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
};

export default nextConfig;
