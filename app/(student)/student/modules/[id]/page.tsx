"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/progress-bar";
import { XpBadge } from "@/components/xp-badge";
import { SubjectIcon } from "@/components/subject-icon";
import { ArrowLeft, ArrowRight, CheckCircle, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabaseClient";
import { use as usePromise } from "react";

export default function ModuleView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: moduleId } = usePromise(params);
  const [loading, setLoading] = useState(true);
  const [moduleData, setModuleData] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<{
    [lessonId: string]: any[];
  }>({});
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [questionId: string]: number | string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitModuleError, setSubmitModuleError] = useState<string | null>(
    null
  );
  const [submitModuleSuccess, setSubmitModuleSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setLoading(false);
        return;
      }
      const userId = userData.user.id;
      // Fetch module
      const { data: module, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();
      console.log("Fetched module:", module, "for moduleId:", moduleId);
      if (moduleError || !module) {
        setLoading(false);
        return;
      }
      setModuleData(module);
      // Fetch lessons for this module
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index", { ascending: true });
      console.log("Fetched lessons:", lessonsData, "for moduleId:", moduleId);
      if (lessonsError || !lessonsData) {
        setLoading(false);
        return;
      }
      setLessons(lessonsData);
      console.log("Lessons state after set:", lessonsData);
      // Fetch quiz questions for each lesson
      const quizMap: { [lessonId: string]: any[] } = {};
      let allQuestionIds: string[] = [];
      for (const lesson of lessonsData) {
        const { data: questions } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("lesson_id", lesson.id);
        quizMap[lesson.id] = questions || [];
        if (questions) {
          allQuestionIds = allQuestionIds.concat(
            questions.map((q: any) => q.id)
          );
        }
      }
      setQuizQuestions(quizMap);
      // Fetch lesson progress for this user and module
      const { data: lessonProgressData } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("student_id", userId);
      const completed = (lessonProgressData || [])
        .filter((lp: any) => lp.completed)
        .map((lp: any) => lp.lesson_id);
      setCompletedLessons(completed);
      // Fetch quiz_attempts for all questions in this module for this user
      if (allQuestionIds.length > 0) {
        const { data: attemptsData } = await supabase
          .from("quiz_attempts")
          .select("question_id, selected_index, answer_text")
          .eq("student_id", userId)
          .in("question_id", allQuestionIds);
        // Pre-populate selectedAnswers
        const answers: { [questionId: string]: number | string | null } = {};
        for (const attempt of attemptsData || []) {
          if (
            attempt.selected_index !== null &&
            attempt.selected_index !== undefined
          ) {
            answers[attempt.question_id] = attempt.selected_index;
          } else if (
            attempt.answer_text !== null &&
            attempt.answer_text !== undefined
          ) {
            answers[attempt.question_id] = attempt.answer_text;
          }
        }
        setSelectedAnswers(answers);
      }
      setLoading(false);
    };
    fetchData();
  }, [moduleId]);

  if (loading) {
    return <div className="p-8 text-center">Loading module...</div>;
  }
  if (!moduleData) {
    return (
      <div className="p-8 text-center text-red-500">
        Module not found or not assigned.
      </div>
    );
  }

  const currentLesson = lessons[currentLessonIndex];
  const isFirstLesson = currentLessonIndex === 0;
  const isLastLesson = currentLessonIndex === lessons.length - 1;
  const isLessonCompleted = completedLessons.includes(currentLesson?.id);
  const progress =
    lessons.length > 0 ? completedLessons.length / lessons.length : 0;
  const allLessonsCompleted =
    lessons.length > 0 && completedLessons.length === lessons.length;

  const handlePreviousLesson = () => {
    if (!isFirstLesson) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const handleNextLesson = () => {
    if (!isLastLesson) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const handleCompleteLesson = async () => {
    if (!isLessonCompleted && currentLesson) {
      setCompletedLessons((prev) => [...prev, currentLesson.id]);
      setShowXpAnimation(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) throw new Error("Not authenticated");
        const userId = userData.user.id;
        // Upsert lesson_progress
        await supabase.from("lesson_progress").upsert(
          {
            student_id: userId,
            lesson_id: currentLesson.id,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "student_id,lesson_id" }
        );
        // Check if all lessons are completed
        const allCompleted =
          [...completedLessons, currentLesson.id].length === lessons.length;
        if (allCompleted) {
          // Upsert student_modules for module progress
          await supabase.from("student_modules").upsert(
            {
              student_id: userId,
              module_id: moduleId,
              completed_at: new Date().toISOString(),
              progress: 1,
            },
            { onConflict: "student_id,module_id" }
          );
        }
      } catch (err) {
        // Optionally handle error
        console.error("Error saving progress:", err);
      }
      setTimeout(() => {
        setShowXpAnimation(false);
      }, 2000);
      if (!isLastLesson) {
        setTimeout(() => {
          setCurrentLessonIndex(currentLessonIndex + 1);
        }, 1000);
      }
    }
  };

  const handleSelectAnswer = (questionId: string, value: number | string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitQuiz = async () => {
    if (!currentLesson || !quizQuestions[currentLesson.id]) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("Not authenticated");
      const userId = userData.user.id;
      // Save each attempt
      for (const question of quizQuestions[currentLesson.id]) {
        const answer = selectedAnswers[question.id];
        if (answer == null || answer === "") continue;
        let isCorrect = false;
        let selectedIndex = null;
        let answerText = null;
        if (question.type === "multiple_choice") {
          selectedIndex = answer as number;
          isCorrect = question.correct_index === selectedIndex;
          answerText =
            question.options[selectedIndex]?.option ??
            question.options[selectedIndex];
        } else if (question.type === "free_response") {
          answerText = answer as string;
          const userAnswer =
            typeof answerText === "string"
              ? answerText.trim().toLowerCase()
              : "";
          const correctRaw = question.correct_answer_text;
          let correctAnswer = "";
          if (typeof correctRaw === "string") {
            correctAnswer = correctRaw.trim().toLowerCase();
          } else if (typeof correctRaw === "number") {
            correctAnswer = String(correctRaw);
          }
          isCorrect = userAnswer === correctAnswer;
        }
        await supabase.from("quiz_attempts").insert({
          student_id: userId,
          question_id: question.id,
          selected_index: selectedIndex,
          answer_text: answerText,
          is_correct: isCorrect,
          attempted_at: new Date().toISOString(),
        });
      }
      // Mark lesson as completed
      setCompletedLessons((prev) => [...prev, currentLesson.id]);
      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit answers");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitModule = async () => {
    setSubmitModuleError(null);
    setSubmitModuleSuccess(false);
    setShowSubmitConfirm(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("Not authenticated");
      const userId = userData.user.id;
      // Upsert all lesson_progress
      for (const lesson of lessons) {
        await supabase.from("lesson_progress").upsert(
          {
            student_id: userId,
            lesson_id: lesson.id,
            completed: completedLessons.includes(lesson.id),
            completed_at: completedLessons.includes(lesson.id)
              ? new Date().toISOString()
              : null,
          },
          { onConflict: "student_id,lesson_id" }
        );
      }
      // Upsert student_modules for module progress
      await supabase.from("student_modules").upsert(
        {
          student_id: userId,
          module_id: moduleId,
          completed_at: allLessonsCompleted ? new Date().toISOString() : null,
          progress: allLessonsCompleted
            ? 1
            : completedLessons.length / lessons.length,
        },
        { onConflict: "student_id,module_id" }
      );
      setSubmitModuleSuccess(true);
    } catch (err: any) {
      setSubmitModuleError(err.message || "Failed to submit module progress");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/student/modules">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <SubjectIcon subject={moduleData.subject} className="h-6 w-6" />
              <h1 className="text-2xl font-bold tracking-tight">
                {moduleData.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link
                href="/student"
                className="flex items-center hover:underline"
              >
                <Home className="mr-1 h-3 w-3" />
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/student/modules" className="hover:underline">
                Modules
              </Link>
              <span>/</span>
              <span className="truncate">{moduleData.title}</span>
            </div>
          </div>
        </div>
        <XpBadge xp={1250} level={4} showAnimation={showXpAnimation} />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Lesson {currentLessonIndex + 1} of {lessons.length}
        </div>
        <ProgressBar
          value={progress * 100}
          max={100}
          className="w-full max-w-xs"
          color={moduleData.subject}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1 h-fit">
          <CardContent className="p-4">
            <div className="font-medium mb-2">Lessons</div>
            <ul className="space-y-1">
              {lessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const isCurrent = index === currentLessonIndex;

                return (
                  <li key={lesson.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                          ? "text-muted-foreground hover:bg-muted"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setCurrentLessonIndex(index)}
                    >
                      <div
                        className={`flex items-center justify-center h-5 w-5 rounded-full text-xs ${
                          isCurrent
                            ? "bg-primary-foreground text-primary"
                            : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="lesson">
                <TabsList className="mb-4">
                  <TabsTrigger value="lesson">Lesson</TabsTrigger>
                  <TabsTrigger value="quiz">Quiz</TabsTrigger>
                </TabsList>

                <TabsContent value="lesson">
                  {currentLesson ? (
                    <div
                      className="prose max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: currentLesson.content,
                      }}
                    />
                  ) : (
                    <div>No lesson found.</div>
                  )}
                </TabsContent>

                <TabsContent value="quiz">
                  <div className="space-y-6">
                    <div className="text-lg font-medium">
                      Quiz: {currentLesson?.title}
                    </div>

                    <div className="space-y-4">
                      {quizQuestions[currentLesson?.id]?.map(
                        (question: any, qIndex: number) => (
                          <div key={question.id} className="space-y-2">
                            <div className="font-medium">
                              Question {qIndex + 1}
                            </div>
                            <p>{question.question}</p>
                            <div className="space-y-2 pt-2">
                              {question.type === "multiple_choice" ? (
                                question.options?.map(
                                  (option: any, oIndex: number) => (
                                    <div
                                      key={option.id ?? oIndex}
                                      className="flex items-center space-x-2"
                                    >
                                      <input
                                        type="radio"
                                        id={`q${qIndex}-${oIndex}`}
                                        name={`q${question.id}`}
                                        className="h-4 w-4"
                                        checked={
                                          selectedAnswers[question.id] ===
                                          oIndex
                                        }
                                        onChange={() =>
                                          handleSelectAnswer(
                                            question.id,
                                            oIndex
                                          )
                                        }
                                        disabled={
                                          isLessonCompleted || submitting
                                        }
                                      />
                                      <label htmlFor={`q${qIndex}-${oIndex}`}>
                                        {option.option ?? option}
                                      </label>
                                    </div>
                                  )
                                )
                              ) : (
                                <input
                                  type="text"
                                  className="input input-bordered w-full max-w-xs px-2 py-1 rounded border"
                                  value={
                                    typeof selectedAnswers[question.id] ===
                                    "string"
                                      ? selectedAnswers[question.id] ?? ""
                                      : ""
                                  }
                                  onChange={(e) =>
                                    handleSelectAnswer(
                                      question.id,
                                      e.target.value
                                    )
                                  }
                                  disabled={isLessonCompleted || submitting}
                                  placeholder="Type your answer here"
                                />
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {submitError && (
                      <div className="text-red-500">{submitError}</div>
                    )}
                    {submitSuccess && (
                      <div className="text-green-600">
                        Quiz submitted! Lesson marked as complete.
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSubmitQuiz}
                        disabled={
                          isLessonCompleted ||
                          submitting ||
                          !quizQuestions[currentLesson?.id]?.every((q: any) => {
                            if (q.type === "multiple_choice") {
                              return selectedAnswers[q.id] != null;
                            } else if (
                              typeof selectedAnswers[q.id] === "string"
                            ) {
                              const ans = selectedAnswers[q.id] as string;
                              return (
                                ans &&
                                typeof ans === "string" &&
                                ans.trim() !== ""
                              );
                            }
                            return false;
                          })
                        }
                      >
                        Submit Answers
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousLesson}
              disabled={isFirstLesson}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous Lesson
            </Button>

            {isLessonCompleted && isLastLesson ? (
              <>
                {!allLessonsCompleted && (
                  <div className="text-yellow-500 font-semibold mr-4">
                    Warning: your progress is not 100%, you are missing an
                    answer.
                  </div>
                )}
                <Button
                  color="danger"
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={!allLessonsCompleted}
                >
                  Submit Module
                </Button>
                {showSubmitConfirm && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg max-w-sm w-full">
                      <div className="font-bold mb-2">Submit Module?</div>
                      <div className="mb-4">
                        Once a module is submitted it cannot be undone.
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowSubmitConfirm(false)}
                        >
                          Cancel
                        </Button>
                        <Button color="danger" onClick={handleSubmitModule}>
                          Confirm Submit
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {submitModuleError && (
                  <div className="text-red-500 mt-2">{submitModuleError}</div>
                )}
                {submitModuleSuccess && (
                  <div className="text-green-600 mt-2">
                    Module progress submitted!
                  </div>
                )}
              </>
            ) : isLessonCompleted ? (
              <Button onClick={handleNextLesson} disabled={isLastLesson}>
                Next Lesson
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCompleteLesson}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Lesson
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
