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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
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
      // Fetch modules for this teacher
      const { data, error: modulesError } = await supabase
        .from("modules")
        .select("*, lessons(count)")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      if (modulesError) {
        setError("Could not fetch modules.");
        setLoading(false);
        return;
      }
      setModules(data || []);
      setLoading(false);
    };
    fetchModules();
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
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">(Coming soon)</p>
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
            <p className="text-xs text-muted-foreground">(Live)</p>
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
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">(Coming soon)</p>
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
                lessonCount={module.lessons?.length || 0}
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
