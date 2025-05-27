"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ModuleView from "@/app/(student)/student/modules/[id]/module-view";
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
            lessons(*)
          `
          )
          .eq("id", params.id)
          .single();

        if (error) {
          console.error("Error fetching module:", error);
          return;
        }

        setModule(moduleData);
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
    return <div>Module not found</div>;
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
