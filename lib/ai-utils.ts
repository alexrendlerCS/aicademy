import { supabase } from "./supabaseClient";
import { searchLessonChunks, formatChunksForPrompt } from "./rag/search-lesson-chunks";

interface StudentContext {
  userId: string;
  moduleId: string;
  lessonId?: string;
}

export async function generateSystemPrompt(
  context: StudentContext,
  userQuery?: string
) {
  // Fetch student data
  const { data: studentData } = await supabase
    .from("students")
    .select("*")
    .eq("id", context.userId)
    .single();

  // Fetch module data (including subject for filtering)
  const { data: moduleData } = await supabase
    .from("modules")
    .select("*")
    .eq("id", context.moduleId)
    .single();

  // Fetch lesson data if lessonId is provided
  let lessonData = null;
  let relevantContent = "No lesson content provided";
  
  if (context.lessonId) {
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", context.lessonId)
      .single();
    lessonData = data;
    
    // Use RAG to retrieve relevant chunks if user query is provided
    if (userQuery && lessonData && moduleData) {
      // HYBRID APPROACH with SUBJECT FILTERING (Option C Enhanced):
      // Step 1: Try within current lesson with higher threshold (0.5)
      let chunks = await searchLessonChunks({
        query: userQuery,
        lessonId: context.lessonId,
        matchCount: 3,
        matchThreshold: 0.5,
        useServiceRole: true,
        subject: moduleData.subject, // FILTER BY SUBJECT
      });
      
      // Step 2: If we got fewer than 2 results, expand to module with lower threshold
      if (chunks.length < 2) {
        const moduleChunks = await searchLessonChunks({
          query: userQuery,
          moduleId: context.moduleId,
          matchCount: 3,
          matchThreshold: 0.4,
          useServiceRole: true,
          subject: moduleData.subject, // FILTER BY SUBJECT
        });
        
        // Merge and deduplicate
        const existingIds = new Set(chunks.map(r => r.id));
        const newChunks = moduleChunks.filter(r => !existingIds.has(r.id));
        chunks = [...chunks, ...newChunks].slice(0, 3);
      }
      
      if (chunks.length > 0) {
        relevantContent = formatChunksForPrompt(chunks);
      } else {
        // Fallback to full lesson content if no relevant chunks found
        relevantContent = lessonData.content || "No lesson content provided";
      }
    } else if (lessonData) {
      // If no query provided, use full lesson content (backward compatibility)
      relevantContent = lessonData.content || "No lesson content provided";
    }
  }

  // Fetch recent progress
  const { data: progressData } = await supabase
    .from("student_modules")
    .select("*")
    .eq("student_id", context.userId)
    .eq("module_id", context.moduleId)
    .single();

  // Fetch recent quiz scores
  const { data: quizScores } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("student_id", context.userId)
    .order("attempted_at", { ascending: false })
    .limit(5);

  // Calculate quiz performance
  const quizPerformance = quizScores?.length
    ? `${quizScores.filter((q) => q.is_correct).length}/${
        quizScores.length
      } correct`
    : "No recent attempts";

  // Calculate progress percentage
  const progressPercentage = progressData?.progress
    ? Math.round(progressData.progress * 100)
    : 0;

  const systemPrompt = `You are an AI learning coach built into an online course platform. Your goal is to provide clear, direct answers and engage students in a natural conversation about the concepts they're learning.

You have access to the following information:
- Student profile: ${studentData?.name || "Student"}, Level ${studentData?.level || "1"}
- Current module: ${moduleData?.title || "Current Module"}
- Current lesson: ${lessonData?.title || "Current Lesson"}
- Relevant lesson content: ${relevantContent}
- Recent progress: ${progressPercentage}% complete
- Recent quiz performance: ${quizPerformance}

FORMATTING INSTRUCTIONS:
1. Start with a clear topic header (e.g., "Functions", "Variables")
2. Give a concise explanation (2-3 sentences max)
3. Include a relevant lesson quote that reinforces the concept
4. End with engaging follow-up offers to help, such as:
   - Offering to show practical examples
   - Suggesting to explain related concepts
   - Proposing to break down complex parts
   - Offering to demonstrate real-world applications
5. Keep all responses brief and to the point
6. Use exact formatting shown below

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT:

### [Topic Name]

[Brief, clear explanation of the concept in 2-3 sentences]

From the lesson:
[Short, relevant quote that supports the explanation]

Would you like me to:
• Show you a practical example of [specific concept]?
• Help you understand [related concept] better?
• Demonstrate how this works in a real project?`;

  return systemPrompt;
}