import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubjectIcon } from "@/components/subject-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

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
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string | number>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const lessons = module.lessons || [];
  const currentLesson = lessons[currentLessonIndex];
  const isFirstLesson = currentLessonIndex === 0;
  const isLastLesson = currentLessonIndex === lessons.length - 1;

  const handleAnswerSelect = (questionId: string, answer: string | number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleQuizSubmit = async () => {
    if (isPreview) return;

    try {
      setSubmitting(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.error("You must be logged in to submit answers");
        return;
      }

      // Get all questions for this lesson
      const questions = currentLesson.quiz_questions || [];

      // Check if all questions are answered
      const unansweredQuestions = questions.filter(
        (q: any) => !selectedAnswers[q.id]
      );

      if (unansweredQuestions.length > 0) {
        toast.error("Please answer all questions before submitting");
        return;
      }

      // Submit each answer
      const submissionPromises = questions.map((question: any) => {
        const answer = selectedAnswers[question.id];
        const isCorrect =
          question.type === "multiple_choice"
            ? Number(answer) === question.correct_index
            : answer === question.correct_answer_text;

        return supabase.from("quiz_attempts").upsert(
          {
            student_id: userData.user.id,
            question_id: question.id,
            answer: answer.toString(),
            is_correct: isCorrect,
          },
          {
            onConflict: "student_id,question_id",
          }
        );
      });

      await Promise.all(submissionPromises);

      // Mark lesson as completed
      await supabase.from("lesson_progress").upsert(
        {
          student_id: userData.user.id,
          lesson_id: currentLesson.id,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "student_id,lesson_id",
        }
      );

      toast.success("Quiz submitted successfully!");

      // Clear selected answers
      setSelectedAnswers({});

      // Move to next lesson if available
      if (!isLastLesson) {
        setCurrentLessonIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-8 md:grid-cols-5">
        <Card className="md:col-span-1 h-fit bg-muted/60">
          <CardContent className="p-4">
            <div className="font-medium mb-2">Lessons</div>
            <ul className="space-y-2">
              {lessons.map((lesson: any, index: number) => {
                const isCurrent = index === currentLessonIndex;
                const isCompleted = !isPreview && lesson.progress?.completed;
                return (
                  <li key={lesson.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-all border-2 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground border-primary shadow"
                          : isCompleted
                          ? "bg-green-100 dark:bg-green-900/20 border-green-500/50"
                          : "hover:bg-muted border-transparent"
                      }`}
                      onClick={() => setCurrentLessonIndex(index)}
                    >
                      <div
                        className={`flex items-center justify-center h-6 w-6 rounded-full text-xs transition-all ${
                          isCurrent
                            ? "bg-primary-foreground text-primary border-2 border-primary"
                            : isCompleted
                            ? "bg-green-500 text-white border-none"
                            : "bg-muted text-muted-foreground border"
                        }`}
                      >
                        {isCompleted ? "✓" : index + 1}
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

        <div className="md:col-span-4 space-y-6">
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
                      className="prose dark:prose-invert max-w-none 
                        prose-headings:mb-2 prose-p:mb-2 prose-ul:my-2 prose-li:my-0 
                        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg 
                        prose-p:text-base prose-li:text-base
                        prose-pre:my-2 prose-code:text-sm
                        prose-img:my-2"
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
                      {currentLesson?.quiz_questions?.map(
                        (question: any, qIndex: number) => {
                          const existingAttempt =
                            !isPreview && question.attempt;
                          return (
                            <div key={question.id} className="space-y-3">
                              <div className="font-semibold text-lg">
                                Question {qIndex + 1}
                              </div>
                              <p className="mb-2 text-base">
                                {question.question}
                              </p>
                              <div className="space-y-2">
                                {question.type === "multiple_choice" ? (
                                  question.options?.map(
                                    (option: string, oIndex: number) => {
                                      const isSelected =
                                        selectedAnswers[question.id] === oIndex;
                                      const showCorrect = existingAttempt;
                                      const isCorrect =
                                        oIndex === question.correct_index;
                                      const wasSelected =
                                        existingAttempt?.answer ===
                                        oIndex.toString();

                                      return (
                                        <label
                                          key={oIndex}
                                          className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                                            isPreview
                                              ? "cursor-not-allowed opacity-70"
                                              : existingAttempt
                                              ? isCorrect
                                                ? "bg-green-100 dark:bg-green-900/20 border-green-500"
                                                : wasSelected
                                                ? "bg-red-100 dark:bg-red-900/20 border-red-500"
                                                : "border-muted"
                                              : isSelected
                                              ? "bg-primary/10 border-primary"
                                              : "hover:bg-muted/50 cursor-pointer"
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            disabled={
                                              isPreview || existingAttempt
                                            }
                                            checked={isSelected}
                                            onChange={() =>
                                              handleAnswerSelect(
                                                question.id,
                                                oIndex
                                              )
                                            }
                                            className="h-5 w-5 accent-primary"
                                          />
                                          <span className="text-base">
                                            {option}
                                          </span>
                                          {showCorrect &&
                                            (isCorrect || wasSelected) && (
                                              <span className="ml-auto">
                                                {isCorrect ? "✓" : "✗"}
                                              </span>
                                            )}
                                        </label>
                                      );
                                    }
                                  )
                                ) : (
                                  <div>
                                    <input
                                      type="text"
                                      disabled={isPreview || existingAttempt}
                                      value={selectedAnswers[question.id] || ""}
                                      onChange={(e) =>
                                        handleAnswerSelect(
                                          question.id,
                                          e.target.value
                                        )
                                      }
                                      className={`w-full px-3 py-2 rounded border text-base ${
                                        isPreview
                                          ? "opacity-70 cursor-not-allowed"
                                          : existingAttempt
                                          ? existingAttempt.is_correct
                                            ? "bg-green-100 dark:bg-green-900/20 border-green-500"
                                            : "bg-red-100 dark:bg-red-900/20 border-red-500"
                                          : ""
                                      }`}
                                      placeholder="Enter your answer"
                                    />
                                    {existingAttempt && (
                                      <div className="mt-2 text-sm">
                                        <span
                                          className={
                                            existingAttempt.is_correct
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }
                                        >
                                          Your answer: {existingAttempt.answer}
                                        </span>
                                        {!existingAttempt.is_correct && (
                                          <span className="text-green-600 ml-4">
                                            Correct answer:{" "}
                                            {question.correct_answer_text}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                    {isPreview ? (
                      <p className="text-muted-foreground text-sm">
                        This is a preview mode. Students will be able to submit
                        answers and track their progress here.
                      </p>
                    ) : (
                      currentLesson?.quiz_questions?.length > 0 &&
                      !currentLesson.progress?.completed && (
                        <Button
                          className="mt-6"
                          onClick={handleQuizSubmit}
                          disabled={submitting}
                        >
                          {submitting ? "Submitting..." : "Submit Quiz"}
                        </Button>
                      )
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setCurrentLessonIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={isFirstLesson}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous Lesson
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentLessonIndex((prev) =>
                  Math.min(lessons.length - 1, prev + 1)
                )
              }
              disabled={isLastLesson}
            >
              Next Lesson
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
