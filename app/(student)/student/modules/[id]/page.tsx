"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ModuleView from "@/components/module-view";

export default function ModulePage() {
  const params = useParams();
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        // Fetch module with lessons, quiz questions, and student progress
        const { data: moduleData, error } = await supabase
          .from("modules")
          .select(
            `
            *,
            lessons(
              *,
              quiz_questions(
                id,
                question,
                type,
                options,
                correct_index
              )
            ),
            student_modules!inner(progress, completed_at)
          `
          )
          .eq("id", params.id)
          .eq("student_modules.student_id", userData.user.id)
          .single();

        if (error) {
          console.error("Error fetching module:", error);
          return;
        }

        // Fetch quiz attempts for this student
        const { data: quizAttempts } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("student_id", userData.user.id)
          .in(
            "question_id",
            moduleData.lessons
              .flatMap((l: any) => l.quiz_questions)
              .map((q: any) => q.id)
          );

        // Fetch lesson progress
        const { data: lessonProgress } = await supabase
          .from("lesson_progress")
          .select("*")
          .eq("student_id", userData.user.id)
          .in(
            "lesson_id",
            moduleData.lessons.map((l: any) => l.id)
          );

        // Process the module data and calculate progress
        const lessonsWithQuizzes = moduleData.lessons.filter(
          (lesson: any) => lesson.quiz_questions?.length > 0
        );

        const totalQuestions = lessonsWithQuizzes.reduce(
          (sum: number, lesson: any) => sum + lesson.quiz_questions.length,
          0
        );

        // Calculate completed questions based on completed lessons
        const completedQuestions = lessonsWithQuizzes.reduce(
          (sum: number, lesson: any) => {
            // Check if lesson is completed in lesson_progress
            const isLessonCompleted = lessonProgress?.some(
              (progress: any) =>
                progress.lesson_id === lesson.id && progress.completed
            );

            // If lesson is completed, add all its questions to the sum
            if (isLessonCompleted) {
              return sum + lesson.quiz_questions.length;
            }
            return sum;
          },
          0
        );

        const progress =
          totalQuestions > 0 ? completedQuestions / totalQuestions : 0;

        // Update student_modules with new progress
        if (progress !== moduleData.student_modules[0]?.progress) {
          const { error: upsertError } = await supabase
            .from("student_modules")
            .upsert(
              {
                student_id: userData.user.id,
                module_id: moduleData.id,
                progress: progress,
                completed_at: progress === 1 ? new Date().toISOString() : null,
              },
              {
                onConflict: "student_id,module_id",
              }
            );

          if (upsertError) {
            console.error("Error updating progress:", upsertError);
          }
        }

        const processedModule = {
          ...moduleData,
          lessons: moduleData.lessons.map((lesson: any) => ({
            ...lesson,
            quiz_questions: lesson.quiz_questions.map((question: any) => ({
              ...question,
              // Parse options if stored as string
              options: Array.isArray(question.options)
                ? question.options
                : JSON.parse(question.options || "[]"),
              // Add student's attempt if it exists
              attempt: quizAttempts?.find(
                (a: any) => a.question_id === question.id
              ),
            })),
            // Add lesson progress
            progress: lessonProgress?.find(
              (p: any) => p.lesson_id === lesson.id
            ) || {
              completed: false,
              completed_at: null,
            },
          })),
          progress: {
            ...moduleData.student_modules[0],
            progress: progress,
          },
        };
        delete processedModule.student_modules;

        setModule(processedModule);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [params.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!module) {
    return <div>Module not found</div>;
  }

  return <ModuleView module={module} />;
}
