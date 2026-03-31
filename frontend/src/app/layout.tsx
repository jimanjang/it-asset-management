import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "당근서비스 워크 | IT 자산 & 디바이스 관리",
  description: "Chrome OS Flex 기반 IT 자산 및 디바이스 통합 관리 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
