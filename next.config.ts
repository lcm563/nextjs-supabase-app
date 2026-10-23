import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // 정적 App Shell 우선 prefetch (Cache Components 신규 프로젝트 권장 설정)
  partialPrefetching: true,
};

export default nextConfig;
