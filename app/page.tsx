import {
  LandingActions,
  LandingActionsSkeleton,
  LandingFinalAction,
  LandingFinalActionSkeleton,
  UpcomingEventsStrip,
} from "@/components/landing-actions";
import { LandingPreview } from "@/components/landing-preview";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  CalendarDays,
  Copy,
  Hourglass,
  ImageIcon,
  ListChecks,
  Pencil,
  Users,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { Suspense } from "react";

// 랜딩: 정적 쉘(소개·기능·FAQ)은 프리렌더하고, 로그인 여부에 따라 달라지는 부분만 Suspense 안에서 요청 시점에 그린다
// 구성은 docs/ROADMAP.md "랜딩 재구성" 시안(히어로+미리보기 → 3단계 → 역할별 기능 → 사용 예 → FAQ → CTA)

const STEPS = [
  {
    title: "이벤트 만들기",
    description:
      "일시·장소·정원·응답 마감을 입력하고 커버 이미지를 올려요. 지난 모임을 복제하면 날짜만 바꾸면 됩니다.",
  },
  {
    title: "링크 공유하기",
    description:
      "버튼 한 번으로 링크를 복사해 카톡방에 붙여 넣어요. 링크를 연 사람은 로그인 후 바로 응답 화면으로 돌아옵니다.",
  },
  {
    title: "응답 확인하기",
    description:
      "참석·대기·미정·불참이 이름과 함께 정리돼요. 자리가 나면 먼저 기다린 사람부터 참석으로 바뀝니다.",
  },
];

type Feature = { icon: LucideIcon; title: string; description: string };

const HOST_FEATURES: Feature[] = [
  {
    icon: CalendarDays,
    title: "일시·장소·정원·응답 마감 설정",
    description:
      "마감이 지나면 응답 변경이 막히고, 끝난 모임은 '지난 이벤트'로 분리돼요",
  },
  {
    icon: ImageIcon,
    title: "커버 이미지",
    description: "모임 분위기가 한눈에 보이도록 대표 사진 한 장",
  },
  {
    icon: Copy,
    title: "지난 모임 복제",
    description: "매주 같은 모임이라면 내용은 그대로, 날짜만 새로",
  },
  {
    icon: Pencil,
    title: "공지 수정 표시",
    description: "장소나 시간이 바뀌면 '수정됨' 배지와 수정 시각이 함께 보여요",
  },
];

const PARTICIPANT_FEATURES: Feature[] = [
  {
    icon: ListChecks,
    title: "버튼 한 번으로 응답",
    description:
      "참석·불참·미정 중 하나만 누르면 끝, 마감 전까지 언제든 바꿀 수 있어요",
  },
  {
    icon: Hourglass,
    title: "대기자 자동 승격",
    description:
      "정원이 차면 대기 순번이 생기고, 자리가 나면 먼저 기다린 사람부터 참석으로",
  },
  {
    icon: Users,
    title: "누가 오는지 한눈에",
    description: "참석·대기·미정·불참 명단을 모두가 같은 화면으로 확인해요",
  },
  {
    icon: CalendarCheck,
    title: "내 이벤트 모아 보기",
    description: "'내가 주최'와 '내가 참여'로 나눠 다가오는 순서대로",
  },
];

const USE_CASES = [
  "수영 정기모임",
  "헬스·크로스핏",
  "러닝 크루",
  "풋살·배드민턴",
  "스터디·독서 모임",
];

