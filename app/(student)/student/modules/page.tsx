"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StudentModulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modules, setModules] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<
    "all" | "class" | "subject" | "due-date"
  >(
    (searchParams.get("filterType") as
      | "all"
      | "class"
      | "subject"
      | "due-date") || "all"
  );
  const [selectedClass, setSelectedClass] = useState<string>(
    searchParams.get("classId") || "all"
  );
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<
    "all" | "overdue" | "upcoming" | "no-due-date"
  >("all");
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetchModules();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterType !== "all") {
      params.set("filterType", filterType);
      if (filterType === "class" && selectedClass !== "all") {
        params.set("classId", selectedClass);
      }
    }
    const newUrl = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [filterType, selectedClass]);

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

      // Fetch classes for the filter
      const { data: classesData } = await supabase
        .from("classes")
        .select("*")
        .in("id", approvedClassIds);
      setClasses(classesData || []);

      // 2. Get all module assignments for those classes or directly to the student
      let moduleAssignmentsQuery = supabase
        .from("module_assignments")
        .select("module_id, due_date, class_id, student_id");
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
      const moduleIdToDueDate: Record<string, string> = {};
      const moduleIdToClassId: Record<string, string> = {};
      (moduleAssignments || []).forEach((ma) => {
        if (ma.module_id) {
          if (ma.due_date) moduleIdToDueDate[ma.module_id] = ma.due_date;
          if (ma.class_id) moduleIdToClassId[ma.module_id] = ma.class_id;
        }
      });
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

      // 4. Get progress for each module and lesson count
      const modulesWithProgress = await Promise.all(
        (modulesData || []).map(async (module: any) => {
          const { data: progress } = await supabase
            .from("student_modules")
            .select("completed_at, progress")
            .eq("module_id", module.id)
            .eq("student_id", userId)
            .single();
          // Fetch lesson count for this module
          const { count: lessonCount } = await supabase
            .from("lessons")
            .select("id", { count: "exact", head: true })
            .eq("module_id", module.id);
          return {
            ...module,
            progress: progress || { completed_at: null, progress: 0 },
            lessonCount: lessonCount || 0,
            due_date: moduleIdToDueDate[module.id] || null,
            class_id: moduleIdToClassId[module.id] || null,
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

  const filteredModules = modules
    .filter((module) => {
      // Text search filter
      const matchesSearch =
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Class filter
      const matchesClass =
        selectedClass === "all" || module.class_id === selectedClass;

      // Subject filter
      const matchesSubject =
        selectedSubject === "all" || module.subject === selectedSubject;

      // Due date filter
      let matchesDueDate = true;
      if (dueDateFilter !== "all") {
        const now = new Date();
        if (dueDateFilter === "overdue") {
          matchesDueDate = module.due_date && new Date(module.due_date) < now;
        } else if (dueDateFilter === "upcoming") {
          matchesDueDate = module.due_date && new Date(module.due_date) >= now;
        } else if (dueDateFilter === "no-due-date") {
          matchesDueDate = !module.due_date;
        }
      }

      return matchesSearch && matchesClass && matchesSubject && matchesDueDate;
    })
    .sort((a, b) => {
      // First, separate completed and in-progress modules
      const aCompleted = a.progress?.completed_at;
      const bCompleted = b.progress?.completed_at;

      // If one is completed and the other isn't, show in-progress first
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      // If both are completed, sort by completion date (most recent first)
      if (aCompleted && bCompleted) {
        return (
          new Date(b.progress.completed_at).getTime() -
          new Date(a.progress.completed_at).getTime()
        );
      }

      // For in-progress modules, sort by due date
      if (!a.due_date) return 1; // Push modules without due dates to the end
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">My Modules</h1>
          <p className="text-muted-foreground">
            View and complete your assigned learning modules
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filterType}
            onValueChange={(
              value: "all" | "class" | "subject" | "due-date"
            ) => {
              setFilterType(value);
              // Reset all other filters when changing filter type
              setSelectedClass("all");
              setSelectedSubject("all");
              setDueDateFilter("all");
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="class">By Class</SelectItem>
              <SelectItem value="subject">By Subject</SelectItem>
              <SelectItem value="due-date">By Due Date</SelectItem>
            </SelectContent>
          </Select>

          {filterType === "class" && (
            <Select
              value={selectedClass}
              onValueChange={(value: string) => setSelectedClass(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select class..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterType === "subject" && (
            <Select
              value={selectedSubject}
              onValueChange={(value: string) => setSelectedSubject(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select subject..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="math">Math</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="geography">Geography</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
              </SelectContent>
            </Select>
          )}

          {filterType === "due-date" && (
            <Select
              value={dueDateFilter}
              onValueChange={(
                value: "all" | "overdue" | "upcoming" | "no-due-date"
              ) => setDueDateFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select due date..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Due Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="no-due-date">No Due Date</SelectItem>
              </SelectContent>
            </Select>
          )}
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
              const isCompleted = module.progress?.completed_at;
              const progress =
                typeof module.progress?.progress === "number"
                  ? module.progress.progress
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
                  </div>
                  <ProgressBar
                    value={progress * 100}
                    max={100}
                    color={module.subject || "primary"}
                  />
                  <div className="flex items-center gap-2 bg-muted/40 rounded px-2 py-1 mt-2 w-fit text-xs text-muted-foreground">
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
                      {module.due_date ? (
                        new Date(module.due_date).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      ) : (
                        <span className="italic">No due date</span>
                      )}
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
