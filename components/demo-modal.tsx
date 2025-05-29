"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { loginAsDemo } from "@/lib/demo-auth";
import { useRouter } from "next/navigation";
import { School, GraduationCap } from "lucide-react";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const router = useRouter();
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

      onClose();

      // Redirect to the regular dashboards
      if (role === "teacher") {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
    } catch (error: any) {
      console.error("Demo login error:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
