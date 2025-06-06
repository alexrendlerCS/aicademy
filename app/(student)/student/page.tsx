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

      // For each class, calculate progress
      const progressPromises = classes.map(async (cls) => {
        // Get all module assignments for this class
        const { data: moduleAssignments } = await supabase
          .from("module_assignments")
          .select(
            `
            module_id,
            modules (
              id,
              lessons (
                id,
                quiz_questions (
                  id,
                  type,
                  attempt:quiz_attempts (
                    selected_index,
                    answer_text
                  )
                )
              )
            )
          `
          )
          .eq("class_id", cls.id);

        if (!moduleAssignments?.length) {
          return {
            id: cls.id,
            name: cls.name,
            progress: 0,
            totalQuizzes: 0,
            completedQuizzes: 0,
          };
        }

        let totalQuestions = 0;
        let completedQuestions = 0;

        // Calculate total questions and completed questions across all modules
        moduleAssignments.forEach((assignment) => {
          assignment.modules?.lessons?.forEach((lesson) => {
            if (lesson.quiz_questions) {
              lesson.quiz_questions.forEach((question) => {
                totalQuestions++;
                if (question.attempt?.length > 0) {
                  const attempt = question.attempt[0];
                  if (
                    (attempt.selected_index !== null &&
                      attempt.selected_index !== undefined) ||
                    (attempt.answer_text &&
                      attempt.answer_text.trim().length > 0)
                  ) {
                    completedQuestions++;
                  }
                }
              });
            }
          });
        });

        const progress =
          totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;

        return {
          id: cls.id,
          name: cls.name,
          progress,
          totalQuizzes: totalQuestions,
          completedQuizzes: completedQuestions,
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

        // For each class, fetch module count
        const classesWithModules = await Promise.all(
          (classes || []).map(async (cls) => {
            console.log("Processing class:", cls);
            console.log("Teacher data:", cls.users);
            // Count modules assigned to this class
            const { count: moduleCount } = await supabase
              .from("module_assignments")
              .select("id", { count: "exact", head: true })
              .eq("class_id", cls.id);

            const classData = {
              ...cls,
              membership: cls.class_memberships[0],
              teacherName: cls.users?.full_name || "Unknown Teacher",
              moduleCount: moduleCount || 0,
            };

            console.log("Processed class data:", classData);
            return classData;
          })
        );

        // Get progress for each module
        const modulesWithProgress = await Promise.all(
          (classesWithModules || []).map(async (cls) => {
            // First get all module assignments for this class
            const { data: moduleAssignments } = await supabase
              .from("module_assignments")
              .select(
                "*, modules(*, lessons(*, quiz_questions(id, attempt:quiz_attempts(selected_index, answer_text))))"
              )
              .eq("class_id", cls.id);

            // Map each module assignment to include progress
            const modulePromises = (moduleAssignments || []).map(
              async (assignment) => {
                // Calculate progress based on completed questions
                let totalQuestions = 0;
                let completedQuestions = 0;

                assignment.modules?.lessons?.forEach((lesson) => {
                  if (lesson.quiz_questions) {
                    totalQuestions += lesson.quiz_questions.length;
                    lesson.quiz_questions.forEach((question) => {
                      if (question.attempt?.length > 0) {
                        const attempt = question.attempt[0];
                        if (
                          (attempt.selected_index !== null &&
                            attempt.selected_index !== undefined) ||
                          (attempt.answer_text &&
                            attempt.answer_text.trim().length > 0)
                        ) {
                          completedQuestions++;
                        }
                      }
                    });
                  }
                });

                const progress =
                  totalQuestions > 0 ? completedQuestions / totalQuestions : 0;
                const isCompleted = progress === 1;

                return {
                  ...assignment.modules,
                  class: cls,
                  progress: {
                    completed_at: isCompleted ? new Date().toISOString() : null,
                    progress: progress,
                  },
                  due_date: assignment.due_date || null,
                  lessonCount: assignment.modules?.lessons?.length || 0,
                };
              }
            );

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

        // DEBUG: Log all module assignments and modules
        const { data: debugAssignments } = await supabase
          .from("module_assignments")
          .select("*");
        console.log("allAssignments", debugAssignments);
        const { data: debugModules } = await supabase
          .from("modules")
          .select("*");
        console.log("allModules", debugModules);
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
                        {cls.completedQuizzes} of {cls.totalQuizzes} quiz
                        questions completed
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
