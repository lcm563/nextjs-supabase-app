import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type AdminSearchFormProps = {
  /** 폼을 제출할 경로 (GET) */
  action: string;
  defaultQuery: string;
  placeholder: string;
  /** 검색어 외에 유지할 쿼리 파라미터 (예: 상태 필터) */
  hiddenParams?: Record<string, string>;
};

// 관리자 목록 검색 폼. GET 제출이라 검색어가 URL에 남는다
export function AdminSearchForm({
  action,
  defaultQuery,
  placeholder,
  hiddenParams = {},
}: AdminSearchFormProps) {
  return (
    <form action={action} role="search" className="flex gap-2">
      {Object.entries(hiddenParams).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Input
        type="search"
        name="q"
        defaultValue={defaultQuery}
        placeholder={placeholder}
        aria-label="검색어"
        className="min-w-0 flex-1"
      />
      <Button type="submit" variant="outline" className="shrink-0">
        <Search aria-hidden="true" />
        검색
      </Button>
    </form>
  );
}
