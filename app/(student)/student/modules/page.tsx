"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SubjectIcon } from "@/components/subject-icon";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";

export default function StudentModulesPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const userId = userData.user.id;

      // 1. Get all class IDs where the student is approved
      const { data: memberships } = await supabase
        .from("class_memberships")
        .select("class_id")
        .eq("student_id", userId)
        .eq("status", "approved");
      const approvedClassIds = (memberships || []).map((m) => m.class_id);

      // 2. Get all module assignments for those classes or directly to the student
      let moduleAssignmentsQuery = supabase
        .from("module_assignments")
        .select("module_id");
      if (approvedClassIds.length > 0) {
        moduleAssignmentsQuery = moduleAssignmentsQuery.or(
          `class_id.in.(${approvedClassIds.join(",")}),student_id.eq.${userId}`
        );
      } else {
        moduleAssignmentsQuery = moduleAssignmentsQuery.eq(
          "student_id",
          userId
        );
      }
      const { data: moduleAssignments } = await moduleAssignmentsQuery;
      const moduleIds = (moduleAssignments || []).map((ma) => ma.module_id);

      // 3. Get the modules
      let modulesData: any[] = [];
      if (moduleIds.length > 0) {
        const { data: modulesResult } = await supabase
          .from("modules")
          .select("*")
          .in("id", moduleIds);
        modulesData = modulesResult || [];
      }

      // 4. Get progress for each module
      const modulesWithProgress = await Promise.all(
        (modulesData || []).map(async (module: any) => {
          const { data: progress } = await supabase
            .from("module_progress")
            .select("completed, score")
            .eq("module_id", module.id)
            .eq("user_id", userId)
            .maybeSingle();
          return {
            ...module,
            progress: progress || { completed: false },
          };
        })
      );
      setModules(modulesWithProgress);
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter(
    (module) =>
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">My Modules</h1>
          <p className="text-muted-foreground">
            View and complete your assigned learning modules
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading modules...</div>
        ) : filteredModules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
            <img
              src="/placeholder-logo.png"
              alt="No modules"
              className="w-32 h-32 mb-4 opacity-70"
            />
            <div className="text-lg font-semibold mb-2">No modules yet!</div>
            <div className="text-base">
              Check back soon for new learning adventures.
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map((module) => {
              const isCompleted = module.progress?.completed;
              const progress =
                module.progress?.score !== undefined
                  ? module.progress.score
                  : 0;
              return (
                <div
                  key={module.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-3 cursor-pointer hover:scale-105 hover:shadow-2xl transition-all border-2 border-primary/10 focus-within:ring-2 focus-within:ring-primary"
                  tabIndex={0}
                  onClick={() => router.push(`/student/modules/${module.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      router.push(`/student/modules/${module.id}`);
                  }}
                  role="button"
                  aria-label={`Open module ${module.title}`}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <SubjectIcon
                      subject={module.subject || "math"}
                      className="h-12 w-12"
                    />
                    <div className="flex-1">
                      <div className="text-xl font-bold leading-tight">
                        {module.title}
                      </div>
                      <div className="text-base text-muted-foreground line-clamp-2">
                        {module.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={isCompleted ? "default" : "outline"}
                      className={
                        isCompleted
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-yellow-400 text-yellow-900 border-yellow-300"
                      }
                    >
                      {isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                    {/* New badge logic can be added here if needed */}
                  </div>
                  <ProgressBar
                    value={progress}
                    max={100}
                    color={module.subject || "primary"}
                  />
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="font-medium">
                      {module.lesson_count || 1}{" "}
                      {module.lesson_count === 1 ? "Lesson" : "Lessons"}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                        />
                      </svg>
                      <span>
                        Due: <span className="italic">Coming Soon</span>
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
