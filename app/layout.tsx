import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  // 하위 페이지는 "페이지명 | 모임 이벤트" 형식.
  // 공유 링크(/events/[id])는 로그인이 필요해 카카오톡 미리보기는 이 기본 카드로 표시된다 (PRD 8장).
  title: { default: "모임 이벤트", template: "%s | 모임 이벤트" },
  description:
    "링크 하나로 공지하고, 클릭 한 번으로 참석 현황이 정리되는 정기 모임 관리 서비스",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
