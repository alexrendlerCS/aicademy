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
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SubjectIcon } from "@/components/subject-icon";

interface QuizAttempt {
  selected_index: number | null;
  answer_text: string | null;
}

interface QuizQuestion {
  id: string;
  type: string;
  attempt: QuizAttempt[];
}

interface Lesson {
  id: string;
  quiz_questions: QuizQuestion[];
}

interface Module {
  id: string;
  lessons: Lesson[];
}

interface ModuleAssignment {
  module_id: string;
  modules: {
    id: string;
    lessons: {
      id: string;
      quiz_questions: {
        id: string;
        type: string;
        attempt: {
          selected_index: number | null;
          answer_text: string | null;
        }[];
      }[];
    }[];
  };
}

export default function StudentDashboard() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [classProgress, setClassProgress] = useState<
    Array<{
      id: string;
      name: string;
      progress: number;
      totalQuizzes: number;
      completedQuizzes: number;
    }>
  >([]);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Fetch class progress
  const fetchClassProgress = async (userId: string) => {
    try {
      // Get all classes where student is approved
      const { data: memberships } = await supabase
        .from("class_memberships")
        .select("class_id")
        .eq("student_id", userId)
        .eq("status", "approved");

      if (!memberships?.length) return;
      const classIds = memberships.map((m) => m.class_id);

      // Get class details
      const { data: classes } = await supabase
        .from("classes")
        .select("*")
        .in("id", classIds);

      if (!classes?.length) return;

      // Get all modules for progress calculation
      const { data: allModules } = await supabase
        .from("modules")
        .select("*");

      // For each class, calculate progress based on lesson completion
      const progressPromises = classes.map(async (cls) => {
        const classSubject = cls.name.toLowerCase();
        let relevantModules = [];
        
        // Use same logic as module display
        if (classSubject.includes('math')) {
          relevantModules = allModules?.filter(m => m.subject === 'math') || [];
        } else if (classSubject.includes('reading') || classSubject.includes('literacy')) {
          relevantModules = allModules?.filter(m => m.subject === 'reading') || [];
        } else if (classSubject.includes('science')) {
          relevantModules = allModules?.filter(m => m.subject === 'science') || [];
        } else if (classSubject.includes('ai')) {
          relevantModules = allModules?.filter(m => m.subject === 'Computer Science') || [];
        } else {
          relevantModules = allModules?.slice(0, 3) || [];
        }

        let totalLessons = 0;
        let completedLessons = 0;

        // Calculate progress for each relevant module
        await Promise.all(relevantModules.map(async (module) => {
          // Get all lessons for this module
          const { data: allLessons } = await supabase
            .from("lessons")
            .select("id")
            .eq("module_id", module.id);

          // Get lesson progress for this student and module
          const { data: directProgress } = await supabase
            .from("lesson_progress")
            .select("*, lessons!inner(module_id)")
            .eq("student_id", userId)
            .eq("lessons.module_id", module.id);

          totalLessons += allLessons?.length || 0;
          completedLessons += directProgress?.filter(lp => lp.completed)?.length || 0;
        }));

        const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        return {
          id: cls.id,
          name: cls.name,
          progress,
          totalQuizzes: totalLessons, // Renamed to reflect lessons instead of quizzes
          completedQuizzes: completedLessons,
        };
      });

      const classProgressData = await Promise.all(progressPromises);
      console.log("Class Progress Data:", classProgressData);

      setClassProgress(
        classProgressData.sort((a, b) => b.progress - a.progress)
      );
    } catch (error) {
      console.error("Error fetching class progress:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          console.error("No user found");
          setLoading(false);
          return;
        }

        // Debug logging for user authentication
        console.log("=== DEBUG: Student Dashboard User ===");
        console.log("User ID:", userData.user.id);
        console.log("User Email:", userData.user.email);
        console.log("User object:", userData.user);
        console.log("====================================");

        setUser(userData.user);
        const userId = userData.user.id;

        // Fetch class progress
        await fetchClassProgress(userId);

        // Fetch classes with teacher name
        const { data: classes, error } = await supabase
          .from("classes")
          .select(
            `
            *,
            users!classes_teacher_id_fkey (
              full_name
            ),
            class_memberships!inner(status)
          `
          )
          .eq("class_memberships.student_id", userId);

        if (error) {
          console.error("Error fetching classes:", error);
          throw error;
        }

        console.log("Raw classes data:", classes);

        // First, fetch all modules
        const { data: allModules } = await supabase
          .from("modules")
          .select("*");
        console.log("allModules", allModules);

        // For each class, fetch module count
        const classesWithModules = await Promise.all(
          (classes || []).map(async (cls) => {
            console.log("Processing class:", cls);
            console.log("Teacher data:", cls.users);
            // Calculate module count based on subject matching (same logic as module display)
            const classSubject = cls.name.toLowerCase();
            let moduleCount = 0;
            
            if (classSubject.includes('math')) {
              moduleCount = allModules?.filter(m => m.subject === 'math')?.length || 0;
            } else if (classSubject.includes('reading') || classSubject.includes('literacy')) {
              moduleCount = allModules?.filter(m => m.subject === 'reading')?.length || 0;
            } else if (classSubject.includes('science')) {
              moduleCount = allModules?.filter(m => m.subject === 'science')?.length || 0;
            } else if (classSubject.includes('ai')) {
              moduleCount = allModules?.filter(m => m.subject === 'Computer Science')?.length || 0;
            } else {
              moduleCount = Math.min(3, allModules?.length || 0);
            }

            const classData = {
              ...cls,
              membership: cls.class_memberships[0],
              teacherName: cls.users?.full_name || "Unknown Teacher",
              moduleCount: moduleCount,
            };

            console.log("Processed class data:", classData);
            return classData;
          })
        );

        // Get all modules and assign them based on class subject/teacher
        const modulesWithProgress = await Promise.all(
          (classesWithModules || []).map(async (cls) => {
            console.log("Processing class:", cls.name, "ID:", cls.id);
            
            // Get modules that should belong to this class
            // For demo purposes, let's assign modules based on subject matching or teacher
            const classSubject = cls.name.toLowerCase();
            let relevantModules = [];
            
            if (classSubject.includes('math')) {
              relevantModules = allModules?.filter(m => m.subject === 'math') || [];
            } else if (classSubject.includes('reading') || classSubject.includes('literacy')) {
              relevantModules = allModules?.filter(m => m.subject === 'reading') || [];
            } else if (classSubject.includes('science')) {
              relevantModules = allModules?.filter(m => m.subject === 'science') || [];
            } else if (classSubject.includes('ai')) {
              relevantModules = allModules?.filter(m => m.subject === 'Computer Science') || [];
            } else {
              // Default: assign 3-4 random modules for demo
              relevantModules = allModules?.slice(0, 3) || [];
            }
            
            console.log(`Relevant modules for ${cls.name}:`, relevantModules.map(m => m.title));

            // First, check if there's any lesson progress for this user at all
            const { data: allUserProgress } = await supabase
              .from("lesson_progress")
              .select("*")
              .eq("student_id", userId)
              .limit(10);
            console.log(`User ${userId} has lesson progress entries:`, allUserProgress?.length || 0);
            
            // Show first few entries
            if (allUserProgress && allUserProgress.length > 0) {
              console.log("Sample lesson progress:", allUserProgress.slice(0, 3));
              
              // Check if we can get lesson info for these progress entries
              const sampleLessonIds = allUserProgress.slice(0, 3).map(lp => lp.lesson_id);
              const { data: sampleLessons } = await supabase
                .from("lessons")
                .select("id, title, module_id")
                .in("id", sampleLessonIds);
              console.log("Sample lessons:", sampleLessons);
            }

            // Map each relevant module and calculate progress from lesson_progress table
            const modulePromises = relevantModules.map(async (module) => {
              // Get lessons for this module with lesson progress joined
              const { data: lessonsWithProgress } = await supabase
                .from("lessons")
                .select(`
                  *,
                  lesson_progress!inner(
                    id,
                    completed,
                    completed_at,
                    student_id
                  )
                `)
                .eq("module_id", module.id)
                .eq("lesson_progress.student_id", userId);

              console.log(`Module "${module.title}" lessons with progress:`, lessonsWithProgress?.length || 0);

              // Also get all lessons for this module (to know total count)
              const { data: allLessons } = await supabase
                .from("lessons")
                .select("id")
                .eq("module_id", module.id);

              const totalLessons = allLessons?.length || 0;
              
              // Get lesson progress directly and count completed ones
              const { data: directProgress } = await supabase
                .from("lesson_progress")
                .select("*, lessons!inner(module_id)")
                .eq("student_id", userId)
                .eq("lessons.module_id", module.id);

              
              // Count actually completed lessons
              const completedLessons = directProgress?.filter(lp => lp.completed)?.length || 0;

              const progress = totalLessons > 0 ? completedLessons / totalLessons : 0;
              const isCompleted = progress === 1;

              console.log(`Module "${module.title}": ${completedLessons}/${totalLessons} completed = ${Math.round(progress * 100)}%`);

              return {
                ...module,
                class: cls,
                progress: {
                  completed_at: isCompleted ? new Date().toISOString() : null,
                  progress: progress,
                },
                due_date: null,
                lessonCount: totalLessons,
              };
            });

            return Promise.all(modulePromises);
          })
        );

        // Flatten the array of arrays into a single array of modules
        const flattenedModules = modulesWithProgress.flat();
        setModules(flattenedModules);

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

        // All module assignments logic removed - now using subject-based assignment
      } catch (error) {
        console.error("Error in fetchData:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // In progress modules (limit to 3)
  const allInProgressModules = modules
    .filter((m) => {
      const hasProgress = m.progress?.progress > 0;
      const isNotCompleted = !m.progress?.completed_at;
      return hasProgress && isNotCompleted;
    })
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  const inProgressModules = allInProgressModules.slice(0, 3);

  // Recently completed modules (last 3)
  const allCompletedModules = modules
    .filter((m) => m.progress?.completed_at)
    .sort((a, b) => {
      const aDate = new Date(a.progress.completed_at);
      const bDate = new Date(b.progress.completed_at);
      return bDate.getTime() - aDate.getTime();
    });

  const recentlyCompletedModules = allCompletedModules.slice(0, 3);

  // Not started modules (limit to 3)
  const allNotStartedModules = modules
    .filter(
      (m) =>
        !m.progress?.completed_at &&
        (!m.progress?.progress || m.progress.progress === 0)
    )
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  const notStartedModules = allNotStartedModules.slice(0, 3);

  // Stats
  const completedCount = allCompletedModules.length;
  const inProgressCount = allInProgressModules.length;
  const notStartedCount = allNotStartedModules.length;
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
            <CardTitle className="text-sm font-medium whitespace-nowrap">
              In Progress
            </CardTitle>
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
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notStartedCount}</div>
            <p className="text-xs text-muted-foreground">
              Modules not yet started
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classProgress.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <p>No class progress to show yet.</p>
                <p className="text-sm">
                  Join some classes to start tracking your progress!
                </p>
              </div>
            ) : (
              classProgress.map((cls) => (
                <div key={cls.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {cls.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cls.completedQuizzes} of {cls.totalQuizzes} lessons
                        completed
                      </p>
                    </div>
                    <div className="font-medium text-sm">
                      {Math.round(cls.progress)}%
                    </div>
                  </div>
                  <ProgressBar
                    value={cls.progress}
                    max={100}
                    showLabel={false}
                    color="primary"
                  />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Continue Learning</h2>
            {allInProgressModules.length > 3 && (
              <span className="text-sm text-muted-foreground">
                (+{allInProgressModules.length - 3} more)
              </span>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/modules?filterType=status&status=in-progress">
              View All
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inProgressModules.map((module) => {
            const isCompleted = module.progress?.completed_at;
            const hasProgress =
              typeof module.progress?.progress === "number" &&
              module.progress.progress > 0;
            const progress =
              typeof module.progress?.progress === "number"
                ? module.progress.progress
                : 0;

            let status: "completed" | "in-progress" | "not-started";
            let badgeVariant: "default" | "outline";
            let badgeClasses: string;

            if (isCompleted) {
              status = "completed";
              badgeVariant = "default";
              badgeClasses = "bg-green-500 hover:bg-green-600";
            } else if (hasProgress) {
              status = "in-progress";
              badgeVariant = "outline";
              badgeClasses = "bg-yellow-400 text-yellow-900 border-yellow-300";
            } else {
              status = "not-started";
              badgeVariant = "outline";
              badgeClasses =
                "bg-muted text-muted-foreground border-muted-foreground/20";
            }

            return (
              <div key={module.id}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-3 hover:scale-105 hover:shadow-2xl transition-all border-2 border-primary/10 focus-within:ring-2 focus-within:ring-primary">
                  <div className="flex items-center gap-4 mb-2">
                    <SubjectIcon
                      subject={module.title || "math"}
                      className="h-12 w-12"
                    />
                    <div className="flex-1">
                      <div className="text-xl font-bold leading-tight">
                        {module.title}
                      </div>
                      <div className="text-base text-muted-foreground line-clamp-2">
                        {module.description}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-primary mt-2">
                        <BookOpen className="h-4 w-4" />
                        {module.lessonCount}{" "}
                        {module.lessonCount === 1 ? "Lesson" : "Lessons"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={badgeVariant} className={badgeClasses}>
                      {status === "completed" && "Completed"}
                      {status === "in-progress" && "In Progress"}
                      {status === "not-started" && "Not Started"}
                    </Badge>
                  </div>
                  <ProgressBar
                    value={progress * 100}
                    max={100}
                    color={module.title || "primary"}
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
                        <>
                          Due{" "}
                          {new Date(module.due_date).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </>
                      ) : (
                        <span className="italic">No due date</span>
                      )}
                    </span>
                  </div>
                  <Button
                    className="mt-2"
                    onClick={() => router.push(`/student/modules/${module.id}`)}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            );
          })}
          {allInProgressModules.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No modules in progress. Start learning something new!
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Not Started</h2>
            {allNotStartedModules.length > 3 && (
              <span className="text-sm text-muted-foreground">
                (+{allNotStartedModules.length - 3} more)
              </span>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/modules?filterType=status&status=not-started">
              View All
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notStartedModules.map((module) => {
            const status = "not-started";
            const badgeVariant = "outline";
            const badgeClasses =
              "bg-muted text-muted-foreground border-muted-foreground/20";

            return (
              <div key={module.id}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-3 hover:scale-105 hover:shadow-2xl transition-all border-2 border-primary/10 focus-within:ring-2 focus-within:ring-primary">
                  <div className="flex items-center gap-4 mb-2">
                    <SubjectIcon
                      subject={module.title || "math"}
                      className="h-12 w-12"
                    />
                    <div className="flex-1">
                      <div className="text-xl font-bold leading-tight">
                        {module.title}
                      </div>
                      <div className="text-base text-muted-foreground line-clamp-2">
                        {module.description}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-primary mt-2">
                        <BookOpen className="h-4 w-4" />
                        {module.lessonCount}{" "}
                        {module.lessonCount === 1 ? "Lesson" : "Lessons"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={badgeVariant} className={badgeClasses}>
                      Not Started
                    </Badge>
                  </div>
                  <ProgressBar
                    value={0}
                    max={100}
                    color={module.title || "primary"}
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
                        <>
                          Due{" "}
                          {new Date(module.due_date).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </>
                      ) : (
                        <span className="italic">No due date</span>
                      )}
                    </span>
                  </div>
                  <Button
                    className="mt-2"
                    onClick={() => router.push(`/student/modules/${module.id}`)}
                  >
                    Start
                  </Button>
                </div>
              </div>
            );
          })}
          {allNotStartedModules.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              You've started all your assigned modules!
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Recently Completed</h2>
            {allCompletedModules.length > 3 && (
              <span className="text-sm text-muted-foreground">
                (+{allCompletedModules.length - 3} more)
              </span>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/completed">View All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentlyCompletedModules.map((module) => {
            const status = "completed";
            const badgeVariant = "default";
            const badgeClasses = "bg-green-500 hover:bg-green-600";
            const progress =
              typeof module.progress?.progress === "number"
                ? module.progress.progress
                : 1;

            return (
              <div key={module.id}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-3 hover:scale-105 hover:shadow-2xl transition-all border-2 border-primary/10 focus-within:ring-2 focus-within:ring-primary">
                  <div className="flex items-center gap-4 mb-2">
                    <SubjectIcon
                      subject={module.title || "math"}
                      className="h-12 w-12"
                    />
                    <div className="flex-1">
                      <div className="text-xl font-bold leading-tight">
                        {module.title}
                      </div>
                      <div className="text-base text-muted-foreground line-clamp-2">
                        {module.description}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-primary mt-2">
                        <BookOpen className="h-4 w-4" />
                        {module.lessonCount}{" "}
                        {module.lessonCount === 1 ? "Lesson" : "Lessons"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={badgeVariant} className={badgeClasses}>
                      Completed
                    </Badge>
                  </div>
                  <ProgressBar
                    value={progress * 100}
                    max={100}
                    color={module.title || "primary"}
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
                        <>
                          Due{" "}
                          {new Date(module.due_date).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </>
                      ) : (
                        <span className="italic">No due date</span>
                      )}
                    </span>
                  </div>
                  <Button
                    className="mt-2"
                    onClick={() => router.push(`/student/modules/${module.id}`)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            );
          })}
          {allCompletedModules.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No completed modules yet. Keep learning!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
