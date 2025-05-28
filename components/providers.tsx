"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import { DemoProvider } from "@/lib/demo-context";
import { DemoIndicator } from "@/components/demo-indicator";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <DemoProvider>
          <SidebarProvider>
            <div className="flex-1 flex flex-col items-center w-full">
              {children}
            </div>
            <DemoIndicator />
          </SidebarProvider>
        </DemoProvider>
      </ThemeProvider>
      <Toaster position="top-right" richColors />
    </>
  );
}
