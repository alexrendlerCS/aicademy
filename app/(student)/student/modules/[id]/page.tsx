"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/progress-bar";
import { XpBadge } from "@/components/xp-badge";
import { SubjectIcon } from "@/components/subject-icon";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Home,
  MessageCircle,
  X,
} from "lucide-react";
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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Draggable state for collapsed button (x only) and chat window (x, y)
  const [collapsedX, setCollapsedX] = useState(0); // px from left
  const [draggingCollapsed, setDraggingCollapsed] = useState(false);
  const collapsedBtnRef = useRef<HTMLButtonElement>(null);

  const [chatPos, setChatPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [draggingChat, setDraggingChat] = useState(false);
  const chatDragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const chatWindowRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom when chatMessages change
  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((msgs) => [...msgs, { role: "user", content: chatInput }]);
    setChatInput("");
    // Placeholder: In real use, send to AI backend and append response
    setTimeout(() => {
      setChatMessages((msgs) => [
        ...msgs,
        { role: "ai", content: "(AI response placeholder)" },
      ]);
    }, 800);
  };

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

  // Handle drag for collapsed button (bottom only, x axis)
  useEffect(() => {
    if (!draggingCollapsed) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }
      // Clamp to window width
      const btn = collapsedBtnRef.current;
      if (btn) {
        const btnWidth = btn.offsetWidth;
        const minX = 8;
        const maxX = window.innerWidth - btnWidth - 8;
        setCollapsedX(Math.max(minX, Math.min(clientX - btnWidth / 2, maxX)));
      }
    };
    const handleUp = () => setDraggingCollapsed(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [draggingCollapsed]);

  // Handle drag for chat window (anywhere)
  useEffect(() => {
    if (!draggingChat) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0,
        clientY = 0;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      setChatPos({
        x: clientX - chatDragOffset.current.x,
        y: clientY - chatDragOffset.current.y,
      });
    };
    const handleUp = () => setDraggingChat(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [draggingChat]);

  // Reset chat position when opening
  useEffect(() => {
    if (chatOpen) {
      setChatPos({
        x: window.innerWidth / 2 - 320,
        y: window.innerHeight - 440,
      });
    }
  }, [chatOpen]);

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto space-y-6 pt-8">
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
          <div className="flex flex-col items-end w-full max-w-xs">
            <span className="text-xs font-semibold text-primary mb-1">
              Progress
            </span>
            <ProgressBar
              value={progress * 100}
              max={100}
              className="w-full h-3 rounded-full"
              color={moduleData.subject}
            />
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          <Card className="md:col-span-1 h-fit bg-muted/60">
            <CardContent className="p-4">
              <div className="font-medium mb-2">Lessons</div>
              <ul className="space-y-2">
                {lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isCurrent = index === currentLessonIndex;
                  return (
                    <li key={lesson.id}>
                      <button
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-all border-2 ${
                          isCurrent
                            ? "bg-primary text-primary-foreground border-primary shadow"
                            : isCompleted
                            ? "text-green-700 bg-green-100 border-green-400 hover:bg-green-200"
                            : "hover:bg-muted border-transparent"
                        }`}
                        onClick={() => setCurrentLessonIndex(index)}
                      >
                        <div
                          className={`flex items-center justify-center h-6 w-6 rounded-full text-xs transition-all ${
                            isCurrent
                              ? "bg-primary-foreground text-primary border-2 border-primary"
                              : isCompleted
                              ? "bg-green-500 text-white border-2 border-green-600"
                              : "bg-muted text-muted-foreground border"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className="truncate font-medium">
                          {lesson.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <div className="md:col-span-3 space-y-6">
            <Card className="bg-background/80 shadow-lg">
              <CardContent className="p-8">
                <Tabs defaultValue="lesson">
                  <TabsList className="mb-6">
                    <TabsTrigger value="lesson">Lesson</TabsTrigger>
                    <TabsTrigger value="quiz">Quiz</TabsTrigger>
                  </TabsList>

                  <TabsContent value="lesson">
                    {currentLesson ? (
                      <div
                        className="prose max-w-none dark:prose-invert text-lg"
                        dangerouslySetInnerHTML={{
                          __html: currentLesson.content,
                        }}
                      />
                    ) : (
                      <div>No lesson found.</div>
                    )}
                  </TabsContent>

                  <TabsContent value="quiz">
                    <div className="space-y-8">
                      <div className="text-2xl font-bold mb-2">
                        Quiz: {currentLesson?.title}
                      </div>
                      <div className="space-y-6">
                        {quizQuestions[currentLesson?.id]?.map(
                          (question: any, qIndex: number) => (
                            <div key={question.id} className="space-y-3">
                              <div className="font-semibold text-lg">
                                Question {qIndex + 1}
                              </div>
                              <p className="mb-2 text-base">
                                {question.question}
                              </p>
                              <div className="space-y-2 pt-1">
                                {question.type === "multiple_choice" ? (
                                  question.options?.map(
                                    (option: any, oIndex: number) => (
                                      <label
                                        key={option.id ?? oIndex}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border transition-all ${
                                          selectedAnswers[question.id] ===
                                          oIndex
                                            ? "border-primary bg-primary/10 ring-2 ring-primary"
                                            : "border-muted hover:bg-muted/40"
                                        } ${
                                          isLessonCompleted || submitting
                                            ? "opacity-70 cursor-not-allowed"
                                            : ""
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          id={`q${qIndex}-${oIndex}`}
                                          name={`q${question.id}`}
                                          className="h-5 w-5 accent-primary"
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
                                        <span className="text-base">
                                          {option.option ?? option}
                                        </span>
                                      </label>
                                    )
                                  )
                                ) : (
                                  <input
                                    type="text"
                                    className="input input-bordered w-full max-w-xs px-3 py-2 rounded border text-base"
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
                      <div className="flex justify-end mt-6">
                        <Button
                          onClick={handleSubmitQuiz}
                          disabled={
                            isLessonCompleted ||
                            submitting ||
                            !quizQuestions[currentLesson?.id]?.every(
                              (q: any) => {
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
                              }
                            )
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

            <div className="flex justify-between mt-4">
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

      {/* AI Chat Bot Section */}
      {!chatOpen ? (
        <div
          className="fixed left-0 bottom-0 w-full flex justify-center z-50 pointer-events-none"
          style={{ height: "auto" }}
        >
          <button
            ref={collapsedBtnRef}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-t-xl shadow-lg hover:bg-primary/90 transition-all border border-primary pointer-events-auto select-none active:scale-95"
            style={{
              position: "absolute",
              left: collapsedX,
              bottom: 0,
              margin: 0,
              cursor: draggingCollapsed ? "grabbing" : "grab",
              zIndex: 100,
            }}
            onMouseDown={(e) => {
              setDraggingCollapsed(true);
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              setDraggingCollapsed(true);
              e.preventDefault();
            }}
            onClick={() => !draggingCollapsed && setChatOpen(true)}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold">AI Assistant</span>
          </button>
        </div>
      ) : (
        <div
          ref={chatWindowRef}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: chatPos.x,
            top: chatPos.y,
            width: 400,
            maxWidth: "95vw",
            minWidth: 280,
            height: 384,
            maxHeight: "90vh",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            borderRadius: 16,
            background: "var(--background)",
            border: "1px solid var(--primary)",
            transition: draggingChat ? "none" : "box-shadow 0.2s",
            cursor: draggingChat ? "grabbing" : "default",
            userSelect: draggingChat ? "none" : "auto",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2 border-b bg-primary/10 rounded-t-xl cursor-move select-none"
            style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
            onMouseDown={(e) => {
              setDraggingChat(true);
              const rect = chatWindowRef.current?.getBoundingClientRect();
              if (rect) {
                chatDragOffset.current = {
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                };
              }
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              setDraggingChat(true);
              const rect = chatWindowRef.current?.getBoundingClientRect();
              if (rect && e.touches[0]) {
                chatDragOffset.current = {
                  x: e.touches[0].clientX - rect.left,
                  y: e.touches[0].clientY - rect.top,
                };
              }
              e.preventDefault();
            }}
          >
            <div className="flex items-center gap-2 font-semibold text-primary">
              <MessageCircle className="h-5 w-5" /> AI Assistant
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-background"
            style={{ height: 260 }}
          >
            {chatMessages.length === 0 ? (
              <div className="text-muted-foreground text-center mt-8">
                How can I help you with this module?
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-xs text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <form
            onSubmit={handleSendChat}
            className="flex items-center gap-2 px-4 py-3 border-t bg-background"
          >
            <input
              type="text"
              className="flex-1 rounded border px-3 py-2 text-sm bg-background"
              placeholder="Ask the AI assistant..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              autoFocus
            />
            <Button type="submit" size="sm" disabled={!chatInput.trim()}>
              Send
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
