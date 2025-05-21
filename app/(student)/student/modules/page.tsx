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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";

type Module = Database["public"]["Tables"]["modules"]["Row"] & {
  progress?: {
    completed: boolean;
    score?: number;
  };
};

export default function StudentModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get modules assigned to the student through class memberships
      const { data: modules, error } = await supabase
        .from("modules")
        .select(
          `
          *,
          module_assignments!inner(
            class:classes!inner(
              class_memberships!inner(
                user_id
              )
            )
          )
        `
        )
        .eq("module_assignments.classes.class_memberships.user_id", user.id);

      if (error) throw error;

      // Get progress for each module
      const modulesWithProgress = await Promise.all(
        modules.map(async (module) => {
          const { data: progress } = await supabase
            .from("module_progress")
            .select("completed, score")
            .eq("module_id", module.id)
            .eq("user_id", user.id)
            .single();

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
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? "No modules match your search."
              : "No modules have been assigned to you yet."}
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
                    <div className="text-sm text-muted-foreground">
                      {module.progress?.completed ? (
                        <span className="text-green-600">Completed</span>
                      ) : (
                        <span className="text-yellow-600">In Progress</span>
                      )}
                    </div>
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
