import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_JP({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ミルクモンスター",
  description: "あなたの'おいしい'が、モンスターになる。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning={true}>
      {/* 背景色クラスを削除 */}
      <body className={`${noto.className}`}>{children}</body>
    </html>
  );
}