"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModuleCard } from "@/components/module-card";
import { PlusCircle, Users, BookOpen, BarChart } from "lucide-react";

export default function TeacherDashboard() {
  const [modules, setModules] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [avgCompletion, setAvgCompletion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Could not get current user.");
        setLoading(false);
        return;
      }
      // Fetch classes for this teacher
      const { data: classData } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id);
      const classIds = (classData || []).map((c) => c.id);
      // Fetch approved student_ids in these classes
      let studentIds: string[] = [];
      if (classIds.length > 0) {
        const { data: memberData } = await supabase
          .from("class_memberships")
          .select("student_id")
          .in("class_id", classIds)
          .eq("status", "approved");
        studentIds = (memberData || [])
          .map((m) => m.student_id)
          .filter(Boolean);
        console.log("class_memberships studentIds:", studentIds);
      }
      // Fetch user info for these students
      let allStudents: any[] = [];
      if (studentIds.length > 0) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", studentIds);
        allStudents = userData || [];
      }
      setStudents(allStudents);
      // Fetch modules for this teacher (with lessons)
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*, lessons(id)")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      if (modulesError) {
        setError("Could not fetch modules.");
        setLoading(false);
        return;
      }
      // For each module, count lessons
      const modulesWithLessonCount = (modulesData || []).map((mod) => ({
        ...mod,
        lessonCount: mod.lessons ? mod.lessons.length : 0,
      }));
      setModules(modulesWithLessonCount);
      // Fetch student_modules for these modules (for completion)
      const moduleIds = modulesWithLessonCount.map((m) => m.id);
      let completions: number[] = [];
      if (moduleIds.length > 0) {
        const { data: studentModules } = await supabase
          .from("student_modules")
          .select("progress")
          .in("module_id", moduleIds);
        completions = (studentModules || [])
          .map((sm) => (typeof sm.progress === "number" ? sm.progress : null))
          .filter((v): v is number => v !== null);
        console.log("student_modules progress:", completions);
      }
      // Calculate average completion
      const avg =
        completions.length > 0
          ? completions.reduce((a, b) => a + b, 0) / completions.length
          : null;
      setAvgCompletion(avg);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Manage your modules and track student progress.
          </p>
        </div>
        <Button asChild>
          <Link href="/teacher/modules/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Module
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Students in your classes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Modules
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-xs text-muted-foreground">Modules you created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Completion
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgCompletion !== null
                ? `${Math.round(avgCompletion * 100)}%`
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              Average module completion
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Modules</h2>
          <Button variant="outline" asChild>
            <Link href="/teacher/modules">View All</Link>
          </Button>
        </div>
        {loading ? (
          <div>Loading modules...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                id={module.id}
                title={module.title}
                subject={module.subject}
                description={module.description}
                lessonCount={module.lessonCount}
                userType="teacher"
              />
            ))}
            {modules.length === 0 && <div>No modules found.</div>}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Student Progress</h2>
          <Button variant="outline" asChild>
            <Link href="/teacher/progress">View Details</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Class Overview</CardTitle>
            <CardDescription>
              Recent student activity and module completion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-muted-foreground">(Coming soon)</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
