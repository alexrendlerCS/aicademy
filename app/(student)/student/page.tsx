"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleCard } from "@/components/module-card";
import { XpBadge } from "@/components/xp-badge";
import { ProgressBar } from "@/components/progress-bar";
import { BookOpen, Award, Clock, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function StudentDashboard() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Get user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      setUser(userData.user);
      const userId = userData.user.id;

      // 1. Get all class IDs where the student is approved
      const { data: memberships } = await supabase
        .from("class_memberships")
        .select("class_id")
        .eq("student_id", userId)
        .eq("status", "approved");
      const approvedClassIds = (memberships || []).map((m) => m.class_id);
      console.log("approvedClassIds", approvedClassIds);

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
      console.log("moduleIds", moduleIds);

      // 3. Get the modules
      let modulesData: any[] = [];
      if (moduleIds.length > 0) {
        const { data: modulesResult } = await supabase
          .from("modules")
          .select("*")
          .in("id", moduleIds);
        modulesData = modulesResult || [];
      }
      console.log("modulesData", modulesData);

      // Get progress for each module
      const modulesWithProgress = await Promise.all(
        (modulesData || []).map(async (module: any) => {
          const { data: progress } = await supabase
            .from("module_progress")
            .select("completed, score")
            .eq("module_id", module.id)
            .eq("user_id", userId)
            .single();
          return {
            ...module,
            progress: progress || { completed: false },
          };
        })
      );
      setModules(modulesWithProgress);

      // Get XP and level (from user profile or progress)
      const { data: userProfile } = await supabase
        .from("users")
        .select("xp, level")
        .eq("id", userId)
        .single();
      setXp(userProfile?.xp || 0);
      setLevel(userProfile?.level || 1);

      // Get achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("*, achievement:achievements(*)")
        .eq("student_id", userId);
      setAchievements(userAchievements || []);

      // DEBUG: Log all module assignments and modules
      const { data: allAssignments } = await supabase
        .from("module_assignments")
        .select("*");
      console.log("allAssignments", allAssignments);
      const { data: allModules } = await supabase.from("modules").select("*");
      console.log("allModules", allModules);

      setLoading(false);
    };
    fetchData();
  }, []);

  // In progress modules
  const inProgressModules = modules.filter((m) => !m.progress?.completed);
  // Recently completed modules (last 3)
  const recentlyCompletedModules = modules
    .filter((m) => m.progress?.completed)
    .slice(-3);
  // Stats
  const inProgressCount = inProgressModules.length;
  const completedCount = modules.filter((m) => m.progress?.completed).length;
  const achievementsCount = achievements.length;

  // Subject progress (mocked for now, can be calculated from lessons if needed)
  const subjectProgress = [
    { subject: "Math", value: 75 },
    { subject: "Reading", value: 60 },
    { subject: "Science", value: 90 },
    { subject: "Overall", value: 75 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Student Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back
            {user ? `, ${user.user_metadata?.full_name || user.email}` : ""}!
            Continue your learning journey.
          </p>
        </div>
        <XpBadge xp={xp} level={level} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              Modules currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Modules completed so far
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Earned</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{xp.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">XP from all modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievementsCount}</div>
            <p className="text-xs text-muted-foreground">Badges earned</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Continue Learning</h2>
          <Button variant="outline" asChild>
            <Link href="/student/modules">View All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inProgressModules.map((module) => (
            <ModuleCard
              key={module.id}
              id={module.id}
              title={module.title}
              subject={module.subject}
              description={module.description}
              lessonCount={module.lessonCount}
              progress={module.progress?.score || 0}
              userType="student"
              status={module.progress?.completed ? "completed" : "in-progress"}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recently Completed</h2>
          <Button variant="outline" asChild>
            <Link href="/student/completed">View All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentlyCompletedModules.map((module) => (
            <ModuleCard
              key={module.id}
              id={module.id}
              title={module.title}
              subject={module.subject}
              description={module.description}
              lessonCount={module.lessonCount}
              progress={module.progress?.score || 1}
              userType="student"
              status="completed"
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Progress (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectProgress.map((s) => (
              <div key={s.subject}>
                <div className="flex items-center justify-between mb-1">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{s.subject}</p>
                  </div>
                  <div className="font-medium text-sm">{s.value}%</div>
                </div>
                <ProgressBar
                  value={s.value}
                  max={100}
                  showLabel={false}
                  color={s.subject.toLowerCase() as any}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
