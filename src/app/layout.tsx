import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import KakaoRedirect from "@/components/KakaoRedirect/KakaoRedirect";
import GlobalNicknameCheck from "@/components/NicknameModal/GlobalNicknameCheck";
import InstallPrompt from "@/components/InstallPrompt/InstallPrompt";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://your-to-do-10bd1.web.app"),
  title: "Your To-Do — 스마트 할 일 관리",
  description:
    "AI 기반 스마트 입력, 마감 임박 시각화, 작업 위임 & 실시간 진행 추적까지. 당신만의 완벽한 할 일 관리 파트너.",
  keywords: ["할 일 관리", "투두리스트", "업무 위임", "To-Do", "할일 공유", "팀 관리", "PWA 앱"],
  authors: [{ name: "Your To-Do Team" }],
  openGraph: {
    title: "📋 Your To-Do — 할 일을 함께 관리하세요",
    description: "마감일 시각화, 일괄 지시, 실시간 진행 추적. 카톡으로 링크 하나 보내면 바로 시작!",
    url: "https://your-to-do-10bd1.web.app",
    siteName: "Your To-Do",
    images: [
      {
        url: "/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "Your To-Do — 스마트 할 일 관리 앱 미리보기",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "📋 Your To-Do — 할 일을 함께 관리하세요",
    description: "마감일 시각화, 일괄 지시, 실시간 진행 추적. 카톡으로 링크 하나 보내면 바로 시작!",
    images: ["/images/og-share.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Your To-Do",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0e17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider>
          <ServiceWorkerRegistrar />
          <KakaoRedirect />
          <GlobalNicknameCheck />
          <InstallPrompt />
          <div className="app-container">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
