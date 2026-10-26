import type { NextConfig } from "next";

// 이벤트 커버 이미지(Supabase Storage 공개 버킷)만 next/image 최적화 대상으로 허용한다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const coverImagePatterns = supabaseUrl
  ? [
      new URL(
        `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/event-covers/**`
      ),
    ]
  : [];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // 정적 App Shell 우선 prefetch (Cache Components 신규 프로젝트 권장 설정)
  partialPrefetching: true,
  images: {
    remotePatterns: coverImagePatterns,
  },
};

export default nextConfig;
