import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ModuleView from "@/components/module-view";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ModulePreviewDialogProps {
  moduleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModulePreviewDialog({
  moduleId,
  open,
  onOpenChange,
}: ModulePreviewDialogProps) {
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModule = async () => {
      if (!open) return; // Only fetch when dialog is open

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
                id,
                question,
                type,
                options,
                correct_index
              )
            )
          `
          )
          .eq("id", moduleId)
          .single();

        if (error) {
          console.error("Error fetching module:", error);
          return;
        }

        // Process the module data
        const processedModule = {
          ...moduleData,
          lessons: moduleData.lessons?.map((lesson: any) => ({
            ...lesson,
            quiz_questions: lesson.quiz_questions?.map((question: any) => ({
              ...question,
              // Parse options if stored as string
              options: Array.isArray(question.options)
                ? question.options
                : JSON.parse(question.options || "[]"),
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
  }, [moduleId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview: {module?.title}</span>
            <span className="text-sm text-muted-foreground font-normal">
              Preview Mode
            </span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !module ? (
          <div className="text-center py-8 text-muted-foreground">
            Module not found
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
