import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Your To-Do — 스마트 할 일 관리",
  description:
    "AI 기반 스마트 입력, 마감 임박 시각화, 스와이프 제스처, 작업 위임까지. 당신의 완벽한 할 일 관리 파트너.",
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
          <div className="app-container">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
