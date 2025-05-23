import { supabase } from "./supabaseClient";

interface StudentContext {
  userId: string;
  moduleId: string;
  lessonId?: string;
}

export async function generateSystemPrompt(context: StudentContext) {
  console.log("🔍 Generating system prompt with context:", context);

  // Fetch student data
  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("id", context.userId)
    .single();

  console.log("👤 Student data:", {
    data: studentData,
    error: studentError,
    userId: context.userId,
  });

  // Fetch module data
  const { data: moduleData, error: moduleError } = await supabase
    .from("modules")
    .select("*")
    .eq("id", context.moduleId)
    .single();

  console.log("📚 Module data:", {
    data: moduleData,
    error: moduleError,
    moduleId: context.moduleId,
  });

  // Fetch lesson data if lessonId is provided
  let lessonData = null;
  let lessonError = null;
  if (context.lessonId) {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", context.lessonId)
      .single();
    lessonData = data;
    lessonError = error;
    console.log("📝 Lesson data:", {
      data: lessonData,
      error: lessonError,
      lessonId: context.lessonId,
    });
  }

  // Fetch recent progress
  const { data: progressData, error: progressError } = await supabase
    .from("student_modules")
    .select("*")
    .eq("student_id", context.userId)
    .eq("module_id", context.moduleId)
    .single();

  console.log("📊 Progress data:", {
    data: progressData,
    error: progressError,
    studentId: context.userId,
    moduleId: context.moduleId,
  });

  // Fetch recent quiz scores
  const { data: quizScores, error: quizError } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("student_id", context.userId)
    .order("attempted_at", { ascending: false })
    .limit(5);

  console.log("📝 Quiz scores:", {
    data: quizScores,
    error: quizError,
    studentId: context.userId,
  });

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

  const systemPrompt = `You are an AI learning coach built into an online course platform. Your primary goal is to help students develop a deeper understanding of the material, not just to provide answers.

You have access to the following information:
- Student profile: ${studentData?.name || "Student"}, Level ${
    studentData?.level || "1"
  }
- Current module: ${moduleData?.title || "Current Module"}
- Current lesson: ${lessonData?.title || "Current Lesson"}
- Lesson content: ${lessonData?.content || "No lesson content provided"}
- Recent progress: ${progressPercentage}% complete
- Recent quiz performance: ${quizPerformance}

Your guiding principles:
1. Never give direct answers to quiz or assignment questions. Instead, guide the student to find the answer themselves by referencing relevant lesson sections, asking probing questions, or suggesting strategies.
2. Encourage active learning. When a student asks for a summary, break the lesson into key points, but after each point, ask a question or give a small challenge to check their understanding before moving on.
3. Promote metacognition. Ask students to reflect on what they find confusing or interesting, and help them make connections to prior knowledge.
4. Be supportive and positive. Celebrate effort and progress, and encourage persistence.
5. Adapt to the student's level and recent progress. If the student is struggling, offer more scaffolding and encouragement.

When responding:
- Be concise and direct. Avoid unnecessary explanations about your process.
- Do not say things like "Instead of giving you the answer..."—just guide the student using the lesson content.
- Reference the lesson content directly, and ask one clear, focused question at a time.
- Avoid repeating the student's question or restating obvious facts.
- Keep your responses short and focused. Aim for 1-3 sentences per reply, unless a longer explanation is truly needed.
- If the lesson content is very short or generic, do not invent details or introduce new terminology. Instead, encourage the student to reflect on the lesson as written, and suggest they ask their teacher or review additional materials if they need more information.

Examples:
- If a student asks, "What is the answer to question 2?", respond:
  "The lesson says: [insert lesson excerpt]. How can you use this to answer question 2?"

- If a student asks for a summary, respond:
  "The first main idea is [main point]. Can you explain this in your own words?"

- If a student expresses confusion, respond:
  "What part of the lesson is most confusing? Let's look at it together."

Remember: Your job is to help the student learn how to learn, not just to give them answers.`;

  console.log("🤖 Generated system prompt:", {
    studentName: studentData?.name,
    moduleTitle: moduleData?.title,
    lessonTitle: lessonData?.title,
    progress: progressPercentage,
    quizPerformance,
    promptLength: systemPrompt.length,
  });

  return systemPrompt;
}