// 사실과 다른 약속을 하지 않는다: 참여자도 응답하려면 로그인이 필요하다 (PRD 4장)
const FAQ = [
  {
    question: "참여자도 가입해야 하나요?",
    answer:
      "응답하려면 로그인이 필요해요. Google·카카오 계정이면 별도 가입 절차 없이 바로 로그인하고, 받은 링크의 이벤트로 돌아옵니다.",
  },
  {
    question: "정원이 차면 어떻게 되나요?",
    answer:
      "이후 참석을 누른 사람은 대기자로 등록돼요. 참석자가 불참이나 미정으로 바꾸면 먼저 기다린 순서대로 자동으로 참석 처리됩니다.",
  },
  {
    question: "응답 마감이 지나면요?",
    answer:
      "마감 시각 이후에는 응답을 바꿀 수 없고 안내 문구가 표시돼요. 모임이 끝나면 '지난 이벤트'로 따로 보관됩니다.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={null}>
          <UpcomingEventsStrip />
        </Suspense>

        <section
          aria-labelledby="hero-title"
          className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:gap-14"
        >
          <div className="flex flex-col gap-5">
            <span className="self-start rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
              정기 모임 총무를 위한 이벤트 관리
            </span>
            <h1
              id="hero-title"
              className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl"
            >
              링크 하나로 공지하고,
              <br />
              참석 현황은 자동으로
            </h1>
            <p className="text-muted-foreground sm:text-lg">
              일시·장소·정원만 정하면 공유 링크가 만들어집니다. 카톡방에 붙여
              넣으면 참석·불참·미정 응답이 모이고, 정원이 차면 대기자까지 알아서
              정리돼요.
            </p>
            <Suspense fallback={<LandingActionsSkeleton />}>
              <LandingActions />
            </Suspense>
            <p className="text-sm text-muted-foreground">
              Google·카카오 계정으로 바로 시작할 수 있어요
            </p>
          </div>
          <LandingPreview />
        </section>

        <section
          id="how"
          aria-labelledby="how-title"
          className="border-y bg-card"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-14">
            <div className="space-y-2 text-center">
              <h2 id="how-title" className="text-2xl font-bold sm:text-3xl">
                세 단계면 공지가 끝나요
              </h2>
              <p className="text-muted-foreground">
                단톡방에서 참석 인원을 세던 일을 링크 하나로
              </p>
            </div>
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-xl border bg-background p-5 md:flex-col md:p-6"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold">
                      <span className="sr-only">{index + 1}단계: </span>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="features"
          aria-labelledby="features-title"
          className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-14"
        >
          <div className="space-y-2 text-center">
            <h2 id="features-title" className="text-2xl font-bold sm:text-3xl">
              총무도, 참여자도 편하게
            </h2>
            <p className="text-muted-foreground">역할에 맞는 기능만 담았어요</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <FeatureGroup
              role="주최자"
              title="모임을 여는 사람"
              features={HOST_FEATURES}
              emphasized
            />
            <FeatureGroup
              role="참여자"
              title="링크를 받은 사람"
              features={PARTICIPANT_FEATURES}
            />
          </div>
        </section>

        <section aria-labelledby="usecase-title" className="border-y bg-card">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-12">
            <h2 id="usecase-title" className="text-xl font-bold sm:text-2xl">
              이런 모임에 잘 맞아요
            </h2>
            <ul className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {USE_CASES.map((useCase) => (
                <li
                  key={useCase}
                  className="rounded-full border bg-background px-4 py-2 text-sm font-medium"
                >
                  {useCase}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="faq"
          aria-labelledby="faq-title"
          className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-14"
        >
          <h2 id="faq-title" className="text-center text-2xl font-bold">
            자주 묻는 질문
          </h2>
          <div className="space-y-3">
            {FAQ.map(({ question, answer }, index) => (
              <details
                key={question}
                open={index === 0}
                className="group rounded-xl border bg-card px-5"
              >
                <summary className="cursor-pointer list-none py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {question}
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="cta-title"
          className="mx-auto max-w-5xl px-4 pb-14"
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground">
            <h2 id="cta-title" className="text-2xl font-bold sm:text-3xl">
              이번 주 모임 공지, 링크로 보내 보세요
            </h2>
            <p>만드는 데 1분이면 충분해요</p>
            <Suspense fallback={<LandingFinalActionSkeleton />}>
              <LandingFinalAction />
            </Suspense>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function FeatureGroup({
  role,
  title,
  features,
  emphasized = false,
}: {
  role: string;
  title: string;
  features: Feature[];
  emphasized?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span
          className={
            emphasized
              ? "rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground"
              : "rounded-full bg-foreground px-3 py-1 text-sm font-semibold text-background"
          }
        >
          {role}
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ul className="space-y-4">
        {features.map(({ icon: Icon, title: featureTitle, description }) => (
          <li key={featureTitle} className="flex gap-4">
            <span
              className={
                emphasized
                  ? "flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"
                  : "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
              }
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-semibold">{featureTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
