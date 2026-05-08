import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js 16 Starter",
  description:
    "Node.js 22 + Next.js 16 + Better Auth + React 19 + TypeScript + DynamoDB + Tailwind CSS starter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
