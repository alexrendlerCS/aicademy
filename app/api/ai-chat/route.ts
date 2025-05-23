import { NextRequest, NextResponse } from "next/server";
import { generateSystemPrompt } from "@/lib/ai-utils";

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

    console.log("🤖 Sending request to Ollama:", {
      model: "llama3",
      messageCount: messagesWithSystem.length,
      firstMessageRole: messagesWithSystem[0].role,
    });

    const ollamaRes = await fetch(
      "http://localhost:11434/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3",
          messages: messagesWithSystem,
          stream: false,
        }),
      }
    );

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
    const aiMessage = data.choices?.[0]?.message;

    console.log("✅ Received AI response:", {
      messageRole: aiMessage?.role,
      messageLength: aiMessage?.content?.length,
    });

    return NextResponse.json({ aiMessage });
  } catch (err) {
    console.error("❌ AI Chat Error:", err);

    // Determine if it's a known error type
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";

    // Check if it's a connection error
    const isConnectionError =
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("ECONNREFUSED");

    return NextResponse.json(
      {
        aiMessage: {
          role: "ai",
          content: isConnectionError
            ? "Unable to connect to AI service. Please check if the Ollama server is running."
            : "Error contacting AI service. Please try again.",
        },
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
