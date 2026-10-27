// 이벤트 커버 이미지 Storage 헬퍼 (서버·브라우저 공용, DB_SCHEMA.md 9-1)
// 객체 경로는 {uid}/{uuid}.{ext}. 첫 폴더가 업로드한 사용자 id여야 RLS를 통과한다.
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const EVENT_COVER_BUCKET = "event-covers";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const COVER_PATH_PATTERN = new RegExp(`^(${UUID})/${UUID}\\.(jpg|png|webp)$`);

// 같은 경로를 덮어쓰면 CDN 캐시가 남으므로 매번 새 파일명을 쓴다
export function buildCoverPath(userId: string, file: File): string {
  const ext = EXTENSIONS[file.type] ?? "jpg";
  return `${userId}/${crypto.randomUUID()}.${ext}`;
}

// 경로 형식이 맞고 첫 폴더가 userId인지 (Server Action 재검증용)
export function isOwnCoverPath(path: string, userId: string): boolean {
  return COVER_PATH_PATTERN.exec(path)?.[1] === userId;
}

// 커버 객체 정리. 실패해도 이벤트 저장·삭제는 되돌리지 않는다 (고아 파일은 로그로 남김)
// 삭제 범위는 Storage 정책이 판정한다: 본인 폴더, 관리자는 전체 (DB_SCHEMA.md 9-1, 9-2~9-4 적용 결과)
export async function removeCoverObject(
  supabase: SupabaseClient<Database>,
  path: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(EVENT_COVER_BUCKET)
    .remove([path]);
  if (error) console.error("커버 이미지 삭제 실패", path, error.message);
}

export function getCoverPublicUrl(
  supabase: SupabaseClient<Database>,
  path: string | null
): string | null {
  if (!path) return null;
  return supabase.storage.from(EVENT_COVER_BUCKET).getPublicUrl(path).data
    .publicUrl;
}
