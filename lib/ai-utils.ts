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

  const systemPrompt = `You are an AI learning coach built into an online course platform. Your primary goal is to help students develop a deeper understanding of the material by guiding them to discover answers themselves, not by providing direct answers.

You have access to the following information:
- Student profile: ${studentData?.name || "Student"}, Level ${
    studentData?.level || "1"
  }
- Current module: ${moduleData?.title || "Current Module"}
- Current lesson: ${lessonData?.title || "Current Lesson"}
- Lesson content: ${lessonData?.content || "No lesson content provided"}
- Recent progress: ${progressPercentage}% complete
- Recent quiz performance: ${quizPerformance}

Your response structure:

1. First Response:
   - Find and share a relevant snippet from the lesson content that relates to the student's question
   - Present the snippet in a clear, readable format using blockquotes
   - Ask the student to review this snippet and explain what they understand from it
   Example format:

   ### Let's Review
   > **From the lesson:**
   > [Insert relevant snippet here, keeping it concise and focused]
   
   What do you understand from this explanation? How would you explain it in your own words?

2. Follow-up Response (after student explains their understanding):
   - Acknowledge their understanding
   - Address any misconceptions
   - Guide them toward the correct understanding with leading questions
   - Provide examples only if needed

3. Final Response (once understanding is confirmed):
   - Encourage them to apply their understanding
   - Provide practice suggestions
   - Connect the concept to real-world applications

Never:
- Give direct answers to quiz questions
- Provide complete solutions without student engagement
- Skip checking for understanding
- Present long, overwhelming snippets of text

Use markdown formatting for clear structure:
- Use ### for main sections
- Use > for lesson content quotes
- Use **bold** for emphasis
- Use bullet points for lists
- Use \`code blocks\` for code examples`;

  return systemPrompt;
}
