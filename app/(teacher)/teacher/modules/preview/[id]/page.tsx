"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectIcon } from "@/components/subject-icon";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { use as usePromise } from "react";

export default function ModulePreview({
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch module
      const { data: module, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();
      if (moduleError || !module) {
        setLoading(false);
        return;
      }
      setModuleData(module);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index", { ascending: true });
      if (lessonsError || !lessonsData) {
        setLoading(false);
        return;
      }
      setLessons(lessonsData);

      // Fetch quiz questions
      const quizMap: { [lessonId: string]: any[] } = {};
      for (const lesson of lessonsData) {
        const { data: questions } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("lesson_id", lesson.id);
        quizMap[lesson.id] = questions || [];
      }
      setQuizQuestions(quizMap);
      setLoading(false);
    };
    fetchData();
  }, [moduleId]);

  if (loading) {
    return <div className="p-8 text-center">Loading preview...</div>;
  }
  if (!moduleData) {
    return (
      <div className="p-8 text-center text-red-500">Module not found.</div>
    );
  }

  const currentLesson = lessons[currentLessonIndex];
  const isFirstLesson = currentLessonIndex === 0;
  const isLastLesson = currentLessonIndex === lessons.length - 1;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto space-y-6 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/teacher/modules">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <SubjectIcon subject={moduleData.subject} className="h-6 w-6" />
                <h1 className="text-2xl font-bold tracking-tight">
                  {moduleData.title}
                  <span className="ml-3 text-sm font-normal text-muted-foreground">
                    (Preview Mode)
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link
                  href="/teacher"
                  className="flex items-center hover:underline"
                >
                  <Home className="mr-1 h-3 w-3" />
                  Dashboard
                </Link>
                <span>/</span>
                <Link href="/teacher/modules" className="hover:underline">
                  Modules
                </Link>
                <span>/</span>
                <span className="truncate">{moduleData.title}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Lesson {currentLessonIndex + 1} of {lessons.length}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-5">
          <Card className="md:col-span-1 h-fit bg-muted/60">
            <CardContent className="p-4">
              <div className="font-medium mb-2">Lessons</div>
              <ul className="space-y-2">
                {lessons.map((lesson, index) => {
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
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg border border-muted cursor-not-allowed opacity-70"
                                      >
                                        <input
                                          type="radio"
                                          disabled
                                          className="h-5 w-5 accent-primary"
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
                      <div className="bg-muted/20 p-4 rounded-lg">
                        <p className="text-muted-foreground text-sm">
                          This is a preview mode. Students will be able to
                          submit answers and track their progress here.
                        </p>
                      </div>
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
    </div>
  );
}
