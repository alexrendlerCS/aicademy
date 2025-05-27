import { NextRequest, NextResponse } from "next/server";
import { generateSystemPrompt } from "@/lib/ai-utils";

// Helper function to ensure markdown formatting
function ensureMarkdownFormatting(content: string): string {
  // If the content already has proper markdown headers (without colons), return as is
  if (content.match(/^###\s+[\w\s]+\n/)) {
    return content;
  }

  // Extract sections from plain text response
  const sections = {
    topic: "",
    answer: "",
    quote: "",
    followUp: [] as string[],
  };

  const lines = content.split("\n");
  let currentSection = "";
  let inQuote = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Handle different variations of section headers
    if (
      trimmed.match(
        /^(###\s*)?(Functions|Variables|Loops|Arrays|Objects|[\w\s]+):?/i
      )
    ) {
      currentSection = "topic";
      sections.topic = trimmed
        .replace(/^(###\s*)?/i, "")
        .replace(/:$/, "")
        .trim();
    } else if (trimmed.startsWith(">")) {
      inQuote = true;
      sections.quote = sections.quote
        ? `${sections.quote}\n${trimmed}`
        : trimmed;
    } else if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      inQuote = false;
      // Split multiple bullet points if they're on the same line
      const bulletPoints = trimmed.split(/(?=\s*[•-])/);
      bulletPoints.forEach((point) => {
        if (point.trim()) {
          sections.followUp.push(point.trim().replace(/^[•-]\s*/, "• "));
        }
      });
    } else if (
      trimmed &&
      !inQuote &&
      currentSection === "topic" &&
      !sections.answer
    ) {
      sections.answer = trimmed;
    }
  }

  // Format response with proper markdown
  let formattedResponse = `### ${sections.topic || "Functions"}
${sections.answer || "Let me explain this concept"}

${
  sections.quote
    ? sections.quote
    : `> **From the lesson:**\n> This concept helps make your code more organized and efficient`
}

Would you like to:
${
  sections.followUp.length > 0
    ? sections.followUp.join("\n")
    : `• See a practical example?\n• Learn more about specific use cases?\n• Explore how this applies to your code?`
}`;

  // Ensure proper spacing between sections and bullet points
  formattedResponse = formattedResponse
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([•-].*?)([•-])/g, "$1\n$2")
    .replace(/Would you like to:\n?([^•\n])/g, "Would you like to:\n$1");

  return formattedResponse;
}

export async function POST(req: NextRequest) {
  console.log("📨 Received chat request");

  try {
    const body = await req.json();
    const { messages, userId, moduleId, lessonId } = body;

    // Validate required fields
    if (!userId || !moduleId) {
      console.error("❌ Missing required fields:", { userId, moduleId });
      return NextResponse.json(
        {
          error: "Missing required fields: userId and moduleId are required",
        },
        { status: 400 }
      );
    }

    console.log("📝 Request context:", {
      userId,
      moduleId,
      lessonId,
      messageCount: messages?.length || 0,
    });

    // Generate system prompt with context
    const systemPrompt = await generateSystemPrompt({
      userId,
      moduleId,
      lessonId,
    });

    // Add system prompt as first message
    const messagesWithSystem = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    console.log("🤖 Sending request to Ollama");

    const ollamaRes = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama2",
        messages: messagesWithSystem,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text();
      console.error("❌ Ollama server error:", {
        status: ollamaRes.status,
        statusText: ollamaRes.statusText,
        error: errorText,
      });
      throw new Error(
        `Ollama server error: ${ollamaRes.status} ${ollamaRes.statusText}`
      );
    }

    const data = await ollamaRes.json();
    console.log("✅ Received AI response:", {
      messageRole: data.message?.role,
      messageLength: data.message?.content?.length,
    });

    // Ensure proper markdown formatting
    const formattedContent = ensureMarkdownFormatting(
      data.message?.content || ""
    );

    const aiMessage = {
      role: "assistant",
      content: formattedContent,
    };

    return NextResponse.json({ aiMessage });
  } catch (err) {
    console.error("❌ AI Chat Error:", err);

    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";

    const isConnectionError =
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("ECONNREFUSED");

    return NextResponse.json(
      {
        aiMessage: {
          role: "assistant",
          content: isConnectionError
            ? "### Error\nUnable to connect to AI service. Please check if the Ollama server is running."
            : "### Error\nError contacting AI service. Please try again.",
        },
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
