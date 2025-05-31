"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  CheckCircle,
  X,
  Clock,
  Bot,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { SubjectIcon } from "@/components/subject-icon";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, isDemoUser } from "@/lib/utils";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ModuleViewProps {
  module: any;
  isPreview?: boolean;
  previewData?: {
    progress: number;
    completed: boolean;
    xpEarned: number;
    quizAttempts: any[];
  };
}

export default function ModuleView({
  module,
  isPreview = false,
  previewData,
}: ModuleViewProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("lesson");
  const [selectedLesson, setSelectedLesson] = useState<any>(
    module.lessons?.[0] || null
  );
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: string]: number;
  }>({});
  const [freeResponses, setFreeResponses] = useState<{ [key: string]: string }>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Add new state variables for chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Chat window position and size state
  const [chatPos, setChatPos] = useState({ x: 0, y: 0 });
  const [draggingChat, setDraggingChat] = useState(false);
  const chatDragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Chat window size constants and state
  const MIN_CHAT_WIDTH = 320;
  const MIN_CHAT_HEIGHT = 320;
  const MAX_CHAT_WIDTH = 800;
  const MAX_CHAT_HEIGHT = 800;
  const DEFAULT_CHAT_WIDTH = 600;
  const DEFAULT_CHAT_HEIGHT = 600;
  const [chatSize, setChatSize] = useState({
    width: DEFAULT_CHAT_WIDTH,
    height: DEFAULT_CHAT_HEIGHT,
  });
  const [resizing, setResizing] = useState(false);
  const resizeStart = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Collapsed button state
  const SIDEBAR_WIDTH = 256;
  const COLLAPSED_BTN_MARGIN = 24;
  const [collapsedX, setCollapsedX] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth - 56 - COLLAPSED_BTN_MARGIN;
    }
    return 0;
  });
  const [draggingCollapsed, setDraggingCollapsed] = useState(false);
  const collapsedBtnRef = useRef<HTMLButtonElement>(null);
  const [collapsedDragOffset, setCollapsedDragOffset] = useState(0);

  const isDemo = isDemoUser(currentUser?.id);

  // Calculate total questions and completed questions
  const calculateProgress = () => {
    if (isPreview) return previewData?.progress || 0;

    let totalQuestions = 0;
    let completedQuestions = 0;

    module.lessons?.forEach((lesson: any) => {
      if (lesson.quiz_questions) {
        totalQuestions += lesson.quiz_questions.length;
        lesson.quiz_questions.forEach((question: any) => {
          // Count question as completed if it has been attempted
          if (question.attempt) {
            if (question.type === "multiple_choice") {
              // For multiple choice, count as completed if any answer was selected
              if (typeof question.attempt.selected_index === "number") {
                completedQuestions++;
              }
            } else if (question.type === "free_response") {
              // For free response, count as completed if there's an answer text
              if (question.attempt.answer_text?.trim()) {
                completedQuestions++;
              }
            }
          }
        });
      }
    });

    return totalQuestions > 0 ? completedQuestions / totalQuestions : 0;
  };

  const progress = calculateProgress();
  const totalQuestions =
    module.lessons?.reduce(
      (total: number, lesson: any) =>
        total + (lesson.quiz_questions?.length || 0),
      0
    ) || 0;
  const completedQuestions = Math.round(progress * totalQuestions);

  const currentLessonIndex =
    module.lessons?.findIndex((l: any) => l.id === selectedLesson?.id) || 0;
  const totalLessons = module.lessons?.length || 0;

  const [showDemoNotice, setShowDemoNotice] = useState(false);

  // Add user data fetch and initialize demo messages if needed
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Initialize demo messages after we have the user
      if (isDemoUser(user?.id)) {
        setChatMessages([
          {
            role: "user",
            content:
              "What is the main benefit of using functions in your code?",
          },
          {
            role: "assistant",
            content: `### Functions

Functions are like cookbook recipes, allowing you to organize and simplify your code by packaging it into reusable blocks. They make your code more maintainable and efficient by enabling you to reuse code without duplicating it. By breaking down complex tasks into smaller, manageable functions, you can avoid code repetition and improve the overall readability of your program.

From the lesson: Functions are like smart little robots that perform specific tasks whenever we call them. They help us hide complex details and focus only on what the function does.

Would you like to:

• Learn how to create a new function for a common task?
• Understand the importance of giving functions descriptive names?
• Explore best practices for writing clean, maintainable code?`,
          },
        ]);
      }
    };
    fetchUser();
  }, []);

  // Show demo notice when chat is opened in demo mode
  useEffect(() => {
    if (chatOpen && isDemo) {
      setShowDemoNotice(true);
    }
  }, [chatOpen, isDemo]);

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    if (isPreview || isDemo) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleFreeResponseChange = (questionId: string, text: string) => {
    if (isPreview || isDemo) return;
    setFreeResponses((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleQuizSubmit = async () => {
    if (isPreview) return;

    try {
      setSubmitting(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // Prepare attempts data
      const attempts = selectedLesson.quiz_questions.map((question: any) => {
        if (question.type === "multiple_choice") {
          return {
            student_id: userData.user.id,
            question_id: question.id,
            selected_index: selectedAnswers[question.id],
            answer_text: null,
            attempted_at: new Date().toISOString(),
          };
        } else {
          return {
            student_id: userData.user.id,
            question_id: question.id,
            selected_index: null,
            answer_text: freeResponses[question.id] || "",
            attempted_at: new Date().toISOString(),
          };
        }
      });

      // Submit quiz attempts
      const { error: attemptsError } = await supabase
        .from("quiz_attempts")
        .upsert(attempts);

      if (attemptsError) throw attemptsError;

      // Calculate if all answers are correct for multiple choice
      const allCorrect = selectedLesson.quiz_questions.every(
        (question: any) => {
          if (question.type === "multiple_choice") {
            return selectedAnswers[question.id] === question.correct_index;
          }
          return true; // Skip free response questions in completion check
        }
      );

      // Update lesson progress
      const { error: progressError } = await supabase
        .from("lesson_progress")
        .upsert({
          student_id: userData.user.id,
          lesson_id: selectedLesson.id,
          completed: allCorrect,
          completed_at: allCorrect ? new Date().toISOString() : null,
        });

      if (progressError) throw progressError;

      // Refresh the page to update quiz state
      window.location.reload();
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const getQuestionState = (question: any) => {
    if (!question.attempt) return "unattempted";
    if (question.type === "multiple_choice") {
      return question.attempt.selected_index === question.correct_index
        ? "correct"
        : "incorrect";
    }
    // For free response, we'll need a teacher to grade it
    return question.attempt.is_correct === true
      ? "correct"
      : question.attempt.is_correct === false
      ? "incorrect"
      : "pending";
  };

  const isQuizComplete = () => {
    if (!selectedLesson?.quiz_questions?.length) return false;

    return selectedLesson.quiz_questions.every((question: any) => {
      if (question.type === "multiple_choice") {
        return typeof selectedAnswers[question.id] === "number";
      } else {
        return freeResponses[question.id]?.trim().length > 0;
      }
    });
  };

  // Add function to check if a lesson is completed
  const isLessonCompleted = (lesson: any) => {
    if (!lesson.quiz_questions?.length) return false;

    return lesson.quiz_questions.every((question: any) => {
      if (!question.attempt) return false;

      if (question.type === "multiple_choice") {
        return typeof question.attempt.selected_index === "number";
      } else {
        return !!question.attempt.answer_text?.trim();
      }
    });
  };

  const renderQuestion = (question: any, index: number) => {
    const questionState = getQuestionState(question);
    const isAttempted = questionState !== "unattempted";
    const isCorrect = questionState === "correct";
    const isPending = questionState === "pending";
    const showCorrect = isAttempted;
    const isSelected = (i: number) =>
      isAttempted
        ? question.attempt?.selected_index === i
        : typeof selectedAnswers[question.id] === "number"
        ? selectedAnswers[question.id] === i
        : false;

    return (
      <div key={question.id} className="space-y-4">
        <div className="flex items-start gap-2">
          <span className="font-medium">Q{index + 1}.</span>
          <span>{question.question}</span>
        </div>

        {question.type === "multiple_choice" ? (
          <div className="space-y-2 pl-6">
            {question.options.map((option: string, i: number) => {
              const isCorrectAnswer = i === question.correct_index;
              const isSelectedAnswer = isSelected(i);
              const showAnswerStatus =
                isAttempted && (isCorrectAnswer || isSelectedAnswer);

              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    !isAttempted &&
                      !isDemo &&
                      !isSelected(i) &&
                      "hover:bg-muted/50 cursor-pointer",
                    isSelected(i) &&
                      !isAttempted &&
                      "bg-orange-50 border-orange-500 border-2",
                    showAnswerStatus &&
                      isCorrectAnswer &&
                      "bg-green-50 border-green-500",
                    showAnswerStatus &&
                      isSelectedAnswer &&
                      !isCorrectAnswer &&
                      "bg-red-50 border-red-500",
                    isDemo && "cursor-not-allowed opacity-70"
                  )}
                  onClick={() =>
                    !isAttempted && handleAnswerSelect(question.id, i)
                  }
                >
                  <div
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm",
                      showAnswerStatus && isCorrectAnswer
                        ? "border-green-500 text-green-500"
                        : showAnswerStatus &&
                          isSelectedAnswer &&
                          !isCorrectAnswer
                        ? "border-red-500 text-red-500"
                        : isSelected(i) && !isAttempted
                        ? "border-orange-500 text-orange-500"
                        : "border-muted-foreground text-muted-foreground"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2 pl-6">
            {isAttempted ? (
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="font-medium mb-2">Your Answer:</div>
                <div className="text-muted-foreground">
                  {question.attempt?.answer_text}
                </div>
                <div className="mt-4 text-sm text-orange-600">
                  Awaiting teacher's grading
                </div>
              </div>
            ) : (
              <Textarea
                value={freeResponses[question.id] || ""}
                onChange={(e) =>
                  handleFreeResponseChange(question.id, e.target.value)
                }
                placeholder="Type your answer here..."
                rows={4}
                disabled={isDemo}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  // Handle chat scroll
  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  // Set initial chat position centered on screen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const centerX = Math.max(
        SIDEBAR_WIDTH,
        (window.innerWidth - DEFAULT_CHAT_WIDTH) / 2
      );
      const centerY = Math.max(
        0,
        (window.innerHeight - DEFAULT_CHAT_HEIGHT) / 2
      );
      setChatPos({ x: centerX, y: centerY });
    }
  }, []);

  // Add window resize handler to keep chat in bounds
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setChatPos((prev) => ({
          x: Math.min(prev.x, window.innerWidth - chatSize.width),
          y: Math.min(prev.y, window.innerHeight - chatSize.height),
        }));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [chatSize]);

  // Handle collapsed button drag
  useEffect(() => {
    if (!draggingCollapsed) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }
      const btn = collapsedBtnRef.current;
      if (btn) {
        const btnWidth = btn.offsetWidth;
        const minX = SIDEBAR_WIDTH + btnWidth;
        const maxX = window.innerWidth - btnWidth - COLLAPSED_BTN_MARGIN;
        setCollapsedX(
          Math.max(minX, Math.min(clientX - collapsedDragOffset, maxX))
        );
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
  }, [draggingCollapsed, collapsedDragOffset]);

  // Handle chat window drag
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

  // Handle chat window resize
  useEffect(() => {
    if (!resizing) return;

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

      if (resizeStart.current) {
        const newWidth = Math.max(
          MIN_CHAT_WIDTH,
          Math.min(
            MAX_CHAT_WIDTH,
            resizeStart.current.width + (clientX - resizeStart.current.x)
          )
        );
        const newHeight = Math.max(
          MIN_CHAT_HEIGHT,
          Math.min(
            MAX_CHAT_HEIGHT,
            resizeStart.current.height + (clientY - resizeStart.current.y)
          )
        );

        // Use requestAnimationFrame for smooth resizing
        requestAnimationFrame(() => {
          setChatSize({ width: newWidth, height: newHeight });
        });
      }
    };

    const handleUp = () => {
      setResizing(false);
      resizeStart.current = null;
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [resizing]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // For demo users, show a message about demo mode
    if (isDemo) {
      setChatMessages((prev) => [
        ...prev,
        { role: "user", content: chatInput },
        {
          role: "assistant",
          content: `### Demo Mode

This is a demo account. In the full version, you can interact with our AI tutor to:

• Get help understanding concepts
• Ask questions about the lesson
• Get hints for quiz questions
• Practice with additional examples
• Receive step-by-step explanations

Sign up for a full account to access the AI tutor!`,
        },
      ]);
      setChatInput("");
      return;
    }

    // Regular chat functionality for non-demo users
    const newMessages = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("Not authenticated");

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userId: userData.user.id,
          moduleId: module.id,
          lessonId: selectedLesson?.id,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.aiMessage) {
        setChatMessages((msgs) => [...msgs, data.aiMessage]);
      } else {
        throw new Error("No AI message in response");
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          content:
            err instanceof Error &&
            err.message.includes("HTTP error! status: 503")
              ? "### Error\nUnable to connect to AI service. Please check if the Ollama server is running."
              : "### Error\nError contacting AI service. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb and Progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/student" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/student/modules" className="hover:text-foreground">
              Modules
            </Link>
            <span>/</span>
            <span className="text-foreground">{module.title}</span>
          </div>
        </div>
      </div>

      {/* Lesson Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Lesson {currentLessonIndex + 1} of {totalLessons}
          </span>
          <span className="text-sm text-muted-foreground">
            Progress: {completedQuestions} of {totalQuestions} questions (
            {Math.round(progress * 100)}%)
          </span>
        </div>
        <Progress value={progress * 100} max={100} />
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6">
        {/* Lessons Sidebar */}
        <Card className="h-fit">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Lessons</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="p-2">
              {module.lessons?.map((lesson: any, index: number) => {
                const hasQuiz = lesson.quiz_questions?.length > 0;
                const isCompleted = hasQuiz && isLessonCompleted(lesson);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg hover:bg-muted group",
                      selectedLesson?.id === lesson.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm",
                          isCompleted
                            ? "bg-green-100 text-green-700"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {hasQuiz
                            ? `${lesson.quiz_questions.length} questions`
                            : "No quiz"}
                        </div>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="ml-auto h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* Main Content */}
        <div className="space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-[800px]"
          >
            <TabsList>
              <TabsTrigger value="lesson">Lesson</TabsTrigger>
              <TabsTrigger
                value="quiz"
                disabled={!selectedLesson?.quiz_questions?.length}
              >
                Quiz{" "}
                {selectedLesson?.quiz_questions?.length
                  ? `(${selectedLesson.quiz_questions.length})`
                  : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lesson" className="mt-4">
              <Card className="p-6">
                <h1 className="text-2xl font-bold mb-4">
                  {selectedLesson?.title}
                </h1>
                <div
                  className="prose dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: selectedLesson?.content }}
                />
              </Card>
            </TabsContent>

            <TabsContent value="quiz" className="mt-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Lesson Quiz</h2>
                {isDemo && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-800">
                      This is a demo account. Quiz submissions are disabled, but
                      you can still view the questions.
                    </p>
                  </div>
                )}
                {selectedLesson?.quiz_questions?.length ? (
                  <div className="space-y-8">
                    {selectedLesson.quiz_questions.map(
                      (question: any, index: number) =>
                        renderQuestion(question, index)
                    )}
                    <div className="flex justify-end">
                      <Button
                        size="lg"
                        onClick={() => setShowSubmitDialog(true)}
                        disabled={
                          isPreview || submitting || !isQuizComplete() || isDemo
                        }
                      >
                        {submitting ? "Submitting..." : "Submit Quiz"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No quiz available for this lesson
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* AI Chat Bot Section */}
      {!chatOpen ? (
        <div className="fixed right-0 bottom-0 w-full flex justify-end z-50 pointer-events-none">
          <button
            ref={collapsedBtnRef}
            className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all border border-primary pointer-events-auto select-none active:scale-95"
            style={{
              position: "absolute",
              left: collapsedX,
              bottom: 16,
              margin: 0,
              cursor: draggingCollapsed ? "grabbing" : "grab",
              zIndex: 100,
            }}
            onMouseDown={(e) => {
              setDraggingCollapsed(true);
              const btn = collapsedBtnRef.current;
              if (btn) {
                const rect = btn.getBoundingClientRect();
                setCollapsedDragOffset(e.clientX - rect.left);
              }
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              setDraggingCollapsed(true);
              const btn = collapsedBtnRef.current;
              if (btn && e.touches[0]) {
                const rect = btn.getBoundingClientRect();
                setCollapsedDragOffset(e.touches[0].clientX - rect.left);
              }
              e.preventDefault();
            }}
            onClick={() => !draggingCollapsed && setChatOpen(true)}
          >
            <Bot className="h-6 w-6" />
            <span className="sr-only">Open AI Tutor</span>
          </button>
        </div>
      ) : (
        <div
          ref={chatWindowRef}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: chatPos.x,
            top: chatPos.y,
            width: chatSize.width,
            height: chatSize.height,
            maxWidth: MAX_CHAT_WIDTH,
            minWidth: MIN_CHAT_WIDTH,
            maxHeight: MAX_CHAT_HEIGHT,
            minHeight: MIN_CHAT_HEIGHT,
            background: "var(--background)",
            border: "2.5px solid var(--primary)",
            borderRadius: 20,
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            cursor: draggingChat ? "grabbing" : "default",
            userSelect: resizing ? "none" : "auto",
            // Only transition specific properties and disable during resize/drag
            transition:
              resizing || draggingChat
                ? "none"
                : "box-shadow 0.2s ease, border-color 0.2s ease, left 0.2s ease, top 0.2s ease",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2 select-none bg-primary text-primary-foreground"
            style={{
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: 0.5,
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "move",
            }}
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
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" /> AI Tutor
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto px-4 py-3 bg-background"
            style={{
              borderBottom: "1.5px solid var(--primary)",
              minHeight: 120,
            }}
          >
            {isDemo && chatMessages.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <div className="flex items-center gap-2 font-medium mb-1">
                  <Bot className="h-4 w-4" />
                  Demo Mode Example
                </div>
                <p>
                  You're seeing an example interaction with our AI tutor. In the
                  full version, you can ask your own questions and get
                  personalized help!
                </p>
              </div>
            )}
            {chatMessages.length === 0 ? (
              <div className="text-muted-foreground text-center mt-8">
                How can I help you with this module?
              </div>
            ) : (
              <>
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } mb-4`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-md text-sm ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-card text-card-foreground border border-border"
                      }`}
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h3: ({ children }) => (
                              <h3 className="text-[#f97316] font-semibold text-lg mb-4">
                                {children}
                              </h3>
                            ),
                            p: ({ children, ...props }) => {
                              // Check if this paragraph contains "From the lesson:" text
                              const text = String(children);
                              if (text.startsWith("From the lesson:")) {
                                const [prefix, ...rest] =
                                  text.split("From the lesson:");
                                return (
                                  <div className="my-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                                    <span className="text-orange-600 font-medium">
                                      From the lesson:
                                    </span>
                                    <span className="text-foreground">
                                      {rest.join("")}
                                    </span>
                                  </div>
                                );
                              }
                              // Check if this is the "Would you like to:" section
                              if (/^would you like( me)? to:/i.test(text)) {

                                return (
                                  <div className="mb-4">
                                    <p className="mb-2">
                                      {text.split("Would you like to:")[0]}Would
                                      you like to:
                                    </p>
                                  </div>
                                );
                              }
                              return (
                                <p className="mb-4" {...props}>
                                  {children}
                                </p>
                              );
                            },
                            ul: ({ children }) => (
                              <ul className="space-y-2 mb-4">{children}</ul>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start pl-4">
                                <span className="text-orange-500 mr-2">•</span>
                                <span className="flex-1">{children}</span>
                              </li>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start mt-2">
                    <div className="rounded-lg px-3 py-2 max-w-xs text-sm bg-muted text-muted-foreground animate-pulse">
                      AI is typing...
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={chatEndRef} />
          </div>
          <form
            onSubmit={handleSendChat}
            className="flex items-center gap-2 px-3 py-3 bg-background border-t border-border"
          >
            <input
              type="text"
              className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              placeholder="Ask the AI tutor..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat(e);
                }
              }}
            />
            <Button type="submit" size="sm" disabled={!chatInput.trim()}>
              Send
            </Button>
          </form>
          {/* Resize handle */}
          <div
            onMouseDown={(e) => {
              setResizing(true);
              resizeStart.current = {
                x: e.clientX,
                y: e.clientY,
                width: chatSize.width,
                height: chatSize.height,
              };
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              if (e.touches[0]) {
                setResizing(true);
                resizeStart.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                  width: chatSize.width,
                  height: chatSize.height,
                };
              }
              e.stopPropagation();
              e.preventDefault();
            }}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 28,
              height: 28,
              cursor: "nwse-resize",
              zIndex: 10,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              background: "none",
              borderBottomRightRadius: 20,
              touchAction: "none", // Prevent touch scrolling while resizing
            }}
            tabIndex={-1}
          >
            <div
              style={{
                width: 18,
                height: 18,
                background: "var(--primary)",
                borderRadius: 6,
                margin: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 10L10 2"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M7 10H10V7"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Add the AlertDialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this quiz? This action cannot be
              undone, and you won't be able to change your answers after
              submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleQuizSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demo Notice Dialog */}
      <AlertDialog open={showDemoNotice} onOpenChange={setShowDemoNotice}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Demo Mode Example
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  You're seeing an example interaction with our AI tutor. This
                  shows how the AI tutor can help explain programming concepts
                  and guide your learning journey.
                </div>
                <div>In the full version, you can:</div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Ask your own questions about any topic</li>
                  <li>Get personalized help with exercises</li>
                  <li>Receive step-by-step explanations</li>
                  <li>Practice with interactive examples</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
