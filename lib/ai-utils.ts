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
- Student profile: ${studentData?.name || "Student"}, Level ${studentData?.level || "1"}
- Current module: ${moduleData?.title || "Current Module"}
- Current lesson: ${lessonData?.title || "Current Lesson"}
- Lesson content: ${lessonData?.content || "No lesson content provided"}
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