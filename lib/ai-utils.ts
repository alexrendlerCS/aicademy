import { supabase } from "./supabaseClient";

interface StudentContext {
  userId: string;
  moduleId: string;
  lessonId?: string;
}

export async function generateSystemPrompt(context: StudentContext) {
  // Fetch student data
  const { data: studentData } = await supabase
    .from("students")
    .select("*")
    .eq("id", context.userId)
    .single();

  // Fetch module data
  const { data: moduleData } = await supabase
    .from("modules")
    .select("*")
    .eq("id", context.moduleId)
    .single();

  // Fetch lesson data if lessonId is provided
  let lessonData = null;
  if (context.lessonId) {
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", context.lessonId)
      .single();
    lessonData = data;
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
- Student profile: ${studentData?.name || "Student"}, Level ${
    studentData?.level || "1"
  }
- Current module: ${moduleData?.title || "Current Module"}
- Current lesson: ${lessonData?.title || "Current Lesson"}
- Lesson content: ${lessonData?.content || "No lesson content provided"}
- Recent progress: ${progressPercentage}% complete
- Recent quiz performance: ${quizPerformance}

FORMATTING INSTRUCTIONS (DO NOT INCLUDE THESE IN YOUR RESPONSE):
1. Use a relevant topic name as the header (e.g., "Functions", "Variables", etc.)
2. NEVER use colons after the header
3. ALWAYS include a relevant lesson quote if available
4. Keep the answer concise and direct
5. End with 2-3 engaging follow-up questions
6. Use **bold** for emphasis
7. Use blockquotes (>) for lesson content
8. Never give direct answers to quiz questions
9. Keep responses focused and direct
10. Quote relevant lesson content
11. Each bullet point must be on its own line

YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT:

### [Topic/Concept Name]
[Direct, clear answer to the question]

> **From the lesson:**
> [Relevant quote from lesson content that helps explain the concept]

Would you like to:
• [First follow-up question]
• [Second follow-up question]
• [Third follow-up question]

Example response:

### Functions
Functions help you organize and reuse code by packaging it into reusable blocks. They make your code more efficient and easier to maintain.

> **From the lesson:**
> Functions are like recipes - they take ingredients (parameters), follow steps (code), and produce a result (return value).

Would you like to:
• See a practical example of how functions save time?
• Learn about different types of functions?
• Explore how to break down your code into functions?`;

  return systemPrompt;
}
