import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AIcademy - AI-Enhanced Learning Platform",
  description:
    "Modern educational platform with AI assistance for K-College education",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
