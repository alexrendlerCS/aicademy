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

export default function CompletedModulesPage() {
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
      setModules(modulesWithProgress.filter((m) => m.progress?.completed));
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
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? "No completed modules match your search."
              : "You have not completed any modules yet."}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map((module) => (
              <Card
                key={module.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/student/modules/${module.id}`)}
              >
                <CardHeader>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-green-600">Completed</div>
                    {module.progress?.score !== undefined && (
                      <div className="text-sm font-medium">
                        Score: {module.progress.score}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
