import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AIcademy - AI-Assisted Learning Platform",
  description:
    "Modern educational platform with AI assistance for K-12 classrooms",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <div className="flex-1 flex flex-col items-center w-full">
              {children}
            </div>
          </SidebarProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
