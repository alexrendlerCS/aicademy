"use client";

import { AlertCircle } from "lucide-react";
import { useDemo } from "@/lib/demo-context";
import { cn } from "@/lib/utils";

export function DemoIndicator({ className }: { className?: string }) {
  const { isDemo, demoRole } = useDemo();

  if (!isDemo) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-yellow-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg",
        className
      )}
    >
      <AlertCircle className="h-4 w-4" />
      <span>Demo Mode ({demoRole})</span>
      <div className="ml-2 h-2 w-2 animate-pulse rounded-full bg-white" />
    </div>
  );
}
