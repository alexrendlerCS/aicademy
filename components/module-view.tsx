import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubjectIcon } from "@/components/subject-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
  const lessons = module.lessons || [];
  const currentLesson = lessons[currentLessonIndex];
  const isFirstLesson = currentLessonIndex === 0;
  const isLastLesson = currentLessonIndex === lessons.length - 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-8 md:grid-cols-5">
        <Card className="md:col-span-1 h-fit bg-muted/60">
          <CardContent className="p-4">
            <div className="font-medium mb-2">Lessons</div>
            <ul className="space-y-2">
              {lessons.map((lesson: any, index: number) => {
                const isCurrent = index === currentLessonIndex;
                return (
                  <li key={lesson.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-all border-2 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground border-primary shadow"
                          : "hover:bg-muted border-transparent"
                      }`}
                      onClick={() => setCurrentLessonIndex(index)}
                    >
                      <div
                        className={`flex items-center justify-center h-6 w-6 rounded-full text-xs transition-all ${
                          isCurrent
                            ? "bg-primary-foreground text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground border"
                        }`}
                      >
                        {index + 1}
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
                        (question: any, qIndex: number) => (
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
                                  (option: string, oIndex: number) => (
                                    <label
                                      key={oIndex}
                                      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-muted cursor-not-allowed opacity-70"
                                    >
                                      <input
                                        type="radio"
                                        disabled
                                        className="h-5 w-5 accent-primary"
                                      />
                                      <span className="text-base">
                                        {option}
                                      </span>
                                    </label>
                                  )
                                )
                              ) : (
                                <input
                                  type="text"
                                  disabled
                                  className="input input-bordered w-full max-w-xs px-3 py-2 rounded border text-base opacity-70 cursor-not-allowed"
                                  placeholder="Student answer will go here"
                                />
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                    {isPreview && (
                      <p className="text-muted-foreground text-sm">
                        This is a preview mode. Students will be able to submit
                        answers and track their progress here.
                      </p>
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
