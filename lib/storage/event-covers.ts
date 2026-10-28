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

// Storage 업로드 오류 중 안내에 필요한 필드 (StorageApiError·StorageUnknownError 공통)
type CoverUploadError = {
  message: string;
  status?: number;
  statusCode?: string;
};

// 업로드 실패 원인별 안내. status가 없으면 요청이 서버에 닿지 못한 경우다(네트워크·보안 프로그램 차단)
export function coverUploadErrorMessage(
  error: CoverUploadError | null
): string {
  if (!error) return "로그인이 만료되었습니다. 새로고침 후 다시 시도해주세요";
  if (error.status === undefined) {
    return "이미지 전송이 중간에 끊겼습니다. 네트워크 연결이나 회사 보안 프로그램(파일 전송 차단)을 확인하거나, 이미지를 제거하고 저장해주세요";
  }
  const detail = `${error.statusCode ?? ""} ${error.message}`;
  if (error.status === 413 || /413|EntityTooLarge|too large/i.test(detail)) {
    return "이미지는 5MB 이하로 올려주세요";
  }
  if (error.status === 415 || /415|mime/i.test(detail)) {
    return "JPG, PNG, WEBP 형식의 이미지만 올릴 수 있어요";
  }
  if (
    error.status === 401 ||
    error.status === 403 ||
    /401|403|jwt|unauthorized|security policy/i.test(detail)
  ) {
    return "업로드 권한을 확인하지 못했습니다. 새로고침하거나 다시 로그인한 뒤 시도해주세요";
  }
  return "커버 이미지를 올리지 못했습니다. 잠시 후 다시 시도해주세요";
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
