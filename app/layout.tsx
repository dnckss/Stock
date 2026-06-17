import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import "./globals.css";

// 모든 페이지 layout에 항상 마운트되지만 초기 가시 UI는 없거나(AlertWatcher)
// 닫혀있는 floating 위젯(ChatWidget) — react-markdown/framer-motion/lucide 다수를
// 끌고 들어오므로 dynamic import로 critical path에서 제외한다.
// (자식이 'use client'이므로 ssr:false 없이도 클라이언트 전용으로 동작)
const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"));
const AlertWatcher = dynamic(() => import("@/components/common/AlertWatcher"));
const NavSidebar = dynamic(() => import("@/components/common/NavSidebar"));

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quantix — AI-Powered Market Intelligence",
  description:
    "실시간 시장 분석, 투자 시그널, 포트폴리오 전략을 한곳에서",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavSidebar />
        {children}
        <ChatWidget />
        <AlertWatcher />
        <Toaster theme="dark" position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
