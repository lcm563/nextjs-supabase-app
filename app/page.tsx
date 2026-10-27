import {
  LandingActions,
  LandingActionsSkeleton,
} from "@/components/landing-actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link2, ListChecks, Users } from "lucide-react";
import { Suspense } from "react";

const FEATURES = [
  {
    icon: Link2,
    title: "링크 하나로 공지",
    description:
      "일시·장소·정원을 등록하고 공유 링크를 카톡방에 붙여 넣으면 공지 끝.",
  },
  {
    icon: ListChecks,
    title: "클릭 한 번으로 응답",
    description: "참석·불참·미정 중 하나만 누르면 응답이 바로 집계됩니다.",
  },
  {
    icon: Users,
    title: "정원·대기자 자동 관리",
    description:
      "정원이 차면 대기자로, 자리가 나면 먼저 기다린 사람부터 자동 승격.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-16">
        <section className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            정기 모임 공지와 참석 관리를
            <br />한 곳에서
          </h1>
          <p className="max-w-xl text-muted-foreground sm:text-lg">
            링크 하나로 공지하고, 클릭 한 번으로 참석 현황이 정리됩니다.
            수영·헬스·러닝 모임 총무를 위한 가장 간단한 방법.
          </p>
          <Suspense fallback={<LandingActionsSkeleton />}>
            <LandingActions />
          </Suspense>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="mb-2 size-6 text-primary" />
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
