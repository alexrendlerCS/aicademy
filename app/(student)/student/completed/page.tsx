"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SubjectIcon } from "@/components/subject-icon";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";

export default function CompletedModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        const userId = userData.user.id;

        // Get all completed modules for the student
        const { data: completedModules } = await supabase
          .from("student_modules")
          .select("module_id, completed_at, progress")
          .eq("student_id", userId)
          .not("completed_at", "is", null);

        if (!completedModules?.length) {
          setLoading(false);
          return;
        }

        const moduleIds = completedModules.map((m) => m.module_id);
        const { data: modulesData } = await supabase
          .from("modules")
          .select("*")
          .in("id", moduleIds);

        // Get lesson count for each module
        const modulesWithProgress = await Promise.all(
          (modulesData || []).map(async (module) => {
            const progress = completedModules.find(
              (m) => m.module_id === module.id
            );
            const { count: lessonCount } = await supabase
              .from("lessons")
              .select("id", { count: "exact", head: true })
              .eq("module_id", module.id);
            return {
              ...module,
              progress,
              lessonCount: lessonCount || 0,
            };
          })
        );

        setModules(modulesWithProgress);
      } catch (error) {
        console.error("Error fetching completed modules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const filteredModules = modules
    .filter(
      (module) =>
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by completion date (most recent first)
      const aDate = new Date(a.progress.completed_at);
      const bDate = new Date(b.progress.completed_at);
      return bDate.getTime() - aDate.getTime();
    });

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Completed Modules</h1>
          <p className="text-muted-foreground">All modules you have finished</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search completed modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading completed modules...</div>
        ) : filteredModules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
            <img
              src="/placeholder-logo.png"
              alt="No completed modules"
              className="w-32 h-32 mb-4 opacity-70"
            />
            <div className="text-lg font-semibold mb-2">
              {searchQuery
                ? "No completed modules match your search."
                : "You have not completed any modules yet."}
            </div>
            {!searchQuery && (
              <div className="text-base">
                Keep learning to see your achievements here!
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map((module) => {
              const progress =
                typeof module.progress?.progress === "number"
                  ? module.progress.progress
                  : 1;
              const completedDate = new Date(module.progress.completed_at);

              return (
                <div
                  key={module.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-3 hover:scale-105 hover:shadow-2xl transition-all border-2 border-primary/10 focus-within:ring-2 focus-within:ring-primary"
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
                      variant="default"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Completed
                    </Badge>
                  </div>
                  <ProgressBar
                    value={progress * 100}
                    max={100}
                    color={module.subject || "primary"}
                  />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-muted/40 rounded px-2 py-1 w-fit text-xs text-muted-foreground">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="mr-1"
                      >
                        <path
                          stroke="currentColor"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                        />
                      </svg>
                      <span>
                        Completed on{" "}
                        {completedDate.toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="mt-2"
                    onClick={() => router.push(`/student/modules/${module.id}`)}
                  >
                    Review
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
