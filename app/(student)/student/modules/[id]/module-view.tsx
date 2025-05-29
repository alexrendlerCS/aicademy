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
} from "lucide-react";
import { SubjectIcon } from "@/components/subject-icon";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const MAX_CHAT_WIDTH = 600;
  const MAX_CHAT_HEIGHT = 700;
  const [chatSize, setChatSize] = useState({ width: 400, height: 420 });
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

  const progress = isPreview
    ? previewData?.progress || 0
    : module.progress?.progress || 0;

  const currentLessonIndex =
    module.lessons?.findIndex((l: any) => l.id === selectedLesson?.id) || 0;
  const totalLessons = module.lessons?.length || 0;

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    if (isPreview) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleFreeResponseChange = (questionId: string, text: string) => {
    if (isPreview) return;
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

  const renderQuestion = (question: any, index: number) => {
    const questionState = getQuestionState(question);
    const isAttempted = questionState !== "unattempted";
    const isCorrect = questionState === "correct";
    const isPending = questionState === "pending";

    return (
      <div key={question.id} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">
            Question {index + 1}: {question.question}
          </h3>
          {isAttempted && (
            <Badge
              variant={
                isCorrect ? "default" : isPending ? "outline" : "destructive"
              }
            >
              {isCorrect ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : isPending ? (
                <Clock className="h-3 w-3 mr-1" />
              ) : (
                <X className="h-3 w-3 mr-1" />
              )}
              {isCorrect
                ? "Correct"
                : isPending
                ? "Pending Review"
                : "Incorrect"}
            </Badge>
          )}
        </div>

        {question.type === "multiple_choice" ? (
          <div className="space-y-2">
            {question.options?.map((option: string, i: number) => {
              const isSelected =
                selectedAnswers[question.id] === i ||
                question.attempt?.selected_index === i;
              const showCorrect = isAttempted && i === question.correct_index;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    !isAttempted && "hover:bg-muted cursor-pointer",
                    isSelected && "bg-muted",
                    showCorrect && "border-green-500",
                    isSelected &&
                      !showCorrect &&
                      isAttempted &&
                      "border-red-500"
                  )}
                  onClick={() =>
                    !isAttempted && handleAnswerSelect(question.id, i)
                  }
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm",
                      showCorrect
                        ? "border-green-500 text-green-500"
                        : isSelected && isAttempted
                        ? "border-red-500 text-red-500"
                        : "border-primary text-primary"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span>{option}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="Type your answer here..."
              value={
                freeResponses[question.id] ||
                question.attempt?.answer_text ||
                ""
              }
              onChange={(e) =>
                handleFreeResponseChange(question.id, e.target.value)
              }
              disabled={isAttempted}
              className={cn(
                "min-h-[100px]",
                isAttempted &&
                  (isCorrect
                    ? "border-green-500"
                    : isPending
                    ? "border-yellow-500"
                    : "border-red-500")
              )}
            />
            {isAttempted && question.attempt?.feedback && (
              <div
                className={cn(
                  "text-sm p-2 rounded",
                  isCorrect
                    ? "bg-green-50 text-green-700"
                    : isPending
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-red-50 text-red-700"
                )}
              >
                <strong>Feedback:</strong> {question.attempt.feedback}
              </div>
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

  // Set initial chat position
  useEffect(() => {
    setChatPos({
      x: window.innerWidth / 2 - 320,
      y: window.innerHeight - 440,
    });
  }, []);

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
        setChatSize({ width: newWidth, height: newHeight });
      }
    };
    const handleUp = () => setResizing(false);
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
  }, [resizing]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
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

      {/* Lesson Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Lesson {currentLessonIndex + 1} of {totalLessons}
          </span>
          <span className="text-sm text-muted-foreground">
            Progress {Math.round(progress * 100)}%
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
                const quizCompleted = hasQuiz && lesson.progress?.completed;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg hover:bg-muted",
                      selectedLesson?.id === lesson.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {hasQuiz
                            ? `${lesson.quiz_questions.length} questions`
                            : "No quiz"}
                        </div>
                      </div>
                      {quizCompleted && (
                        <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedLesson?.content }}
                />
              </Card>
            </TabsContent>

            <TabsContent value="quiz" className="mt-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Lesson Quiz</h2>
                {selectedLesson?.quiz_questions?.length ? (
                  <div className="space-y-8">
                    {selectedLesson.quiz_questions.map(
                      (question: any, index: number) =>
                        renderQuestion(question, index)
                    )}
                    <div className="flex justify-end">
                      <Button
                        size="lg"
                        onClick={handleQuizSubmit}
                        disabled={isPreview || submitting || !isQuizComplete()}
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
            transition: draggingChat ? "none" : "box-shadow 0.2s",
            cursor: draggingChat ? "grabbing" : "default",
            userSelect: resizing ? "none" : "auto",
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
                              <h3 className="text-[#f97316] font-semibold text-lg border-b border-orange-100 pb-2 mb-3 mt-4">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-none space-y-2 mb-3 mt-2">
                                {children}
                              </ul>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start text-gray-700 text-sm mb-2">
                                <span className="text-[#f97316] mr-2 flex-shrink-0 mt-0.5">
                                  •
                                </span>
                                <span className="flex-1 whitespace-pre-line">
                                  {children}
                                </span>
                              </li>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="bg-orange-50 rounded-lg px-4 py-2 my-3 border-l-4 border-[#f97316]">
                                {children}
                              </blockquote>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-[#f97316]">
                                {children}
                              </strong>
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
    </div>
  );
}
