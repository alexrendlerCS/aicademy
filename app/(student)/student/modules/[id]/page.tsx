"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ModuleView from "./module-view";

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

        // First fetch the module with all its data
        const { data: moduleData, error: moduleError } = await supabase
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
                correct_index,
                correct_answer_text
              )
            )
          `
          )
          .eq("id", params.id)
          .single();

        if (moduleError) {
          console.error("Error fetching module:", moduleError);
          return;
        }

        // Get the due date from module_assignments
        const { data: assignmentData } = await supabase
          .from("module_assignments")
          .select("due_date")
          .or(
            `student_id.eq.${userData.user.id},class_id.in.(select class_id from class_memberships where student_id = '${userData.user.id}' and status = 'approved')`
          )
          .eq("module_id", params.id)
          .single();

        // Check if student has access through class membership and module assignments
        const { data: moduleAccess, error: accessError } = await supabase
          .from("class_memberships")
          .select(
            `
            *,
            classes!inner(
              module_assignments!inner(*)
            )
          `
          )
          .eq("student_id", userData.user.id)
          .eq("status", "approved")
          .eq("classes.module_assignments.module_id", params.id);

        if (accessError) {
          console.error("Error checking module access:", accessError);
          return;
        }

        if (!moduleAccess || moduleAccess.length === 0) {
          console.error("No access to this module");
          return;
        }

        // Ensure module data exists
        if (!moduleData) {
          console.error("Module data not found");
          return;
        }

        // Ensure student_modules entry exists
        const { data: existingProgress, error: progressCheckError } =
          await supabase
            .from("student_modules")
            .select("*")
            .eq("student_id", userData.user.id)
            .eq("module_id", params.id)
            .single();

        if (progressCheckError && progressCheckError.code !== "PGRST116") {
          console.error("Error checking progress:", {
            error: progressCheckError,
            details: progressCheckError.details,
            message: progressCheckError.message,
            code: progressCheckError.code,
          });
          return;
        }

        if (!existingProgress) {
          const { error: progressError } = await supabase
            .from("student_modules")
            .insert({
              student_id: userData.user.id,
              module_id: params.id,
              progress: 0,
              completed_at: null,
              started_at: new Date().toISOString(), // Add started_at timestamp
            });

          if (progressError) {
            console.error("Error creating progress entry:", {
              error: progressError,
              details: progressError.details,
              message: progressError.message,
              hint: progressError.hint,
              code: progressError.code,
            });
            // Don't return here, continue with the rest of the module loading
          }
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
        if (existingProgress && progress !== existingProgress.progress) {
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
          lessonCount: moduleData.lessons.length,
          due_date: assignmentData?.due_date || null,
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
            progress: progress,
            completed_at: progress === 1 ? new Date().toISOString() : null,
          },
        };

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
    return <div>Module not found or no access</div>;
  }

  return <ModuleView module={module} />;
}
