"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { loginAsDemo } from "@/lib/demo-auth";
import { useRouter } from "next/navigation";
import { School, GraduationCap } from "lucide-react";

export function DemoModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (role: "student" | "teacher") => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await loginAsDemo(role);

      if (!result.success) {
        throw new Error(result.error || "Failed to login as demo user");
      }

      setIsOpen(false);
      // Refresh the page to update the UI with the new session
      router.refresh();
    } catch (error: any) {
      console.error("Demo login error:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          Try Demo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Try a Demo Account</DialogTitle>
          <DialogDescription>
            Choose which type of account you'd like to try:
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <Button
            onClick={() => handleDemoLogin("student")}
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            {isLoading ? "Loading..." : "Try as Student"}
          </Button>
          <Button
            onClick={() => handleDemoLogin("teacher")}
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            {isLoading ? "Loading..." : "Try as Teacher"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
