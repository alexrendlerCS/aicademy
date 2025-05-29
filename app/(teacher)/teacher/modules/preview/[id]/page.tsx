"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ModuleView from "@/components/module-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ModulePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true);
        const { data: moduleData, error } = await supabase
          .from("modules")
          .select(
            `
            *,
            lessons(
              *,
              quiz_questions(
                *,
                quiz_options(*)
              )
            )
          `
          )
          .eq("id", params.id)
          .single();

        if (error) {
          console.error("Error fetching module:", error);
          return;
        }

        // Process quiz options into the expected format
        const processedModule = {
          ...moduleData,
          lessons: moduleData.lessons?.map((lesson: any) => ({
            ...lesson,
            quiz_questions: lesson.quiz_questions?.map((question: any) => ({
              ...question,
              options:
                question.quiz_options?.map((opt: any) => opt.option_text) || [],
            })),
          })),
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
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8 text-muted-foreground">
          Module not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Preview: {module.title}</h1>
        </div>
        <div className="text-sm text-muted-foreground">Preview Mode</div>
      </div>

      <ModuleView
        module={module}
        isPreview={true}
        previewData={{
          progress: 0,
          completed: false,
          xpEarned: 0,
          quizAttempts: [],
        }}
      />
    </div>
  );
}
