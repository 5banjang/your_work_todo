import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import KakaoRedirect from "@/components/KakaoRedirect/KakaoRedirect";
import GlobalNicknameCheck from "@/components/NicknameModal/GlobalNicknameCheck";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://your-to-do-10bd1.web.app"),
  title: "Your To-Do — 스마트 할 일 관리",
  description:
    "AI 기반 스마트 입력, 마감 임박 시각화, 스와이프 제스처, 작업 위임까지. 당신의 완벽한 할 일 관리 파트너.",
  openGraph: {
    title: "Your To-Do 📋 커스텀 투두 모아보기",
    description: "진행 상황과 마감일을 한눈에 다같이. 카카오톡에서 바로 우리만의 투두 리스트를 확인하고 완료하세요!",
    url: "https://your-to-do.com",
    siteName: "Your To-Do",
    images: [
      {
        url: "/images/og-share.jpg",
        width: 1200,
        height: 630,
        alt: "Your To-Do App Preview",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Your To-Do 📋 커스텀 투두 모아보기",
    description: "진행 상황과 마감일을 한눈에 다같이. 카카오톡에서 바로 우리만의 투두 리스트를 확인하고 완료하세요!",
    images: ["/images/og-share.jpg"],
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
          <div className="app-container">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
