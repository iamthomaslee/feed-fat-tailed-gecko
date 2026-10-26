import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "팻테일게코 벌레잡기",
  description: "방향키로 팻테일게코를 움직여 벌레를 잡아먹는 게임",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
